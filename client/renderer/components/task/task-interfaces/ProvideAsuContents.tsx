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
import { CCP4i2TaskInterfaceProps } from "./task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { makeApiUrl, useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { apiPost, apiGet } from "../../../api-fetch";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { useTaskItem, mutateContainer, useFileDigest } = useJob(job.id);
  const { update: setAsuContent } = useTaskItem("ASU_CONTENT");

  const { data: HKLINDigest } = useFileDigest(
    `ProvideAsuContents.inputData.HKLIN`
  );

  /**
   * Fetches the molecular weight for the current job's ASU content using SWR.
   *
   * Uses the `useSWR` hook to send a POST request to the backend API endpoint
   * `/api/proxy/jobs/${job.id}/object_method/` with the required payload to invoke
   * the `molecularWeight` method on the `ProvideAsuContents.inputData.ASU_CONTENT` object.
   *
   * @returns
   *   - `data: molWeight` - The fetched molecular weight value, or `undefined` if not yet loaded.
   *   - `mutate: mutateMolWeight` - Function to manually revalidate or update the molecular weight data.
   *
   * @throws
   *   Throws an error if the response from the API is not successful.
   */
  const { data: molWeight, mutate: mutateMolWeight } = useSWR(
    `/api/proxy/jobs/${job.id}/object_method/`,
    (url) =>
      apiPost(url, {
        object_path: "ProvideAsuContents.inputData.ASU_CONTENT",
        method_name: "molecularWeight",
      })
  );

  /**
   * Fetches and caches the Matthews coefficient analysis for the current job using SWR.
   *
   * @remarks
   * This hook uses the SWR library to fetch data from the backend API endpoint
   * `/api/proxy/jobs/${job.id}/object_method/` via a POST request. The request body
   * includes the object path and method name required for the analysis, along with
   * the molecular weight as a parameter. The response is expected to be a JSON object
   * containing the Matthews analysis results.
   *
   * @param job.id - The unique identifier for the current job.
   * @param molWeight?.result - The calculated molecular weight to be used in the analysis.
   * @param HKLINDigest - The digest of the HKLIN file, used as a cache key dependency.
   *
   * @returns
   * - `data: matthewsAnalysis` - The result of the Matthews coefficient analysis, or `undefined` if not yet loaded.
   * - `mutate: mutateMatthewsAnalysis` - A function to manually revalidate or update the cached data.
   *
   * @throws
   * Throws an error if the API request fails.
   *
   * @see https://swr.vercel.app/ for more information about SWR.
   */
  const { data: matthewsAnalysis, mutate: mutateMatthewsAnalysis } = useSWR(
    [
      `/api/proxy/jobs/${job.id}/object_method/`,
      molWeight?.result,
      HKLINDigest,
    ],
    ([url, molWeightResult, hklinDigest]) =>
      apiPost(url, {
        object_path: "ProvideAsuContents.inputData.HKLIN.fileContent",
        method_name: "matthewsCoeff",
        kwargs: { molWt: molWeightResult },
      }),
    { keepPreviousData: true }
  );

  const handleNewASUCONTENTIN = useCallback(
    async (updatedItem: any) => {
      if (!setAsuContent) return;
      const { dbFileId } = valueOfItem(updatedItem);
      if (dbFileId) {
        const digest = await apiGet(
          makeApiUrl(`files/${dbFileId}/digest_by_uuid/`)
        );
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
      <CCP4i2Tab label="Main inputs">
        <CCP4i2ContainerElement
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
            onChange={handleNewASUCONTENTIN}
          />
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
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
            onChange={() => {
              mutateMolWeight();
            }}
          />
        </CCP4i2ContainerElement>
        <Typography>
          Molecular weight:{" "}
          {molWeight?.result ? molWeight.result?.toFixed(2) : ""}
        </Typography>
        <CCP4i2ContainerElement
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
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
