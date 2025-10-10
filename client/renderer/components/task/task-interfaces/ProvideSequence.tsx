import { Grid2, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "./task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { makeApiUrl, useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { apiGet } from "../../../api-fetch";
import { useCallback, useEffect, useMemo } from "react";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { useTaskItem, mutateContainer } = useJob(job.id);
  //const { value: ID_RMSValue } = useTaskItem("ID_RMS");

  const { value: SEQUENCETEXT, update: setSEQUENCETEXT } =
    useTaskItem("SEQUENCETEXT");

  const { value: SEQIN } = useTaskItem("SEQIN");
  const oldSEQIN = usePrevious(SEQIN);

  //First we define the callback function that will be used to update the SEQUENCETEXT parameter
  // It will fetch the sequence from the SEQIN file and update the SEQUENCETEXT parameter
  // It will also call the mutateContainer function to update the container
  // Note that the function is wrapped in a useCallback hook to prevent unnecessary re-renders
  //What happens is that when functions that come from hooks (here "setSEQUENCETEXT" and "mutateContainer")
  // become defined, the callback changes, but is not fired.  The callback is *only* fired when SEQIN
  // changes from one *defined* value to another

  const setSEQUENCEFromSEQIN = useCallback(async () => {
    if (!setSEQUENCETEXT) return;

    const seqinDigest = await apiGet(
      makeApiUrl(
        `jobs/${job.id}/digest?object_path=ProvideSequence.inputData.SEQIN`
      )
    );
    const newSequence = seqinDigest?.sequence || "";
    if (job?.status == 1 && newSequence !== SEQUENCETEXT) {
      await setSEQUENCETEXT(
        `>${seqinDigest?.identifier}\n${seqinDigest?.sequence}`.replace(
          "*",
          ""
        ) || ""
      );
      await mutateContainer();
    }
  }, [setSEQUENCETEXT, job, mutateContainer, SEQUENCETEXT]);

  //And here the useEffect which triggeers that callback*only( when SEQIN changes from one defined value to another)
  useEffect(() => {
    const asyncFunc = async () => {
      if (
        SEQIN &&
        oldSEQIN &&
        JSON.stringify(SEQIN) !== JSON.stringify(oldSEQIN)
      ) {
        console.log({ oldSEQIN, SEQIN });
        await setSEQUENCEFromSEQIN();
        await mutateContainer();
      }
    };
    asyncFunc();
  }, [SEQIN]);

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab label="Main inputs">
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Key files" }}
          containerHint="FolderLevel"
          initiallyOpen={true}
          size={{ xs: 12 }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="SEQUENCETEXT"
            qualifiers={{ guiLabel: "Sequence", guiMode: "multiLine" }}
            sx={{ minWidth: "100%", minHeight: "10rem" }}
          />

          <CCP4i2TaskElement
            {...props}
            itemName="SEQIN"
            qualifiers={{ guiLabel: "File from which to extract sequence" }}
          />

          <CCP4i2TaskElement
            {...props}
            itemName="XYZIN"
            qualifiers={{ guiLabel: "MTZFile (for Matthews volumne calc)" }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
