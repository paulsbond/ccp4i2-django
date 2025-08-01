"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  SyntheticEvent,
  ReactNode,
} from "react";
import {
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
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
import { Project } from "../types/models";
import { FilePreviewContext } from "./file-preview-context";
import { FileSystemFileMenu } from "../components/file-system-file-menu";
import { FileSystemItem } from "../components/directory-browser";

interface FileSystemFileBrowserState {
  anchorEl: HTMLElement | null;
  menuNode: FileSystemItem | null;
  previewNode: FileSystemItem | null;
}

type FileSystemFileBrowserAction =
  | {
      type: "OPEN_MENU";
      payload: { anchorEl: HTMLElement; menuNode: FileSystemItem };
    }
  | { type: "CLOSE_MENU" }
  | { type: "SET_PREVIEW"; payload: FileSystemItem | null }
  | { type: "SET_ANCHOR_EL"; payload: HTMLElement | null }
  | { type: "SET_MENU_NODE"; payload: FileSystemItem | null };

const initialState: FileSystemFileBrowserState = {
  anchorEl: null,
  menuNode: null,
  previewNode: null,
};

function fileSystemFileBrowserReducer(
  state: FileSystemFileBrowserState,
  action: FileSystemFileBrowserAction
): FileSystemFileBrowserState {
  switch (action.type) {
    case "OPEN_MENU":
      return {
        ...state,
        anchorEl: action.payload.anchorEl,
        menuNode: action.payload.menuNode,
      };
    case "CLOSE_MENU":
      return {
        ...state,
        anchorEl: null,
        menuNode: null,
      };
    case "SET_PREVIEW":
      return {
        ...state,
        previewNode: action.payload,
      };
    case "SET_ANCHOR_EL":
      return {
        ...state,
        anchorEl: action.payload,
      };
    case "SET_MENU_NODE":
      return {
        ...state,
        menuNode: action.payload,
      };
    default:
      return state;
  }
}

interface FileSystemFileBrowserContextType {
  state: FileSystemFileBrowserState;
  openMenu: (anchorEl: HTMLElement, menuNode: FileSystemItem) => void;
  closeMenu: () => void;
  setPreviewNode: (node: FileSystemItem | null) => void;
  // Keep individual setters for backward compatibility if needed
  setAnchorEl: (el: HTMLElement | null) => void;
  setMenuNode: (node: FileSystemItem | null) => void;
  // Convenient getters
  anchorEl: HTMLElement | null;
  menuNode: FileSystemItem | null;
  previewNode: FileSystemItem | null;
}

const FileSystemFileBrowserContext = createContext<
  FileSystemFileBrowserContextType | undefined
>(undefined);

interface FileSystemFileBrowserProviderProps {
  children: ReactNode;
}

export const FileSystemFileBrowserProvider: React.FC<
  FileSystemFileBrowserProviderProps
> = ({ children }) => {
  const [state, dispatch] = useReducer(
    fileSystemFileBrowserReducer,
    initialState
  );

  const openMenu = (anchorEl: HTMLElement, menuNode: FileSystemItem) => {
    dispatch({ type: "OPEN_MENU", payload: { anchorEl, menuNode } });
  };

  const closeMenu = () => {
    dispatch({ type: "CLOSE_MENU" });
  };

  const setPreviewNode = (node: FileSystemItem | null) => {
    dispatch({ type: "SET_PREVIEW", payload: node });
  };

  // Individual setters for backward compatibility
  const setAnchorEl = (el: HTMLElement | null) => {
    dispatch({ type: "SET_ANCHOR_EL", payload: el });
  };

  const setMenuNode = (node: FileSystemItem | null) => {
    dispatch({ type: "SET_MENU_NODE", payload: node });
  };

  const contextValue: FileSystemFileBrowserContextType = {
    state,
    openMenu,
    closeMenu,
    setPreviewNode,
    setAnchorEl,
    setMenuNode,
    // Convenient getters
    anchorEl: state.anchorEl,
    menuNode: state.menuNode,
    previewNode: state.previewNode,
  };

  return (
    <FileSystemFileBrowserContext.Provider value={contextValue}>
      {children}
    </FileSystemFileBrowserContext.Provider>
  );
};

export const useFileSystemFileBrowser = () => {
  const context = useContext(FileSystemFileBrowserContext);
  if (context === undefined) {
    throw new Error(
      "useFileSystemFileBrowser must be used within a FileSystemFileBrowserProvider"
    );
  }
  return context;
};

export { FileSystemFileBrowserContext };
