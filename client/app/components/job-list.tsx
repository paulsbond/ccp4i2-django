import {
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import SearchField from "./search-field";

export default function JobList() {
  let jobs = [];
  for (let id = 0; id < 100; id++) {
    jobs.push({ id: id, title: "Servalcat", number: id.toString() });
  }
  if (jobs == null) return <CircularProgress variant="indeterminate" />;
  if (jobs.length == 0) return <Typography>No jobs, yet...</Typography>;
  return (
    <Stack sx={{ height: 1 }}>
      <Box>
        <SearchField what="jobs" onDelay={(_) => null} />
      </Box>
      <List sx={{ flex: "auto" }}>
        {jobs.map((job) => (
          <ListItem key={job.id}>
            <ListItemText>
              {job.number} {job.title}
            </ListItemText>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
