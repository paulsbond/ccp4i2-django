"use client";
import { PropsWithChildren } from "react";
import { CootProvider } from "../../contexts/coot-provider";
import { Provider } from "react-redux";
import { AppBar, IconButton, Toolbar } from "@mui/material";
import { NavigateBefore } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function MoorhenPageLayout(props: PropsWithChildren) {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };
  return (
    <CootProvider>
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
        </Toolbar>
      </AppBar>
      {props.children}
    </CootProvider>
  );
}
