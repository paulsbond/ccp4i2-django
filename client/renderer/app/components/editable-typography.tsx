import { Typography } from "@mui/material";
import { KeyboardEvent, useRef } from "react";
import type { TypographyProps } from "@mui/material";

type TypographyVariant = TypographyProps["variant"];

export default function EditableTypography(props: {
  variant: TypographyVariant;
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
