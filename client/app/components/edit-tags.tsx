import { Button, Stack } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useApi } from "../api";

export default function EditTags(props: {
  tags: number[];
  onChange: (tags: number[]) => void;
}) {
  const api = useApi();

  return (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
      <Button variant="outlined" startIcon={<Add />}>
        Add Tag
      </Button>
    </Stack>
  );
}
