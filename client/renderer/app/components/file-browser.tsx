"use client";
import {
  useState,
  useEffect,
  SyntheticEvent,
  useContext,
  useCallback,
  createContext,
} from "react";
import {
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Folder,
  InsertDriveFile,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  Preview,
  Download,
} from "@mui/icons-material";
import { CCP4i2Context } from "../app-context";
import { doDownload, useApi } from "../api";
import { Project } from "../models";
import { FilePreviewContext } from "./file-preview-context";

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  contents?: FileNode[];
}

interface FileTreeProps {
  data: FileNode[];
}
interface ContextProps {
  previewNode: FileNode | null;
  setPreviewNode: (node: FileNode | null) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (element: HTMLElement | null) => void;
  menuNode: FileNode | null;
  setMenuNode: (node: FileNode | null) => void;
}
const FileBrowserContext = createContext<ContextProps>({
  previewNode: null,
  setPreviewNode: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
  menuNode: null,
  setMenuNode: () => {},
});

export const FileTree: React.FC<FileTreeProps> = ({ data }) => {
  const [previewNode, setPreviewNode] = useState<FileNode | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuNode, setMenuNode] = useState<FileNode | null>(null);
  return (
    <FileBrowserContext.Provider
      value={{
        previewNode,
        setPreviewNode,
        anchorEl,
        setAnchorEl,
        menuNode,
        setMenuNode,
      }}
    >
      <List>
        {Array.isArray(data) &&
          data.map((item) => <TreeNode key={item.name} node={item} />)}
      </List>
      <FileMenu />
    </FileBrowserContext.Provider>
  );
};

interface TreeNodeProps {
  node: FileNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
  const { contentSpecification, setContentSpecification } =
    useContext(FilePreviewContext);

  const [isOpen, setIsOpen] = useState(false);
  const {
    anchorEl,
    setAnchorEl,
    menuNode,
    setMenuNode,
    previewNode,
    setPreviewNode,
  } = useContext(FileBrowserContext);
  const menuOpen = Boolean(anchorEl);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuOpen = (ev: any) => {
    setAnchorEl(ev.currentTarget);
    setMenuNode(node);
    ev.stopPropagation();
  };

  const handleMenuClose = (ev: any) => {
    setAnchorEl(null);
  };

