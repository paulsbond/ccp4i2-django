import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../contexts/task-container";
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
  const { value: MAP_SHARP } = getTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM } = getTaskItem("MAP_SHARP_CUSTOM");

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
          size={{ xs: 12 }}
          qualifiers={{ guiLabel: "Additional geomtery dictionaries" }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="DICT_LIST"
            qualifiers={{ guiLabel: "Dictionaries" }}
          />
        </CContainerElement>
      </CCP4i2Tab>
      <CCP4i2Tab tab="Output" key="Output">
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
        <CContainerElement
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
        </CContainerElement>
        <CContainerElement
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
        </CContainerElement>
        <CContainerElement
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
        </CContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
