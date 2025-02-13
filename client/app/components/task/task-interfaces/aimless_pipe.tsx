import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { CAltSpaceGroupElement } from "../task-elements/caltspacegroupelement";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { data: container, mutate: mutateContainer } = api.container<any>(
    `jobs/${job.id}/container`
  );

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const { getTaskValue, getTaskItem } = useJob(job.id);

  const chooseModeValue = getTaskValue("CHOOSE_MODE");
  const modeValue = getTaskValue("MODE");
  const aimlessRefValue = getTaskValue("REFERENCE_FOR_AIMLESS");
  const reference_datasetValue = getTaskValue("REFERENCE_DATASET");

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab tab="Main inputs" key="1">
        <CContainerElement
          key="Files"
          itemName=""
          {...props}
          qualifiers={{ containerHint: "FolderLevel", initiallyOpen: true }}
        >
          <CCP4i2TaskElement
            {...props}
            key="UNMERGEDFILES"
            itemName="UNMERGEDFILES"
            qualifiers={{ guiLabel: "Unmerged files" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="FREERFLAG"
            itemName="FREERFLAG"
            qualifiers={{ guiLabel: "Free R set to use/extend" }}
          />
        </CContainerElement>
        <CContainerElement
          {...props}
          itemName=""
          key="Parameters"
          qualifiers={{
            guiLabel: "Parameters",
            containerHint: "FolderLevel",
            initiallyOpen: true,
          }}
        >
          <CCP4i2TaskElement
            {...props}
            key="AUTOCUTOFF"
            itemName="AUTOCUTOFF"
            qualifiers={{ guiLabel: "Apply auto. data cutoff" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="RESOLUTION_RANGE"
            itemName="RESOLUTION_RANGE"
            qualifiers={{ guiLabel: "Resolution" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="OVERRIDE_CELL_DIFFERENCE"
            qualifiers={{ guiLabel: "Override cell difference" }}
            itemName="OVERRIDE_CELL_DIFFERENCE"
          />
        </CContainerElement>
        <CContainerElement
          {...props}
          key="ChoosingSpace"
          itemName=""
          qualifiers={{
            guiLabel: "Choosing spacegroup",
            containerHint: "FolderLevel",
            initiallyOpen: true,
          }}
        >
          <CCP4i2TaskElement
            {...props}
            key="MODE"
            itemName="MODE"
            qualifiers={{ guiLabel: "Pipeline mode" }}
          />
          <CContainerElement
            {...props}
            key="ChoiceOptions"
            itemName=""
            qualifiers={{
              guiLabel: "Choice options",
              containerHint: "BlockLevel",
            }}
            visibility={() => {
              return modeValue === "CHOOSE";
            }}
          >
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_MODE"
              itemName="CHOOSE_MODE"
              qualifiers={{ guiLabel: "Symmetry choice mode" }}
              visibility={() => {
                return modeValue === "CHOOSE";
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_SOLUTION_NO"
              itemName="CHOOSE_SOLUTION_NO"
              qualifiers={{ guiLabel: "Solution no. to choose" }}
              visibility={() => {
                return (
                  modeValue === "CHOOSE" && chooseModeValue === "SOLUTION_NO"
                );
              }}
            />
            <CAltSpaceGroupElement
              {...props}
              key="CHOOSE_SPACEGROUP"
              itemName="CHOOSE_SPACEGROUP"
              qualifiers={{
                ...getTaskItem("CHOOSE_SPACEGROUP")._qualifiers,
                guiLabel: "Spacegroup to choose",
              }}
              visibility={() => {
                //console.log({ modeValue, chooseModeValue });
                return (
                  modeValue === "CHOOSE" &&
                  (chooseModeValue === "SPACEGROUP" ||
                    chooseModeValue === "REINDEX_SPACE")
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="REINDEX_OPERATOR"
              itemName="REINDEX_OPERATOR"
              qualifiers={{ guiLabel: "Reindexing operator" }}
              visibility={() => {
                return (
                  modeValue === "CHOOSE" && chooseModeValue === "REINDEX_SPACE"
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_LAUEGROUP"
              itemName="CHOOSE_LAUEGROUP"
              qualifiers={{ guiLabel: "Lauegroup to choose" }}
              visibility={() => {
                return (
                  modeValue === "CHOOSE" && chooseModeValue === "LAUEGROUP"
                );
              }}
            />
          </CContainerElement>
          <CContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Specify reference",
              containerHint: "BlockLevel",
            }}
            visibility={() => {
              return modeValue === "MATCH";
            }}
          >
            <CCP4i2TaskElement
              {...props}
              itemName="REFERENCE_FOR_AIMLESS"
              qualifiers={{ guiLabel: "Reference" }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="REFERENCE_DATASET"
              qualifiers={{ guiLabel: "Reference type" }}
              visibility={() => {
                return modeValue === "MATCH" && aimlessRefValue;
              }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="HKLIN_REF"
              qualifiers={{ guiLabel: "Reference reflections" }}
              visibility={() => {
                return (
                  modeValue === "MATCH" &&
                  aimlessRefValue &&
                  reference_datasetValue === "HKL"
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="XYZIN_REF"
              qualifiers={{ guiLabel: "Reference coordinates" }}
              visibility={() => {
                return (
                  modeValue === "MATCH" &&
                  aimlessRefValue &&
                  reference_datasetValue === "XYZ"
                );
              }}
            />
          </CContainerElement>
        </CContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default TaskInterface;
