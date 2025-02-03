import { Button, ClickAwayListener, Popper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { Info } from "@mui/icons-material";
import { useJob, useValidation } from "../task-utils";

export const ErrorInfo: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { itemName, job } = props;
  const { getTaskItem, getValidationColor } = useJob(job);
  const item = getTaskItem(itemName);
  const { getErrors } = useValidation(job.id);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const infoOpen = Boolean(anchorEl);
  const fieldErrors = getErrors(item._objectPath);

  return (
    <>
      <ClickAwayListener
        onClickAway={() => {
          setAnchorEl(null);
        }}
      >
        <Button
          size="small"
          sx={{ px: 0, py: 0, mx: 0, my: 0, maxWidth: "1rem" }}
          onClick={(ev) => {
            setAnchorEl(ev.currentTarget);
          }}
        >
          <Info sx={{ width: 1, color: getValidationColor(itemName) }} />
        </Button>
      </ClickAwayListener>
      <Popper anchorEl={anchorEl} placement="auto-end" open={infoOpen}>
        <Box
          sx={{
            border: 1,
            p: 1,
            bgcolor: "background.paper",
            textWrap: "pretty",
          }}
        >
          {fieldErrors &&
            fieldErrors.map((fieldError) => (
              <Typography sx={{ textWrap: "wrap", maxWidth: "40rem" }}>
                {fieldError.description}
              </Typography>
            ))}
        </Box>
        {props.children}
      </Popper>
    </>
  );
};