  const handlePreview = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      setPreviewNode(node);
    },
    [node]
  );

  return (
    <>
      <ListItem
        dense
        sx={{ ml: 0, px: 0 }}
        onClick={toggleOpen}
        onDoubleClick={handlePreview}
        secondaryAction={
          node.type !== "directory" ? (
            <Button onClick={handleMenuOpen}>
              <MenuIcon />
            </Button>
          ) : isOpen ? (
            <ExpandLess />
          ) : (
            <ExpandMore />
          )
        }
      >
        <ListItemIcon sx={{ ml: node.path.split("/").length - 1, p: 0 }}>
          {node.type === "directory" ? (
            <Folder color="primary" />
          ) : (
            <InsertDriveFile color="action" />
          )}
        </ListItemIcon>
        <ListItemText primary={node.name} />
      </ListItem>
      {node.type === "directory" && Array.isArray(node.contents) && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.contents
              .sort((child1, child2) => {
                if (child1.type === "directory" && child2.type === "file")
                  return -1;
                if (child1.type === "file" && child2.type === "directory")
                  return 1;
                const match1 = /job_(\d+)$/.exec(child1.name);
                const match2 = /job_(\d+)$/.exec(child2.name);
                if (match1 && match2) {
                  return parseInt(match2[1]) - parseInt(match1[1]);
                }
                if (match1) return -1;
                if (match2) return 1;
                return child1.name.localeCompare(child2.name);
              })
              .map((child) => (
                <TreeNode key={child.name} node={child} />
              ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const FileMenu: React.FC = () => {
  const { anchorEl, setAnchorEl, menuNode } = useContext(FileBrowserContext);
  const { contentSpecification, setContentSpecification } =
    useContext(FilePreviewContext);

  const { noSlashUrl, post, postNoSlash, get } = useApi();
  const { projectId } = useContext(CCP4i2Context);
  const { data: project } = get<Project>(`projects/${projectId}`);
  const isMenuOpen = Boolean(anchorEl);
  const handleDownload = useCallback(
    (ev: SyntheticEvent) => {
      if (menuNode) {
        ev.stopPropagation();
        const composite_path = noSlashUrl(
          `projects/${projectId}/project_file?path=${encodeURIComponent(
            menuNode.path
          )}`
        );
        doDownload(composite_path, menuNode.name);
        setAnchorEl(null);
      }
    },
    [projectId, menuNode, noSlashUrl]
  );

  const handlePreview = useCallback(
    async (ev: SyntheticEvent) => {
      if (!menuNode) return;
      ev.stopPropagation();
      const composite_path = noSlashUrl(
        `projects/${projectId}/project_file?path=${encodeURIComponent(
          menuNode.path
        )}`
      );
      setContentSpecification({
        url: composite_path,
        title: menuNode.name || "Preview",
        language: menuNode.name.endsWith(".json")
          ? "json"
          : menuNode.name.endsWith(".xml")
          ? "xml"
          : "text",
      });
      setAnchorEl(null);
    },
    [menuNode]
  );

  const handlePreviewFile = async (
    project_id: number,
    viewer: string,
    path: string
  ) => {
    const jsonBody = { viewer, path };
    const previewResult: any = await post<any>(
      `projects/${project_id}/preview_file/`,
      jsonBody
    );
  };

  const handlePreviewFileInCoot = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (project) {
        handlePreviewFile(
          project.id,
          "coot",
          menuNode?.path.slice(project.directory.length) || ""
        );
      }
      setAnchorEl(null);
    },
    [project, menuNode, setAnchorEl]
  );

  const handlePreviewFileInHklview = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (project) {
        handlePreviewFile(
          project.id,
          "hklview",
          menuNode?.path.slice(project.directory.length) || ""
        );
      }
      setAnchorEl(null);
    },
    [project, menuNode, setAnchorEl]
  );

  const handlePreviewFileInCcp4mg = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (project) {
        handlePreviewFile(
          project.id,
          "ccp4mg",
          menuNode?.path.slice(project.directory.length) || ""
        );
      }
      setAnchorEl(null);
    },
    [project, menuNode, setAnchorEl]
  );

  return (
    <Menu
      anchorEl={anchorEl}
      open={isMenuOpen}
      onClose={() => {
        setAnchorEl(null);
      }}
    >
      {menuNode?.type !== "directory" && (
        <MenuItem onClick={handleDownload}>
          <Download />
          Download
        </MenuItem>
      )}
      {menuNode?.name &&
        ["log", "xml", "json", "txt", "mmcif", "cif", "pdb"].includes(
          menuNode?.name?.split(".").at(-1) || ""
        ) && (
          <MenuItem onClick={handlePreview}>
            <Preview />
            Preview
          </MenuItem>
        )}
      {menuNode?.name &&
        ["pdb", "mmcif", "cif", "mtz"].includes(
          menuNode?.name?.split(".").at(-1) || ""
        ) && (
          <MenuItem onClick={handlePreviewFileInCoot}>
            <Preview />
            Coot
          </MenuItem>
        )}
      {menuNode?.name &&
        ["pdb", "mmcif", "cif", "mtz"].includes(
          menuNode?.name?.split(".").at(-1) || ""
        ) && (
          <MenuItem onClick={handlePreviewFileInCcp4mg}>
            <Preview />
            CCP4MG
          </MenuItem>
        )}
      {menuNode?.name &&
        ["mtz"].includes(menuNode?.name?.split(".").at(-1) || "") && (
          <MenuItem onClick={handlePreviewFileInHklview}>
            <Preview />
            HKLView
          </MenuItem>
        )}
    </Menu>
  );
};

const FileBrowser: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "auto",
        background: "white",
        padding: 16,
        borderRadius: 8,
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", marginBottom: 16 }}>File Browser</h2>
      <FileTree data={fileTree} />
    </div>
  );
};

export default FileBrowser;
