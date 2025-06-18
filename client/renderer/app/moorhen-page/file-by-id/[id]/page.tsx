"use client";
import { useParams } from "next/navigation";

export const FileByIdPage = () => {
  const { id } = useParams();
  return <span>{id}</span>;
};
export default FileByIdPage;
