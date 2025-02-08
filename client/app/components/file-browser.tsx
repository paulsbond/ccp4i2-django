"use client";
import React, {
  useState,
  useEffect,
  SyntheticEvent,
  useContext,
  useCallback,
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
} from "@mui/icons-material";
import { itemsForName } from "./task/task-utils";
import { CCP4i2Context } from "../app-context";
import { doDownload, useApi } from "../api";

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

export const FileTree: React.FC<FileTreeProps> = ({ data }) => {
  return (
    <List>
      {Array.isArray(data) &&
        data.map((item) => <TreeNode key={item.name} node={item} />)}
    </List>
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
  return (
    <>
      <ListItem
        dense
        sx={{ ml: 0, px: 0 }}
        onClick={toggleOpen}
        secondaryAction={
          node.type !== "directory" && (
            <>
              <Button onClick={handleMenuOpen}>
                <MenuIcon />
              </Button>
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
  const { noSlashUrl } = useApi();
  const { projectId } = useContext(CCP4i2Context);
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
  return (
    <>
      {node.type !== "directory" && (
        <MenuItem onClick={handleDownload}>Download</MenuItem>
      )}
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

export default FileBrowser;
