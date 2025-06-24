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
  const { value: MOLSMILESORSKETCH } = getTaskItem("MOLSMILESORSKETCH");
  const { value: ATOMMATCHOPTION } = getTaskItem("ATOMMATCHOPTION");
  ATOMMATCHOPTION;
  return (
    <>
      <CCP4i2Tabs {...props}>
        <CCP4i2Tab tab="Main inputs" key="1">
          <CCP4i2TaskElement
            {...props}
            itemName="MOLSMILESORSKETCH"
            qualifiers={{ guiLabel: "Ligand geometry provided as" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="SMILESIN"
            qualifiers={{ guiLabel: "Smiles", guiMode: "multiLine" }}
            visibility={() => {
              return MOLSMILESORSKETCH === "SMILES";
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="MOLIN"
            qualifiers={{ guiLabel: "MDL Mol File" }}
            visibility={() => {
              return MOLSMILESORSKETCH === "MOL";
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="DICTIN2"
            qualifiers={{ guiLabel: "CIF Dictionary" }}
            visibility={() => {
              return MOLSMILESORSKETCH === "DICT";
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="SMILESFILEIN"
            qualifiers={{ guiLabel: "File containg SMILES string" }}
            visibility={() => {
              return MOLSMILESORSKETCH === "SMILESFILE";
            }}
          />
          <CContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Atom/residue naming",
              initiallyOpen: true,
            }}
          >
            <CCP4i2TaskElement
              {...props}
              itemName="TLC"
              qualifiers={{ guiLabel: "Three letter code for result" }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="ATOMMATCHOPTION"
              qualifiers={{ guiLabel: "Atom name matching" }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="MATCHTLC"
              qualifiers={{ guiLabel: "Three letter code to match names to" }}
              visibility={() => {
                return ATOMMATCHOPTION === "MONLIBCODE";
              }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="DICTIN"
              qualifiers={{ guiLabel: "Local dictionary" }}
              visibility={() => {
                return ATOMMATCHOPTION === "LOCALDICT";
              }}
            />
          </CContainerElement>
        </CCP4i2Tab>
      </CCP4i2Tabs>{" "}
    </>
  );
};

export default TaskInterface;
