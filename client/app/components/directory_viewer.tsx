"use client";
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { Editor } from "@monaco-editor/react";
import { FileTree } from "./file-browser";
import { LinearProgress } from "@mui/material";

interface CCP4i2DirectoryViewerProps {
  projectId: number;
}
export const CCP4i2DirectoryViewer: React.FC<CCP4i2DirectoryViewerProps> = ({
  projectId,
}) => {
  const api = useApi();
  /*
  const [directory, setDirectory] = useState<any>({});

  useEffect(() => {
    const asyncFunc = async () => {
      const directory: any = await fetch(
        `http://127.0.0.1:8000/projects/${projectId}/directory`
      ).then((response) => response.json());
      console.log(directory);
      setDirectory(directory.container);
    };
    asyncFunc();
  }, []);
*/
  const { data: directory } = api.get<any>(`projects/${projectId}/directory`);
  /*<Editor
      height="calc(100vh - 15rem)"
      value={JSON.stringify(directory, null, 2)}
      language="json"
    />*/

  return directory ? (
    <FileTree data={directory.container} />
  ) : (
    <LinearProgress />
  );
};
