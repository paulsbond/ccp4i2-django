import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { getTaskItem } = useJob(job.id);
  const { value: USE_MODEL_PHASES } = getTaskItem("USE_MODEL_PHASES");

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
            <CContainerElement
              {...props}
              itemName=""
              key="Starting phases"
              qualifiers={{ guiLabel: "Starting phases" }}
            >
              <CCP4i2TaskElement
                {...props}
                key="USE_MODEL_PHASES"
                itemName="USE_MODEL_PHASES"
                qualifiers={{ guiLabel: "Use model phases" }}
              />
              <CCP4i2TaskElement
                {...props}
                key="PHASES"
                itemName="PHASES"
                qualifiers={{ guiLabel: "Starting phases" }}
                visibility={() => {
                  return !USE_MODEL_PHASES;
                }}
              />
              <CCP4i2TaskElement
                {...props}
                key="XYZIN"
                itemName="XYZIN"
                qualifiers={{ guiLabel: "Coordinates" }}
                visibility={() => {
                  return USE_MODEL_PHASES;
                }}
              />
            </CContainerElement>
          </CContainerElement>
          <CContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Controls" }}
            key="Controls"
          >
            <CCP4i2TaskElement
              {...props}
              key="SELENOMET"
              itemName="SELENOMET"
              qualifiers={{
                guiLabel: "Build methionine (MET) as selenomethionine (MSE)",
              }}
            />
          </CContainerElement>
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </>
  );
};

export default TaskInterface;
