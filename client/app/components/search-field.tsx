import { ChangeEvent, useEffect, useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Close, Search } from "@mui/icons-material";

export default function SearchField(props: {
  onChangeDelay: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  useEffect(() => {
    const timeout = setTimeout(() => props.onChangeDelay(query), 500);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <TextField
      value={query}
      label="Search"
      variant="filled"
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment:
          query.length > 0 ? (
            <InputAdornment position="end">
              <IconButton onClick={() => setQuery("")}>
                <Close />
              </IconButton>
            </InputAdornment>
          ) : undefined,
      }}
    />
  );
}
