import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { Grid2 } from "@mui/material";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { getTaskItem } = useJob(job.id);
  const { value: XYZIN_MODE } = getTaskItem("XYZIN_MODE");

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab tab="Main inputs" key="1">
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Input data" }}
          key="Input data"
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            key="F_SIGF"
            itemName="F_SIGF"
            qualifiers={{ guiLabel: "Reflections" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="FREERFLAG"
            itemName="FREERFLAG"
            qualifiers={{ guiLabel: "Free R set" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="ASUIN"
            itemName="ASUIN"
            qualifiers={{ guiLabel: "Asymmetric unit contents" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="ABCD"
            key="ABCD"
            qualifiers={{ guiLabel: "Starting phases" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="F_PHI"
            itemName="F_PHI"
            qualifiers={{ guiLabel: "Starting map" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="XYZIN_MODE"
            itemName="XYZIN_MODE"
            qualifiers={{ guiLabel: "Use of NCS", guiMode: "radio" }}
          />
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Model from which to infer NCS" }}
            key="NCS"
            containerHint="BlockLevel"
            visibility={() => {
              return XYZIN_MODE !== "no";
            }}
          >
            <CCP4i2TaskElement
              {...props}
              key="XYZIN_HA"
              itemName="XYZIN_HA"
              qualifiers={{ guiLabel: "Heavy atom model" }}
              visibility={() => XYZIN_MODE === "ha"}
            />
            <CCP4i2TaskElement
              {...props}
              key="XYZIN_MR"
              itemName="XYZIN_MR"
              qualifiers={{ guiLabel: "Full atom model" }}
              visibility={() => XYZIN_MODE === "mr"}
            />
          </CCP4i2ContainerElement>
        </CCP4i2ContainerElement>

        <CCP4i2ContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Controls" }}
          key="Controls"
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <Grid2 container>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                key="CYCLES"
                itemName="CYCLES"
                qualifiers={{ guiLabel: "Number of cycles" }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                key="ANISOTROPY_CORRECTION"
                itemName="ANISOTROPY_CORRECTION"
                qualifiers={{ guiLabel: "Apply anisotropy correction" }}
              />
            </Grid2>
          </Grid2>
          <Grid2 container>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                key="RESOLUTION"
                itemName="RESOLUTION"
                qualifiers={{ guiLabel: "Maximum resolution" }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                key="SOLVENT_CONTENT"
                itemName="SOLVENT_CONTENT"
                qualifiers={{ guiLabel: "Estimated solvent content" }}
              />
            </Grid2>
          </Grid2>
          <Grid2 container>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                key="NCS_MASK_FILTER_RADIUS"
                itemName="NCS_MASK_FILTER_RADIUS"
                qualifiers={{ guiLabel: "Filter radius to define NCS mask" }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                key="VERBOSE"
                itemName="VERBOSE"
                qualifiers={{ guiLabel: "Verbosity of log file" }}
              />
            </Grid2>
          </Grid2>
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
      <CCP4i2Tab tab="Reference structures" key="2">
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Reference density and atmomic models" }}
          key="NCS"
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <span>
            <b>
              <em>
                You should normally let Parrot choose reference structures
              </em>
            </b>
          </span>
          <CCP4i2TaskElement
            {...props}
            key="F_SIGF_REF"
            itemName="F_SIGF_REF"
            qualifiers={{ guiLabel: "Reference density reflections" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="ABCD_REF"
            itemName="ABCD_REF"
            qualifiers={{ guiLabel: "Reference density phases" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="XYZIN_REF"
            itemName="XYZIN_REF"
            qualifiers={{
              guiLabel: "Model to define region of space to build",
            }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default TaskInterface;
