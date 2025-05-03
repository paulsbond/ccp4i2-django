import { Button, SxProps } from "@mui/material";
import { ChangeEvent, useContext } from "react";
import { TaskInterfaceContext } from "../task-container";
import { Language } from "@mui/icons-material";

interface InputFileFetchProps {
  handleFileChange: (ev: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  modes?: string[];
  item?: any;
  sx?: SxProps;
}
export const InputFileFetch: React.FC<InputFileFetchProps> = ({
  disabled,
  sx,
  item,
  modes,
}) => {
  const { setDownloadDialogOpen, setDownloadItemParams } =
    useContext(TaskInterfaceContext);

  return (
    <Button
      disabled={disabled}
      component="label"
      role={undefined}
      variant="outlined"
      tabIndex={-1}
      size="small"
      startIcon={<Language fontSize="small" />}
      sx={sx}
      onClick={(ev: any) => {
        ev.stopPropagation();
        if (setDownloadDialogOpen) setDownloadDialogOpen(true);
        const arg = { item, modes };
        console.log({ arg });
        if (setDownloadItemParams) setDownloadItemParams({ item, modes });
      }}
    />
  );
};
