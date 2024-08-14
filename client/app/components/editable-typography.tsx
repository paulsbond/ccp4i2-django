import { Typography } from "@mui/material";
import { Variant } from "@mui/material/styles/createTypography";
import { useEffect, useState } from "react";

export default function EditableTypography(props: {
  variant: Variant;
  text: string;
  onDelay: (text: string) => void;
}) {
  const [text, setText] = useState(props.text);

  useEffect(() => {
    const timeout = setTimeout(() => props.onDelay(text), 1000);
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <Typography
      variant={props.variant}
      contentEditable
      suppressContentEditableWarning
      onKeyUp={(e) => setText(e.currentTarget.innerText.trim())}
    >
      {props.text}
    </Typography>
  );
}
