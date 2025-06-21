import {
  SyntheticEvent,
  useCallback,
  useContext,
  createContext,
  useState,
  PropsWithChildren,
} from "react";
import { doDownload, useApi } from "../api";
import { Menu, MenuItem } from "@mui/material";
import { Download, Preview, Terminal } from "@mui/icons-material";
import { FilePreviewContext } from "./file-preview-context";
import { File as DjangoFile } from "../types/models";
import { useRouter } from "next/navigation";

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
  const { fileMenuAnchorEl, setFileMenuAnchorEl, file } =
    useContext(FileMenuContext);
  const api = useApi();
  const { setContentSpecification } = useContext(FilePreviewContext);
  const router = useRouter();

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
        setContentSpecification({
          url: `files/${file.id}/digest/`,
          title: file.name,
          language: "json",
        });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewDbInfo = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        setContentSpecification({
          url: `files/${file.id}/`,
          title: file.name,
          language: "json",
        });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInCoot = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
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
        api.post<any>(`files/${file.id}/preview/`, { viewer: "ccp4mg" });
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInMoorhen = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
        router.push(`/moorhen-page/file-by-id/${file.id}`);
        setFileMenuAnchorEl(null);
      }
    },
    [file]
  );

  const handlePreviewFileInTerminal = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (file) {
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
      {file && (
        <MenuItem key="DbInfo" onClick={handlePreviewDbInfo}>
          <Preview /> DbInfo
        </MenuItem>
      )}
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
      {file &&
        ["chemical/x-pdb", "application/CCP4-mtz-map"].includes(file.type) && (
          <MenuItem key="Moorhen" onClick={handlePreviewFileInMoorhen}>
            <Preview /> Moorhen
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
