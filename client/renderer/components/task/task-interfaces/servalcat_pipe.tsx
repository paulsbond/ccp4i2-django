import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect, useMemo } from "react";
import {
  ProcessErrorsCallback,
  useRunCheck,
} from "../../../providers/run-check-provider";

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
  const { value: MAP_SHARP } = getTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM } = getTaskItem("MAP_SHARP_CUSTOM");

  const intensitiesAvailable = useMemo(() => {
    return [1, 3].includes(HKLINValue?.contentFlag);
  }, [HKLINValue]);

  const { processErrorsCallback, setProcessErrorsCallback } = useRunCheck();

  const myProcessErrorsCallback: ProcessErrorsCallback = (validation) => {
    // This function is called to process errors from the run check
    // It can be customized to handle errors in a specific way
    // Here, it filters a known "spurious" error from the validation object
    // and returns the rest of the validation errors.
    const processedErrors = validation
      ? Object.fromEntries(
          Object.entries(validation).filter(
            ([key]) =>
              key !== "servalcat_pipe.metalCoordWrapper.inputData.XYZIN"
          )
        )
      : {};
  };

  useEffect(() => {
    setProcessErrorsCallback(() => myProcessErrorsCallback);
    return () => {
      if (processErrorsCallback) setProcessErrorsCallback(null);
    };
  }, []);

  return (
    <CCP4i2Tabs>
      <CCP4i2Tab label="Input data">
        <CCP4i2ContainerElement
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
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          containerHint="BlockLevel"
          size={{ xs: 12 }}
          qualifiers={{ guiLabel: "Additional geomtery dictionaries" }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="DICT_LIST"
            qualifiers={{ guiLabel: "Dictionaries" }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
      <CCP4i2Tab label="Output" key="Output">
        <CCP4i2TaskElement
          {...props}
          itemName="USE_NCS"
          qualifiers={{
            guiLabel: "Use NCS if present",
          }}
          visibility={() => true}
          key="USE_NCS"
        />
        <CCP4i2TaskElement
          {...props}
          itemName="USE_TWIN"
          visibility={() => true}
          key="USE_TWIN"
        />
        <CCP4i2ContainerElement
          key="Output options"
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Output options" }}
          containerHint="BlockLevel"
        >
          <CCP4i2TaskElement
            {...props}
            itemName="OUTPUT_HYDROGENS"
            qualifiers={{
              guiLabel: "Output calculated riding hydrogens to file",
            }}
          />
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          itemName=""
          key="Map calculation"
          {...props}
          qualifiers={{ guiLabel: "Map calculation" }}
          containerHint="BlockLevel"
        >
          <CCP4i2TaskElement
            {...props}
            itemName="MAP_SHARP"
            qualifiers={{
              guiLabel: "Perform map sharpening when calculating maps",
            }}
            key="MAP_SHARP"
          />

          <Grid2 container key="Sharpen row">
            <Grid2 size={{ xs: 6 }} key="Col1">
              <CCP4i2TaskElement
                {...props}
                itemName="MAP_SHARP_CUSTOM"
                qualifiers={{
                  guiLabel: "Use custom sharpening parameter (B-factor)",
                }}
                visibility={() => MAP_SHARP}
                key="MAP_SHARP_CUSTOM"
              />
            </Grid2>
            <Grid2 size={{ xs: 6 }} key="Col2">
              <CCP4i2TaskElement
                {...props}
                itemName="BSHARP"
                qualifiers={{ guiLabel: "B factor to use" }}
                visibility={() => MAP_SHARP && MAP_SHARP_CUSTOM}
                key="BSHARP"
              />
            </Grid2>
          </Grid2>
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          itemName=""
          {...props}
          qualifiers={{ guiLabel: "Validation and analysis" }}
          containerHint="BlockLevel"
          size={{ xs: 4 }}
          elementSx={{ minWidth: "8rem" }}
          key="Validation"
        >
          <CCP4i2TaskElement
            key={1}
            {...props}
            itemName="VALIDATE_BAVERAGE"
            qualifiers={{ guiLabel: "Analyse B-factor distributions" }}
          />
          <CCP4i2TaskElement
            key={2}
            {...props}
            itemName="VALIDATE_RAMACHANDRAN"
            qualifiers={{ guiLabel: "Calculate Ramachandran plots" }}
          />
          <CCP4i2TaskElement
            key={3}
            {...props}
            itemName="VALIDATE_MOLPROBITY"
            qualifiers={{ guiLabel: "Run MolProbity to analyse geometry" }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
