import { PropsWithChildren } from "react";
import { ImportProjectContent } from "../../components/import-project-content";
import { Paper } from "@mui/material";

export default function ImportProjectPage() {
  return (
    <Paper
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <ImportProjectContent />
    </Paper>
  );
}
