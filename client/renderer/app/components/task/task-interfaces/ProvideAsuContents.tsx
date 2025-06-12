import { Grid2, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { fullUrl, useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { setParameter, useAsyncEffect, getTaskItem, mutateContainer } = useJob(
    job.id
  );
  const { update: setAsuContent } = getTaskItem("ASU_CONTENT");

  //const { value: ID_RMSValue } = getTaskItem("ID_RMS");

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  //const { data: HKLINDigest } = api.digest<any>(
  //  `jobs/${job.id}/digest?object_path=servalcat_pipe.inputData.HKLIN`
  //);

  //This magic means that the following variables will be kept up to date with the values of the associated parameters

  const handleNewASUCONTENTIN = useCallback(
    async (updatedItem: any) => {
      if (!setAsuContent) return;
      const { dbFileId } = valueOfItem(updatedItem);
      const digest = await fetch(
        fullUrl(`files/${dbFileId}/digest_by_uuid/`)
      ).then((response) => response.json());
      await setAsuContent(digest.seqList);
      mutateContainer();
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
          />
        </CContainerElement>
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Solvent analysis" }}
          containerHint="BlockLevel"
          initiallyOpen={true}
          size={{ xs: 12 }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="HKLIN"
            qualifiers={{ guiLabel: "MTZFile (for Matthews volumne calc)" }}
          />
        </CContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
