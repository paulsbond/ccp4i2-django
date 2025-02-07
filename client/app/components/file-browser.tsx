"use client";
import React, { useState, useEffect } from "react";
import {
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import {
  Folder,
  InsertDriveFile,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

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

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <ListItem
        dense
        onClick={toggleOpen}
        secondaryAction={
          node.type === "directory" &&
          (isOpen ? <ExpandLess /> : <ExpandMore />)
        }
      >
        <ListItemIcon sx={{ ml: node.path.split("/").length }}>
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
