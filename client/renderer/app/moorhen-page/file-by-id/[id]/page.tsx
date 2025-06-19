"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import MoorhenWrapper from "../../../../components/moorhen-wrapper";

const FileByIdPage = () => {
  const { id } = useParams();
  const { data: file } = useSWR(`/api/proxy/files/${id}`, (url) =>
    fetch(url).then((res) => res.json())
  );
  return <MoorhenWrapper fileIds={file ? [file?.id] : []} />;
};
export default FileByIdPage;
