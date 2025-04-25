import {
  SyntheticEvent,
  useCallback,
  useContext,
  createContext,
  useMemo,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { Job, File as DjangoFile } from "../models";
import { doDownload, fullUrl, useApi } from "../api";
import { useRouter } from "next/navigation";
import { useDeleteDialog } from "./delete-dialog";
import { List, ListItem, Menu, MenuItem, Paper, Toolbar } from "@mui/material";
import { CCP4i2JobAvatar } from "./job-avatar";
import {
  CopyAll,
  Delete,
  Download,
  Preview,
  RunCircle,
  Terminal,
} from "@mui/icons-material";
import { FilePreviewContext } from "./file-preview-context";

interface FileMenuContextProps {
  fileMenuAnchorEl: HTMLElement | null;
  setFileMenuAnchorEl: (element: HTMLElement | null) => void;
  file: DjangoFile | null;
  setFile: (file: DjangoFile | null) => void;
}

export const FileMenuContext = createContext<FileMenuContextProps>({
  fileMenuAnchorEl: null,
  setFileMenuAnchorEl: () => {},
  file: null,
  setFile: () => {},
});

export const FileMenuContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [file, setFile] = useState<DjangoFile | null>(null);

  return (
    <FileMenuContext.Provider
      value={{
        fileMenuAnchorEl,
        setFileMenuAnchorEl,
        file,
        setFile,
      }}
    >
      {children}
      <FileMenu />
    </FileMenuContext.Provider>
  );
};

export const FileMenu: React.FC = () => {
  const { fileMenuAnchorEl, setFileMenuAnchorEl, file, setFile } =
    useContext(FileMenuContext);
  const api = useApi();
  const { setContentSpecification } = useContext(FilePreviewContext);

  const handleDownloadFile = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        const composite_path = api.noSlashUrl(`files/${file.id}/download/`);
        doDownload(composite_path, file.name);
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFile = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        setContentSpecification({
          url: `files/${file.id}/download/`,
          title: file.name,
          language: "text",
        });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileDigest = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        //setPreviewNode(file);
        //setPreviewType("digest");
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInCoot = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        console.log("Handling preview in coot", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "coot" });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInHklview = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        console.log("Handling preview in hklview", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "hklview" });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInCCP4MG = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        console.log("Handling preview in CCP4MG", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "ccp4mg" });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInTerminal = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        console.log("Handling preview in terminal", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "terminal" });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  return (
    <Menu
      open={Boolean(fileMenuAnchorEl)}
      anchorEl={fileMenuAnchorEl}
      onClose={() => setFileMenuAnchorEl(null)}
    >
      <MenuItem key="Download" onClick={handleDownloadFile}>
        <Download /> Download
      </MenuItem>
      <MenuItem key="Preview" onClick={handlePreviewFile}>
        <Preview /> Preview
      </MenuItem>
      <MenuItem key="Terminal" onClick={handlePreviewFileInTerminal}>
        <Terminal /> Terminal
      </MenuItem>
      {file &&
        ["chemical/x-pdb", "application/CCP4-mtz-map"].includes(file.type) && (
          <MenuItem key="Coot" onClick={handlePreviewFileInCoot}>
            <Preview /> Coot
          </MenuItem>
        )}
      {file &&
        ["chemical/x-pdb", "application/CCP4-mtz-map"].includes(file.type) && (
          <MenuItem key="CCP4MG" onClick={handlePreviewFileInCCP4MG}>
            <Preview /> CCP4MG
          </MenuItem>
        )}
      {file && file.type.startsWith("application/CCP4-mtz") && (
        <MenuItem key="HKLVIEW" onClick={handlePreviewFileInHklview}>
          <Preview /> HKLVIEW
        </MenuItem>
      )}
      {file && (
        <MenuItem key="DIGEST" onClick={handlePreviewFileDigest}>
          <Preview /> DIGEST
        </MenuItem>
      )}
    </Menu>
  );
};
