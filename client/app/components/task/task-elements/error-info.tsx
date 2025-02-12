import { Button, ClickAwayListener, Popper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { Info } from "@mui/icons-material";
import { useJob } from "../../../utils";

export const ErrorInfo: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { itemName, job } = props;
  const { getTaskItem, getValidationColor, getErrors } = useJob(job.id);
  const item = getTaskItem(itemName);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const infoOpen = Boolean(anchorEl);
  const fieldErrors = getErrors(item);

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
          <Info sx={{ width: 1, color: getValidationColor(item) }} />
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
          {fieldErrors && fieldErrors.length > 0 ? (
            <>
              <Typography variant="subtitle1">
                Errors in {item._objectPath}
              </Typography>
              {fieldErrors.map((fieldError: any, iError: number) => (
                <Typography
                  key={`${iError}`}
                  sx={{ textWrap: "wrap", maxWidth: "40rem" }}
                >
                  {fieldError.description}
                </Typography>
              ))}
            </>
          ) : (
            <Typography variant="subtitle1">
              No errors for {item._objectPath}
            </Typography>
          )}
        </Box>
        {props.children}
      </Popper>
    </>
  );
};
