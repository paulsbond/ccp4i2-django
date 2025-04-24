import { createContext, PropsWithChildren, useState } from "react";
import { Job, File as DjangoFile } from "../models";
import { JobWithChildren } from "./job-menu";

export interface ContextProps {
  previewNode: JobWithChildren | DjangoFile | null;
  setPreviewNode: (node: JobWithChildren | DjangoFile | null) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (element: HTMLElement | null) => void;
  menuNode: Job | JobWithChildren | DjangoFile | null;
  setMenuNode: (node: Job | JobWithChildren | DjangoFile | null) => void;
  previewType: string | null;
  setPreviewType: (type: "json" | "xml" | "text" | "digest" | null) => void;
}

export const JobMenuContextData = createContext<ContextProps>({
  previewNode: null,
  setPreviewNode: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
  menuNode: null,
  setMenuNode: () => {},
  previewType: null,
  setPreviewType: () => {},
});

export const JobMenuContext: React.FC<PropsWithChildren> = ({ children }) => {
  const [previewNode, setPreviewNode] = useState<
    JobWithChildren | DjangoFile | null
  >(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuNode, setMenuNode] = useState<
    Job | JobWithChildren | DjangoFile | null
  >(null);
  const [previewType, setPreviewType] = useState<
    "json" | "xml" | "text" | "digest" | null
  >("text");
  return (
    <JobMenuContextData.Provider
      value={{
        anchorEl,
        setAnchorEl,
        menuNode,
        setMenuNode,
        previewNode,
        setPreviewNode,
        previewType,
        setPreviewType,
      }}
    >
      {children}
    </JobMenuContextData.Provider>
  );
};
