import { PropsWithChildren } from "react";
import { ImportProjectContent } from "../components/import-project-content";

export const ImportProjectPage: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return <ImportProjectContent />;
};
export default ImportProjectPage;
