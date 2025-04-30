import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  //const { data: HKLINDigest } = api.digest<any>(
  //  `jobs/${job.id}/digest?object_path=servalcat_pipe.inputData.HKLIN`
  //);

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const { setParameter, useAsyncEffect, getTaskItem, getFileDigest } = useJob(
    job.id
  );

  const { value: HKLINValue } = getTaskItem("servalcat_pipe.inputData.HKLIN");

  const intensitiesAvailable = useMemo(() => {
    return [1, 3].includes(HKLINValue?.contentFlag);
  }, [HKLINValue]);

  return (
    <CCP4i2Tabs>
      <CCP4i2Tab tab="Input data">
        <CContainerElement
          {...props}
          itemName=""
          containerHint="BlockLevel"
          qualifiers={{ guiLabel: "Main inputs" }}
        >
          <div
            style={{
              borderRadius: "0.5rem",
              padding: "1rem",
              border: "3px solid grey",
            }}
          >
            <CCP4i2TaskElement
              {...props}
              itemName="servalcat_pipe.inputData.XYZIN"
            />
          </div>
          <div
            style={{
              borderRadius: "0.5rem",
              padding: "1rem",
              border: "3px solid grey",
            }}
          >
            <CCP4i2TaskElement {...props} itemName="HKLIN" />
            {intensitiesAvailable ? (
              <CCP4i2TaskElement
                {...props}
                itemName="F_SIGF_OR_I_SIGI"
                qualifiers={{ guiLabel: "Refinement against" }}
              />
            ) : (
              <Typography variant="body1">
                Using <b>amplitudes</b>
              </Typography>
            )}
            <CCP4i2TaskElement {...props} itemName="FREERFLAG" />
          </div>
        </CContainerElement>
        <CContainerElement
          {...props}
          itemName=""
          containerHint="BlockLevel"
          qualifiers={{ guiLabel: "Additional geomtery dictionaries" }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="DICT_LIST"
            qualifiers={{ guiLabel: "Dictionaries" }}
          />
        </CContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
