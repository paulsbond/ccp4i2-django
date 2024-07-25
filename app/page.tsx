import { Box, Container, Typography } from "@mui/material";
import Button from "@mui/material/Button";

export default function ProjectsPage() {
  return (
    <Container>
      <Box>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button variant="contained">New</Button>
        <Button variant="outlined">Import</Button>
      </Box>
    </Container>
  );
}
