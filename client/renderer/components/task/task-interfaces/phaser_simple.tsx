import { Grid2, LinearProgress, Paper, Stack, Typography } from "@mui/material";
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
  const { setParameter, useAsyncEffect, getTaskItem, getFileDigest } = useJob(
    job.id
  );
  const { value: F_SIGFValue } = getTaskItem("F_SIGF");
  const { value: F_OR_IValue, update: updateF_or_I } = getTaskItem("F_OR_I");
  const { value: INPUT_FIXedValue } = getTaskItem("INPUT_FIXED");
  const { value: COMP_BYValue } = getTaskItem("COMP_BY");
  const { value: ID_RMSValue } = getTaskItem("ID_RMS");
  const { value: SGALT_SELECTValue } = getTaskItem("SGALT_SELECT");

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  //const { data: HKLINDigest } = api.digest<any>(
  //  `jobs/${job.id}/digest?object_path=servalcat_pipe.inputData.HKLIN`
  //);

  //This magic means that the following variables will be kept up to date with the values of the associated parameters

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab tab="Main inputs">
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Key files" }}
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="F_OR_I"
            qualifiers={{ guiLabel: "Use Fs or Is" }}
            visibility={() => {
              return [1, 3].includes(F_SIGFValue.contentFlag);
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="F_SIGF"
            qualifiers={{ guiLabel: "Reflections" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="XYZIN"
            qualifiers={{ guiLabel: "Search coordinates" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="INPUT_FIXED"
            qualifiers={{ guiLabel: "Have known partial model" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="XYZIN_FIXED"
            qualifiers={{ guiLabel: "Known partial model" }}
            visibility={() => {
              return INPUT_FIXedValue;
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="FREERFLAG"
            qualifiers={{ guiLabel: "Free R flags" }}
          />
        </CContainerElement>
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Basic parameters" }}
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="NCOPIES"
            qualifiers={{ guiLabel: "Copies to find" }}
          />
          <CContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Resolution" }}
            containerHint="BlockLevel"
            size={{ xs: 6 }}
            initiallyOpen={true}
          >
            <CCP4i2TaskElement
              {...props}
              itemName="RESOLUTION_LOW"
              qualifiers={{ guiLabel: "Low" }}
            />
            <CCP4i2TaskElement
              itemName="RESOLUTION_HIGH"
              {...props}
              qualifiers={{ guiLabel: "High" }}
            />
          </CContainerElement>
          <CContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Extra steps" }}
            containerHint="BlockLevel"
            initiallyOpen={true}
            size={{ xs: 4 }}
          >
            <CCP4i2TaskElement
              {...props}
              itemName="RUNSHEETBEND"
              qualifiers={{ guiLabel: "Sheet bend" }}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="RUNREFMAC"
              qualifiers={{ guiLabel: "Refmac" }}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="RUNCOOT"
              qualifiers={{ guiLabel: "Coot add-waters" }}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
            />
          </CContainerElement>
        </CContainerElement>
        <CContainerElement
          itemName=""
          {...props}
          qualifiers={{ guiLabel: "Scattering in the crystal" }}
          key="Scattering"
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="COMP_BY"
            sx={{ minWidth: "100%" }}
            qualifiers={{ guiLabel: "How to specify scattering content" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="ASUFILE"
            qualifiers={{ guiLabel: "CCP4i2 ASU file" }}
            visibility={() => {
              return COMP_BYValue === "ASU";
            }}
          />
          <Stack direction="row" sx={{ minWidth: "100%" }}>
            <CCP4i2TaskElement
              {...props}
              itemName="ASU_NUCLEICACID_MW"
              qualifiers={{ guiLabel: "nucleic acid (Da)" }}
              visibility={() => {
                return COMP_BYValue === "MW";
              }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="ASU_PROTEIN_MW"
              qualifiers={{ guiLabel: "protein (Da)" }}
              visibility={() => {
                return COMP_BYValue === "MW";
              }}
            />
          </Stack>
        </CContainerElement>
        <CContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Spacegroups" }}
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="SGALT_SELECT"
            qualifiers={{ guiLabel: "How spacegroups are chosen" }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="SGALT_TEST"
            qualifiers={{ guiLabel: "List of spacegroups to try" }}
            visibility={() => {
              return SGALT_SELECTValue === "LIST";
            }}
          />
        </CContainerElement>
        <CContainerElement
          itemName=""
          {...props}
          qualifiers={{ guiLabel: "Similarity of search model" }}
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="ID_RMS"
            qualifiers={{
              guiLabel: "How to specify similarity (i.e. sequence or coords)",
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="SEARCHSEQUENCEIDENTITY"
            qualifiers={{ guiLabel: "Sequence identity (0.0-1.0)" }}
            visibility={() => {
              return ID_RMSValue == "ID";
            }}
          />
          <CCP4i2TaskElement
            {...props}
            itemName="SEARCHRMS"
            qualifiers={{ guiLabel: "Expected coordinate RMSD (angstroms)" }}
            visibility={() => {
              return ID_RMSValue == "RMS";
            }}
          />
        </CContainerElement>
      </CCP4i2Tab>
      <CCP4i2Tab tab="Keywords" key="2">
        <CContainerElement
          {...props}
          itemName="keywords"
          qualifiers={{ guiLabel: "" }}
          containerHint="BlockLevel"
          initiallyOpen={true}
        />
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default TaskInterface;
