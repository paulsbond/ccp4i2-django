import {
  Grid2,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { fullUrl, useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";

const auVolume = (
  cell: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  },
  spacegroup: string
) => {
  // Calculates the volume of the asymmetric unit given cell parameters and space group name.
  // cell: {a, b, c, alpha, beta, gamma} (lengths in Å, angles in degrees)
  // spacegroup: string (used to determine Z, the number of asymmetric units per unit cell)

  if (
    !cell ||
    typeof cell.a !== "number" ||
    typeof cell.b !== "number" ||
    typeof cell.c !== "number" ||
    typeof cell.alpha !== "number" ||
    typeof cell.beta !== "number" ||
    typeof cell.gamma !== "number" ||
    !spacegroup
  ) {
    alert(
      `Invalid cell parameters or space group name. Please check the input values. ${JSON.stringify(
        cell
      )} ${spacegroup}`
      //       `Invalid cell parameters or space group name. Please check the"
    );
    return undefined;
  }
  const { a, b, c, alpha, beta, gamma } = cell;
  const rad = (deg: number) => (Math.PI * deg) / 180;
  const cosA = Math.cos(rad(alpha));
  const cosB = Math.cos(rad(beta));
  const cosG = Math.cos(rad(gamma));
  const volume =
    a *
    b *
    c *
    Math.sqrt(
      1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG
    );
  // Z values for all 63 macromolecular space groups (short Hermann–Mauguin names)
  // Source: International Tables for Crystallography, Vol. A
  const zLookup: { [key: string]: number } = {
    P1: 1,
    "P-1": 1,
    P2: 2,
    P21: 2,
    C2: 4,
    P222: 4,
    P21212: 4,
    P212121: 4,
    C2221: 8,
    C222: 8,
    F222: 16,
    I222: 8,
    I212121: 8,
    P4: 4,
    P41: 4,
    P42: 4,
    P43: 4,
    I4: 8,
    I41: 8,
    "P-4": 4,
    "I-4": 8,
    P422: 8,
    P4212: 8,
    P4122: 8,
    P41212: 8,
    P4222: 8,
    P42212: 8,
    P4322: 8,
    P43212: 8,
    I422: 16,
    I4122: 16,
    P3: 3,
    P31: 3,
    P32: 3,
    R3: 3,
    "P-3": 3,
    "R-3": 3,
    P312: 6,
    P321: 6,
    P3112: 6,
    P3121: 6,
    P3212: 6,
    P3221: 6,
    R32: 6,
    P6: 6,
    P61: 6,
    P65: 6,
    P62: 6,
    P64: 6,
    P63: 6,
    "P-6": 6,
    P622: 12,
    P6122: 12,
    P6522: 12,
    P6222: 12,
    P6422: 12,
    P6322: 12,
    P23: 4,
    F23: 16,
    I23: 8,
    P213: 4,
    I213: 8,
    P432: 8,
    P4232: 8,
    F432: 32,
    F4132: 32,
    I432: 16,
    P4332: 8,
    P4132: 8,
    I4132: 16,
  };

  // Normalize space group name for lookup
  const normalizedSG = spacegroup.replace(/[\s\-]/g, "").toUpperCase();
  let Z = 1;
  for (const key in zLookup) {
    if (normalizedSG === key.replace(/[\s\-]/g, "").toUpperCase()) {
      Z = zLookup[key];
      break;
    }
  }

  const asuVolume = volume / Z;
  return asuVolume;
};

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { getTaskItem, mutateContainer } = useJob(job.id);
  const { update: setAsuContent } = getTaskItem("ASU_CONTENT");

  //const { value: ID_RMSValue } = getTaskItem("ID_RMS");

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  const { data: HKLINDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=ProvideAsuContents.inputData.HKLIN`
  );
  const oldHKLINDigest = usePrevious(HKLINDigest?.digest);

  const { data: molWeight, mutate: mutateMolWeight } = useSWR(
    `/api/proxy/jobs/${job.id}/object_method/`,
    (url) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          object_path: "ProvideAsuContents.inputData.ASU_CONTENT",
          method_name: "molecularWeight",
        }),
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Failed to fetch molecular weight");
      })
  );

  const { data: matthewsAnalysis, mutate: mutateMatthewsAnalysis } = useSWR(
    [`/api/proxy/jobs/${job.id}/object_method/`, molWeight?.result],
    ([url, molWeightResult]) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          object_path: "ProvideAsuContents.inputData.HKLIN.fileContent",
          method_name: "matthewsCoeff",
          kwargs: { molWt: molWeightResult },
        }),
      }).then(async (response) => {
        if (response.ok) {
          const analysis = await response.json();
          return analysis;
        }
        throw new Error("Failed to fetch matthews analysis");
      }),
    { keepPreviousData: true }
  );

  const oldMolecularWeight = usePrevious(molWeight?.result);
  useEffect(() => {
    if (
      molWeight?.result &&
      molWeight.result !== oldMolecularWeight &&
      JSON.stringify(HKLINDigest?.digest) !== JSON.stringify(oldHKLINDigest)
    ) {
      alert("useEfect noticed");
    }
  }, [molWeight, oldMolecularWeight, HKLINDigest, oldHKLINDigest, props]);

  const handleNewASUCONTENTIN = useCallback(
    async (updatedItem: any) => {
      if (!setAsuContent) return;
      const { dbFileId } = valueOfItem(updatedItem);
      if (dbFileId) {
        const digest = await fetch(
          fullUrl(`files/${dbFileId}/digest_by_uuid/`)
        ).then((response) => response.json());
        //Note here I filter out the source file information, which may not be properly formed
        await setAsuContent(
          digest.seqList.map((seq: any) => {
            return {
              name: seq.name,
              sequence: seq.sequence,
              polymerType: seq.polymerType,
              description: seq.description,
              nCopies: seq.nCopies,
            };
          })
        );
        mutateContainer();
      }
      mutateMolWeight();
    },
    [setAsuContent]
  );

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab tab="Main inputs">
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{
            guiLabel: "Optionally load existing AU content file to edit",
          }}
          containerHint="BlockLevel"
          initiallyOpen={true}
          size={{ xs: 12 }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="ASUCONTENTIN"
            qualifiers={{ guiLabel: "ASU contents" }}
            onParameterChangeSuccess={handleNewASUCONTENTIN}
          />
        </CContainerElement>
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{
            guiLabel:
              "Specify the protein/nucleic acid sequences in the crystal",
          }}
          containerHint="FolderLevel"
          initiallyOpen={true}
          size={{ xs: 12 }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="ASU_CONTENT"
            qualifiers={{ guiLabel: "ASU contents" }}
            onParameterChangeSuccess={() => {
              mutateMolWeight();
            }}
          />
        </CContainerElement>
        <Typography>
          Molecular weight:{" "}
          {molWeight?.result ? molWeight.result?.toFixed(2) : ""}
        </Typography>
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Solvent analysis" }}
          containerHint="BlockLevel"
          initiallyOpen={true}
          size={{ xs: 12 }}
        >
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, sm: 8 }}>
              <CCP4i2TaskElement
                {...props}
                itemName="HKLIN"
                qualifiers={{ guiLabel: "MTZFile (for Matthews volumne calc)" }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 4 }}>
              {matthewsAnalysis?.status === "Success" ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Multiplier</TableCell>
                      <TableCell>%Solvent</TableCell>
                      <TableCell>Probability</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matthewsAnalysis?.result?.results.map((result) => (
                      <TableRow key={result.nmol_in_asu}>
                        <TableCell>{result.nmol_in_asu}</TableCell>
                        <TableCell>
                          {result.percent_solvent.toFixed(2)}
                        </TableCell>
                        <TableCell>{result.prob_matth.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                "Provide MTZ file to calculate Matthews coefficient"
              )}
            </Grid2>
          </Grid2>
        </CContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
