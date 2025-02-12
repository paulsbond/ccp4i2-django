"use client";
import React, {
  useState,
  useEffect,
  SyntheticEvent,
  useContext,
  useCallback,
  createContext,
} from "react";
import {
  Button,
  ClickAwayListener,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
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
} from "@mui/icons-material";
import { itemsForName } from "../utils";
import { CCP4i2Context } from "../app-context";
import { doDownload, doRetrieve, useApi } from "../api";
import { Editor } from "@monaco-editor/react";
import { prettifyXml } from "./report/CCP4i2ReportFlotWidget";

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
}
const FileBrowserContext = createContext<ContextProps>({
  previewNode: null,
  setPreviewNode: () => {},
});
export const FileTree: React.FC<FileTreeProps> = ({ data }) => {
  const [previewNode, setPreviewNode] = useState<FileNode | null>(null);
  return (
    <FileBrowserContext.Provider value={{ previewNode, setPreviewNode }}>
      <List>
        {Array.isArray(data) &&
          data.map((item) => <TreeNode key={item.name} node={item} />)}
      </List>
      <FilePreviewDialog />
    </FileBrowserContext.Provider>
  );
};

interface TreeNodeProps {
  node: FileNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuOpen = (ev: any) => {
    setAnchorEl(ev.currentTarget);
    ev.stopPropagation();
  };
  const handleMenuClose = (ev: any) => {
    setAnchorEl(null);
  };
  return (
    <>
      <ListItem
        dense
        sx={{ ml: 0, px: 0 }}
        onClick={toggleOpen}
        secondaryAction={
          node.type !== "directory" && (
            <>
              <ClickAwayListener onClickAway={handleMenuClose}>
                <Button onClick={handleMenuOpen}>
                  <MenuIcon />
                </Button>
              </ClickAwayListener>
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </>
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
            {node.contents.map((child) => (
              <TreeNode key={child.name} node={child} />
            ))}
          </List>
        </Collapse>
      )}
      <Menu open={menuOpen} anchorEl={anchorEl}>
        <FileMenu
          node={node}
          closeMenu={() => {
            setAnchorEl(null);
          }}
        />
      </Menu>
    </>
  );
};

interface FileMenuProps {
  node: FileNode;
  closeMenu: () => void;
}
const FileMenu: React.FC<FileMenuProps> = ({ node, closeMenu }) => {
  const { previewNode, setPreviewNode } = useContext(FileBrowserContext);
  const { noSlashUrl } = useApi();
  const { projectId } = useContext(CCP4i2Context);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const handleDownload = useCallback(
    (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const composite_path = noSlashUrl(
        `projects/${projectId}/project_file?path=${encodeURIComponent(
          node.path
        )}`
      );
      doDownload(composite_path, node.name);
      closeMenu();
    },
    [projectId, node, noSlashUrl, closeMenu]
  );
  const handlePreview = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      setPreviewNode(node);
      closeMenu();
    },
    [projectId, node, noSlashUrl, closeMenu]
  );

  return (
    <>
      {node.type !== "directory" && (
        <MenuItem onClick={handleDownload}>Download</MenuItem>
      )}
      {node?.name &&
        ["log", "xml", "json", "txt", "mmcif", "cif"].includes(
          node.name?.split(".").at(-1)
        ) && <MenuItem onClick={handlePreview}>Preview</MenuItem>}
      ;
    </>
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

const FilePreviewDialog: React.FC = () => {
  const { projectId } = useContext(CCP4i2Context);
  const { previewNode, setPreviewNode } = useContext(FileBrowserContext);
  const { noSlashUrl } = useApi();
  const [previewContent, setPreviewContent] = useState("");

  useEffect(() => {
    const asyncFunc = async () => {
      if (previewNode && projectId) {
        const composite_path = noSlashUrl(
          `projects/${projectId}/project_file?path=${encodeURIComponent(
            previewNode.path
          )}`
        );
        const fileContent = await doRetrieve(composite_path, previewNode.name);
        var enc = new TextDecoder("utf-8");
        setPreviewContent(enc.decode(fileContent));
      }
    };
    asyncFunc();
  }, [previewNode, projectId]);

  return (
    <Dialog
      sx={{ maxWidth: "120rem" }}
      open={previewNode != null}
      onClose={() => {
        setPreviewNode(null);
      }}
    >
      <DialogTitle>{previewNode?.name}</DialogTitle>
      <DialogContent>
        {previewNode && previewContent && (
          <Editor
            width="calc(100vw - 10rem)"
            height="calc(100vh - 20rem)"
            value={
              previewContent && previewNode.name.endsWith("xml")
                ? prettifyXml($.parseXML(previewContent))
                : previewContent
            }
            language={
              previewNode.name.endsWith("xml")
                ? "xml"
                : previewNode.name.endsWith("json")
                ? "json"
                : previewNode.name.endsWith("log")
                ? "log"
                : "text"
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
export default FileBrowser;
