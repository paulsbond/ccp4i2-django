import { AppBar, Toolbar } from "@mui/material";
import EditMenu from "./edit-menu";
import FileMenu from "./file-menu";
import HelpMenu from "./help-menu";
import UtilMenu from "./util-menu";
import ViewMenu from "./view-menu";

export default function MenuBar() {
  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <FileMenu />
        <EditMenu />
        <ViewMenu />
        <UtilMenu />
        <HelpMenu />
      </Toolbar>
    </AppBar>
  );
}
