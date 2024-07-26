import { AppBar, Container, Stack, Toolbar, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { Add, Upload } from "@mui/icons-material";

export default function ProjectsPage() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="span">
            CCP4
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ my: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            Projects
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" startIcon={<Add />}>
              New
            </Button>
            <Button variant="outlined" startIcon={<Upload />} disabled>
              Import
            </Button>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
