"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ClientSideMoorhenComponent } from "../../../../components/client-side-moorhen-component";

const FileByIdPage = () => {
  const { id } = useParams();
  const { data: file } = useSWR(`/api/proxy/files/${id}`, (url) =>
    fetch(url).then((res) => res.json())
  );
  return (
    <ClientSideMoorhenComponent fileIds={id ? [parseInt(id as string)] : []} />
  );
};
export default FileByIdPage;
