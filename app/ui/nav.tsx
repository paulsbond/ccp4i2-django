import {
  AppBar,
  Button,
  Container,
  Divider,
  Stack,
  Toolbar,
} from "@mui/material";
import Link from "next/link";

export default function Nav() {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar disableGutters>
          <Stack direction="row" spacing={2}>
            <Button color="inherit" LinkComponent={Link} href="/">
              Projects
            </Button>
            <Divider orientation="vertical" variant="middle" flexItem />
            <Button color="inherit" LinkComponent={Link} href="/project">
              Dashboard
            </Button>
            <Button
              color="inherit"
              LinkComponent={Link}
              href="/project/programs"
            >
              Programs
            </Button>
            <Button color="inherit" LinkComponent={Link} href="/project/jobs">
              Jobs
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
