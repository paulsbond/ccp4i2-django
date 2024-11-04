import { Typography } from "@mui/material";
import { Variant } from "@mui/material/styles/createTypography";
import { KeyboardEvent, useRef } from "react";

export default function EditableTypography(props: {
  variant: Variant;
  text: string;
  onDelay: (text: string) => void;
}) {
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  function handleKeyUp(e: KeyboardEvent<HTMLSpanElement>) {
    const text = e.currentTarget.innerText.trim();
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => props.onDelay(text), 1000);
  }

  return (
    <Typography
      variant={props.variant}
      contentEditable
      suppressContentEditableWarning
      onKeyUp={handleKeyUp}
    >
      {props.text}
    </Typography>
  );
}
