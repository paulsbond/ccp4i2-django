import { AppBar, Button, Divider, Stack, Toolbar } from "@mui/material";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Stack direction="row" spacing={2}>
            <Button variant="text" color="inherit">
              Projects
            </Button>
            <Divider orientation="vertical" variant="middle" flexItem />
            <Button variant="text" color="inherit">
              Dashboard
            </Button>
            <Button variant="text" color="inherit">
              Programs
            </Button>
            <Button variant="text" color="inherit">
              Jobs
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <main>{children}</main>
    </>
  );
}
