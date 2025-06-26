"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import MoorhenLoader from "../../../../components/moorhen/client-side-moorhen-loader";

const FileByIdPage = () => {
  const { id } = useParams();
  const { data: file } = useSWR(`/api/proxy/files/${id}`, (url) =>
    fetch(url).then((res) => res.json())
  );
  return <MoorhenLoader fileIds={id ? [parseInt(id as string)] : []} />;
};
export default FileByIdPage;
