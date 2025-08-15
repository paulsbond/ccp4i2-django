import { moorhen } from "moorhen/types/moorhen";
import { useSelector } from "react-redux";
import { Box, Stack } from "@mui/material";
import { CCP4i2HierarchyBrowser } from "./ccp4i2-hierarchy-browser";
import { MoorhenLoadedContent } from "./moorhen-loaded-panel";

interface MoorhenControlPanelProps {
  onFileSelect: (fileId: number) => Promise<void>;
}

export const MoorhenControlPanel: React.FC<MoorhenControlPanelProps> = ({
  onFileSelect,
}) => {
  const cootInitialized = useSelector(
    (state: moorhen.State) => state.generalStates.cootInitialized
  );

  if (!cootInitialized) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 75px)",
          overflowY: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "100%",
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <Stack
      direction="column"
      sx={{
        height: "calc(100vh - 75px)",
        width: "100%",
      }}
    >
      {/* Upper section - CCP4i2HierarchyBrowser */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // Allows flex item to shrink
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CCP4i2HierarchyBrowser onFileSelect={onFileSelect} />
      </Box>

      {/* Lower section - Molecules  */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // Allows flex item to shrink
          overflow: "auto",
          backgroundColor: "#f9f9f9",
          border: "1px solid #e0e0e0",
          borderTop: "2px solid #1976d2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        <MoorhenLoadedContent onFileSelect={onFileSelect} type="Molecule" />
      </Box>
      {/* Lower section - Maps  */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // Allows flex item to shrink
          overflow: "auto",
          backgroundColor: "#f9f9f9",
          border: "1px solid #e0e0e0",
          borderTop: "2px solid #1976d2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        <MoorhenLoadedContent onFileSelect={onFileSelect} type="Map" />
      </Box>
    </Stack>
  );
};
