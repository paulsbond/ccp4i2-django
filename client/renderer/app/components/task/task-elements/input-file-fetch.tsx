import { Button, SxProps } from "@mui/material";
import { ChangeEvent, useContext } from "react";
import { TaskInterfaceContext } from "../task-container";
import { Language } from "@mui/icons-material";

interface InputFileFetchProps {
  handleFileChange: (ev: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  accept: string;
  item?: any;
  sx?: SxProps;
}
export const InputFileFetch: React.FC<InputFileFetchProps> = ({
  disabled,
  sx,
  item,
}) => {
  const { setDownloadDialogOpen, setDownloadItem } =
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
        console.log(item);
        if (setDownloadDialogOpen) setDownloadDialogOpen(true);
        if (setDownloadItem) setDownloadItem(item);
      }}
    />
  );
};
