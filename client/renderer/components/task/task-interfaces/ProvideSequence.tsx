import { Grid2, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../contexts/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { fullUrl, useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const {
    setParameter,
    useAsyncEffect,
    getTaskItem,
    getFileDigest,
    mutateContainer,
  } = useJob(job.id);
  //const { value: ID_RMSValue } = getTaskItem("ID_RMS");

  const { value: SEQUENCETEXT, update: setSEQUENCETEXT } =
    getTaskItem("SEQUENCETEXT");

  const { value: SEQIN } = getTaskItem("SEQIN");
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

    const seqinDigest = await fetch(
      fullUrl(
        `jobs/${job.id}/digest?object_path=ProvideSequence.inputData.SEQIN`
      )
    ).then((response) => response.json());
    const newSequence = seqinDigest?.digest?.sequence || "";
    if (job?.status == 1 && newSequence !== SEQUENCETEXT) {
      await setSEQUENCETEXT(
        `>${seqinDigest?.digest?.identifier}\n${seqinDigest?.digest?.sequence}`.replace(
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
      <CCP4i2Tab tab="Main inputs">
        <CContainerElement
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
        </CContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
