"use client";
import { PropsWithChildren } from "react";
import { CootProvider } from "../../providers/coot-provider";
import { Provider } from "react-redux";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { NavigateBefore } from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";
import { NavigationShortcutsProvider } from "../../providers/navigation-shortcuts-provider";

export default function MoorhenPageLayout(props: PropsWithChildren) {
  const router = useRouter();
  const { id } = useParams();
  const fileIds = id ? [parseInt(id as string)] : [];
  const handleBack = () => {
    router.back();
  };
  return (
    <CootProvider>
      <NavigationShortcutsProvider>
        <AppBar position="static">
          <Toolbar sx={{ gap: 2 }}>
            <IconButton
              size="large"
              aria-label="show 4 new mails"
              color="inherit"
              onClick={handleBack}
            >
              <NavigateBefore />
            </IconButton>
            <Typography
              variant="h6"
              style={{ textAlign: "center", margin: "10px" }}
            >
              Moorhen Viewer {JSON.stringify(fileIds)}
            </Typography>
          </Toolbar>
        </AppBar>
        {props.children}
      </NavigationShortcutsProvider>
    </CootProvider>
  );
}
