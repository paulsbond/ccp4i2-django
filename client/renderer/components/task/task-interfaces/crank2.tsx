import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;

  return (
    <>
      <CContainerElement
        itemName=""
        key="inputData"
        {...props}
        qualifiers={{ guiLabel: "Ligand geometry" }}
        containerHint="BlockLevel"
      >
        {itemList
          .filter((item: any, iItem: number) => iItem < 30)
          .map((itemName) => (
            <CCP4i2TaskElement key={itemName} {...props} itemName={itemName} />
          ))}
      </CContainerElement>
    </>
  );
};

export default TaskInterface;

const itemList = [
  "crank2.inputData.F_SIGFanom",
  "crank2.inputData.F_SIGFanom2",
  "crank2.inputData.F_SIGFanom3",
  "crank2.inputData.F_SIGFanom4",
  "crank2.inputData.NON_MTZ",
  "crank2.inputData.F_SIGFanom_nonmtz",
  "crank2.inputData.F_SIGFanom2_nonmtz",
  "crank2.inputData.F_SIGFanom3_nonmtz",
  "crank2.inputData.F_SIGFanom4_nonmtz",
  "crank2.inputData.ATOM_TYPE",
  "crank2.inputData.F_SIGFnative",
  "crank2.inputData.F_SIGFnative_nonmtz",
  "crank2.inputData.WAVELENGTH4",
  "crank2.inputData.WAVELENGTH3",
  "crank2.inputData.WAVELENGTH2",
  "crank2.inputData.WAVELENGTH",
  "crank2.inputData.USER_WAVELENGTH",
  "crank2.inputData.USER_WAVELENGTH2",
  "crank2.inputData.USER_WAVELENGTH3",
  "crank2.inputData.USER_WAVELENGTH4",
  "crank2.inputData.FPRIME",
  "crank2.inputData.FDPRIME",
  "crank2.inputData.FPRIME2",
  "crank2.inputData.FDPRIME2",
  "crank2.inputData.FPRIME3",
  "crank2.inputData.FDPRIME3",
  "crank2.inputData.FPRIME4",
  "crank2.inputData.FDPRIME4",
  "crank2.inputData.USER_FPRIME",
  "crank2.inputData.USER_FDPRIME",
  "crank2.inputData.USER_FPRIME2",
  "crank2.inputData.USER_FDPRIME2",
  "crank2.inputData.USER_FPRIME3",
  "crank2.inputData.USER_FDPRIME3",
  "crank2.inputData.USER_FPRIME4",
  "crank2.inputData.USER_FDPRIME4",
  "crank2.inputData.CELL_A",
  "crank2.inputData.CELL_B",
  "crank2.inputData.CELL_C",
  "crank2.inputData.CELL_D",
  "crank2.inputData.CELL_E",
  "crank2.inputData.CELL_F",
  "crank2.inputData.SPACEGROUP",
  "crank2.inputData.USER_CELL_A",
  "crank2.inputData.USER_CELL_B",
  "crank2.inputData.USER_CELL_C",
  "crank2.inputData.USER_CELL_D",
  "crank2.inputData.USER_CELL_E",
  "crank2.inputData.USER_CELL_F",
  "crank2.inputData.USER_SPACEGROUP",
  "crank2.inputData.NUMBER_SUBSTRUCTURE",
  "crank2.inputData.SUBSTRDET_NUM_DSUL",
  "crank2.inputData.USER_NUMBER_SUBSTRUCTURE",
  "crank2.inputData.USER_SUBSTRDET_NUM_DSUL",
  "crank2.inputData.SEQIN",
  "crank2.inputData.XYZIN",
  "crank2.inputData.XYZIN.selection.text",
  "crank2.inputData.XYZIN_SUB",
  "crank2.inputData.XYZIN_SUB.selection.text",
  "crank2.inputData.XYZIN_SUB_RES",
  "crank2.inputData.FPHIN_HL",
  "crank2.inputData.INPUT_PHASES",
  "crank2.inputData.EXPTYPE",
  "crank2.inputData.USER_EXPTYPE",
  "crank2.inputData.REPLACE_MET_MSE",
  "crank2.inputData.START_PIPELINE",
  "crank2.inputData.END_PIPELINE",
  "crank2.inputData.SHELXCDE",
  "crank2.inputData.SHELX_SEPAR",
  "crank2.inputData.DNA",
  "crank2.inputData.SUBSTR_ATOMS_NATIVE",
  "crank2.inputData.USER_SUBSTR_ATOMS_NATIVE",
  "crank2.inputData.NATIVE",
  "crank2.inputData.MAD2",
  "crank2.inputData.MAD3",
  "crank2.inputData.MAD4",
  "crank2.inputData.DNAME",
  "crank2.inputData.DNAME2",
  "crank2.inputData.DNAME3",
  "crank2.inputData.DNAME4",
  "crank2.inputData.USER_DNAME",
  "crank2.inputData.USER_DNAME2",
  "crank2.inputData.USER_DNAME3",
  "crank2.inputData.USER_DNAME4",
  "crank2.inputData.INPUT_PARTIAL",
  "crank2.inputData.PARTIAL_AS_SUBSTR",
  "crank2.inputData.SUBSTR_IN_PARTIAL",
  "crank2.inputData.FREE",
  "crank2.inputData.MONOMERS_ASYM",
  "crank2.inputData.USER_MONOMERS_ASYM",
  "crank2.inputData.SOLVENT_CONTENT",
  "crank2.inputData.USER_SOLVENT_CONTENT",
  "crank2.inputData.RESIDUES_MON",
  "crank2.inputData.USER_RESIDUES_MON",
  "crank2.inputData.RESIDUES_MON_COPY",
  "crank2.inputData.RESIDUES_MON_INFO",
  "crank2.inputData.NUCLEOTIDES_MON",
  "crank2.inputData.INPUT_SEQUENCE",
  "crank2.inputData.SAVED_FPMFILE",
  "crank2.inputData.SAVED_FPMFILE2",
  "crank2.inputData.SAVED_FPMFILE3",
  "crank2.inputData.SAVED_FPMFILE4",
  "crank2.inputData.SAVED_FAVFILE",
  "crank2.inputData.SAVED_FAVFILE2",
  "crank2.inputData.SAVED_FAVFILE3",
  "crank2.inputData.SAVED_FAVFILE4",
  "crank2.inputData.SAVED_FAVFILE_NATIVE",
  "crank2.inputData.SAVED_FPLUS",
  "crank2.inputData.SAVED_FPLUS2",
  "crank2.inputData.SAVED_FPLUS3",
  "crank2.inputData.SAVED_FPLUS4",
  "crank2.inputData.SAVED_SIGFPLUS",
  "crank2.inputData.SAVED_SIGFPLUS2",
  "crank2.inputData.SAVED_SIGFPLUS3",
  "crank2.inputData.SAVED_SIGFPLUS4",
  "crank2.inputData.SAVED_FMIN",
  "crank2.inputData.SAVED_FMIN2",
  "crank2.inputData.SAVED_FMIN3",
  "crank2.inputData.SAVED_FMIN4",
  "crank2.inputData.SAVED_SIGFMIN",
  "crank2.inputData.SAVED_SIGFMIN2",
  "crank2.inputData.SAVED_SIGFMIN3",
  "crank2.inputData.SAVED_SIGFMIN4",
  "crank2.inputData.SAVED_FAVER",
  "crank2.inputData.SAVED_FAVER2",
  "crank2.inputData.SAVED_FAVER3",
  "crank2.inputData.SAVED_FAVER4",
  "crank2.inputData.SAVED_FAVER_NATIVE",
  "crank2.inputData.SAVED_SIGFAVER",
  "crank2.inputData.SAVED_SIGFAVER2",
  "crank2.inputData.SAVED_SIGFAVER3",
  "crank2.inputData.SAVED_SIGFAVER4",
  "crank2.inputData.SAVED_SIGFAVER_NATIVE",
  "crank2.inputData.FREERFLAG",
  "crank2.inputData.FREE_RATIO",
];
const rest = [];
