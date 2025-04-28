import { CCP4i2TaskInterfaceProps } from "../task-container";
import {
  CCP4i2TaskElement,
  CCP4i2TaskElementProps,
} from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { doRetrieve, useApi, fullUrl } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";
import { ParseMtz } from "../task-elements/parse-mtz";
import { Job } from "../../../models";
import { Grid2 } from "@mui/material";
import { useState } from "react";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { getFileDigest, getTaskItem, setParameter } = useJob(job.id);
  //@ts-ignore
  const [HKLINFile, setHKLINFile] = useState<File | null>(null);
  const { mutate: mutateContainer } = api.get_wrapped_endpoint_json<any>({
    type: "jobs",
    id: props.job.id,
    endpoint: "container",
  });

  const { item: HKLINItem } = getTaskItem("HKLIN");

  const { data: HKLINDigest } = getFileDigest(HKLINItem?._objectPath);

  const { item: HKLIN_OBSItem, value: HKLIN_OBSValue } =
    getTaskItem("HKLIN_OBS");

  const OldHKLINDigest: any = usePrevious(HKLINDigest);

  const { item: SPACEGROUPItem, value: SPACEGROUPValue } =
    getTaskItem("SPACEGROUP");

  const { item: UNITCELLItem, value: UNITCELLValue } = getTaskItem("UNITCELL");

  const { item: WAVELENGTHItem, value: WAVELENGTHValue } =
    getTaskItem("WAVELENGTH");

  const { item: HKLIN_FORMATItem, value: HKLIN_FORMATValue } =
    getTaskItem("HKLIN_FORMAT");

  const HKLIN_OBSSet = useMemo(() => {
    return Boolean(HKLIN_OBSValue?.baseName || HKLIN_OBSValue?.dbFileId);
  }, [HKLIN_OBSValue]);

  const HKLIN_fileName = useMemo<string | null>(() => {
    if (HKLINItem?._value?.baseName) {
      return HKLINItem._value.baseName._value;
    }
    return null;
  }, [HKLINItem]);

  const HKLIN_dbFileId = useMemo<string | null>(() => {
    if (HKLINItem?._value?.baseName) {
      return HKLINItem._value.dbFileId._value;
    }
    return null;
  }, [HKLINItem]);

  //Here handle a case where a new MTZ file is uploaded as HKLIN
  useEffect(() => {
    const asyncFunc = async () => {
      if (!HKLINDigest) return;
      if (!HKLIN_fileName) return;
      if (!setParameter) return;

      if (JSON.stringify(HKLINDigest) !== JSON.stringify(OldHKLINDigest)) {
        if (HKLINDigest?.digest?.format === "mtz") {
          if (!HKLIN_OBSSet) {
            const downloadURL = `files/${HKLIN_dbFileId}/download_by_uuid/`;
            const retrievedFile = await doRetrieve(
              fullUrl(downloadURL),
              HKLINItem._value.baseName._value
            );
            const blob = new Blob([retrievedFile], {
              type: "application/CCP4-mtz-file",
            });
            const file = new File([blob], HKLIN_fileName, {
              type: "application/CCP4-mtz-file",
            });
            setHKLINFile(file);
          }
        }
        let parametersChanged = false;
        if (SPACEGROUPValue !== HKLINDigest.digest.spaceGroup) {
          const setParameterArg = {
            value: HKLINDigest.digest.spaceGroup.replace(/\s+/g, ""),
            object_path: SPACEGROUPItem._objectPath,
          };
          await setParameter(setParameterArg);
          parametersChanged = true;
        }
        if (WAVELENGTHValue !== HKLINDigest.digest.wavelength) {
          await setParameter({
            value: HKLINDigest.digest.wavelength,
            object_path: WAVELENGTHItem._objectPath,
          });
          parametersChanged = true;
        }
        if (HKLIN_FORMATValue !== HKLINDigest.digest.format.toUpperCase()) {
          await setParameter({
            value: HKLINDigest.digest.format.toUpperCase(),
            object_path: HKLIN_FORMATItem._objectPath,
          });
          parametersChanged = true;
        }
        if (
          JSON.stringify(UNITCELLValue) !==
          JSON.stringify(HKLINDigest.digest.cell)
        ) {
          await setParameter({
            value: HKLINDigest.digest.cell,
            object_path: UNITCELLItem._objectPath,
          });
          parametersChanged = true;
        }
        if (parametersChanged) {
          await mutateContainer();
        }
      }
    };
    asyncFunc();
  }, [
    HKLINDigest,
    OldHKLINDigest,
    HKLIN_OBSSet,
    HKLIN_fileName,
    SPACEGROUPValue,
    SPACEGROUPItem,
    UNITCELLValue,
    UNITCELLItem,
    setParameter,
  ]);

  const handleAccept = useCallback(
    async (signature: string) => {
      if (HKLINFile) {
        const formData = new FormData();
        if (signature && signature.trim().length > 0)
          formData.append("column_selector", signature);
        formData.append("objectPath", HKLIN_OBSItem._objectPath);
        formData.append("file", HKLINFile, HKLINFile.name);
        const uploadResult = await api.post<Job>(
          `jobs/${job.id}/upload_file_param`,
          formData
        );
        setHKLINFile(null);
        mutateContainer();
      }
    },
    [job, HKLINFile, HKLIN_OBSItem]
  );

  return (
    <>
      <CCP4i2Tabs {...props}>
        <CCP4i2Tab tab="Main inputs" key="1">
          <CContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Input data", initiallyOpen: true }}
            key="Input data"
            containerHint="FolderLevel"
          >
            <CCP4i2TaskElement
              {...props}
              key="HKLIN"
              itemName="HKLIN"
              qualifiers={{ guiLabel: "Reflections" }}
            />
            <CContainerElement
              itemName=""
              key="Enter additional"
              {...props}
              containerHint="BlockLevel"
              qualifiers={{ guiLabel: "Enter additional information" }}
            >
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 6, md: 4 }}>
                  <CCP4i2TaskElement
                    {...props}
                    key="SPACEGROUP"
                    itemName="SPACEGROUP"
                    qualifiers={{ guiLabel: "Space group" }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 6, md: 8 }}>
                  <CCP4i2TaskElement
                    {...props}
                    key="UNITCELL"
                    itemName="UNITCELL"
                  />
                </Grid2>
              </Grid2>
            </CContainerElement>
            <CCP4i2TaskElement
              {...props}
              key="HKLIN_FORMAT"
              itemName="HKLIN_FORMAT"
              qualifiers={{ guiLabel: "HKLIN format" }}
            />
            {HKLINDigest?.digest?.format === "mtz" && (
              <CCP4i2TaskElement
                {...props}
                key="HKLIN_OBS"
                itemName="HKLIN_OBS"
                qualifiers={{ guiLabel: "Parsed MTZ file" }}
              />
            )}
            {HKLINDigest?.digest?.format === "mmcif" && (
              <>
                <MmcifPanel {...props} itemName="" digest={HKLINDigest} />
              </>
            )}
          </CContainerElement>
        </CCP4i2Tab>
      </CCP4i2Tabs>
      {HKLINFile && (
        <ParseMtz
          file={HKLINFile}
          setFiles={() => {}}
          handleAccept={handleAccept}
          handleCancel={() => {
            setHKLINFile(null);
          }}
          item={HKLIN_OBSItem}
        />
      )}
    </>
  );
};

interface MmcifPanelProps extends CCP4i2TaskElementProps {
  digest: any;
}

const MmcifPanel: React.FC<MmcifPanelProps> = (props) => {
  const { digest, job } = props;
  return (
    digest?.digest?.rblock_infos && (
      <CCP4i2TaskElement
        {...props}
        key="MMCIF_SELECTED_BLOCK"
        itemName="MMCIF_SELECTED_BLOCK"
        qualifiers={{
          guiLabel: "Selected block",
          guiMode: "multiLineRadio",
          onlyEnumerators: true,
          enumerators: digest.digest.rblock_infos.map(
            (info: { bname: string }) => info.bname
          ),
        }}
      />
    )
  );
};

export default TaskInterface;
