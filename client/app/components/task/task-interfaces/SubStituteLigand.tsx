import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const { getTaskValue } = useJob(job.id);
  const { data: container, mutate: mutateContainer } = api.container<any>(
    `jobs/${props.job.id}/container`
  );

  const ligandAs = getTaskValue("LIGANDAS");
  const obsAs = getTaskValue("OBSAS");

  return (
    <>
      <CContainerElement
        itemName=""
        key="Ligand geometry"
        {...props}
        qualifiers={{ guiLabel: "Ligand geometry" }}
        containerHint="BlockLevel"
      >
        <CCP4i2TaskElement {...props} itemName="LIGANDAS" />
        <CCP4i2TaskElement
          {...props}
          itemName="SMILES"
          visibility={() => ligandAs === "SMILES"}
          qualifiers={{ multiLine: true }}
        />
        <CCP4i2TaskElement
          {...props}
          itemName="MOLIN"
          visibility={() => ligandAs === "MOL"}
        />
        <CCP4i2TaskElement
          {...props}
          itemName="DICTIN"
          visibility={() => ligandAs === "DICT"}
        />
      </CContainerElement>
      <CContainerElement
        itemName=""
        key="Refinement type"
        {...props}
        qualifiers={{ guiLabel: "Refinement type" }}
        containerHint="BlockLevel"
      >
        <CCP4i2TaskElement {...props} itemName="PIPELINE" />
      </CContainerElement>
      <CContainerElement
        itemName=""
        key="Starting coordinates"
        {...props}
        qualifiers={{ guiLabel: "Starting coordinates" }}
        containerHint="BlockLevel"
      >
        <CCP4i2TaskElement {...props} itemName="XYZIN" />
      </CContainerElement>
      <CContainerElement
        itemName=""
        key="Reflection data"
        {...props}
        qualifiers={{ guiLabel: "Reflection data" }}
        containerHint="BlockLevel"
      >
        <CCP4i2TaskElement key="OBSAS" {...props} itemName="OBSAS" />
        <CCP4i2TaskElement
          key="UNMERGED"
          {...props}
          itemName="UNMERGEDFILES"
          visibility={() => obsAs === "UNMERGED"}
        />
        <CCP4i2TaskElement
          key="MERGED"
          {...props}
          itemName="F_SIGF_IN"
          visibility={() => obsAs === "MERGED"}
        />
      </CContainerElement>
      <CContainerElement
        itemName=""
        key="Free R"
        {...props}
        qualifiers={{ guiLabel: "Free R flag" }}
        containerHint="BlockLevel"
      >
        <CCP4i2TaskElement {...props} itemName="FREERFLAG_IN" />
      </CContainerElement>
    </>
  );
};

export default TaskInterface;
