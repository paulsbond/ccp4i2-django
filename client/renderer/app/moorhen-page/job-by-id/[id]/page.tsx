"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import MoorhenWrapper from "../../../../components/moorhen/moorhen-wrapper";
import MoorhenLoader from "../../../../components/moorhen/client-side-moorhen-loader";
import { ClientStoreProvider } from "../../../../providers/client-store-provider";
import { useJob, useProject } from "../../../../utils";

const JobByIdPage = () => {
  const { id } = useParams();
  const { job } = useJob(parseInt(id as string));
  const { files } = useProject(job?.project || parseInt("0"));
  const jobFiles = files ? files.filter((file) => file.job === job?.id) : [];
  return (
    <ClientStoreProvider>
      <MoorhenLoader fileIds={jobFiles.map((file) => file.id)} />
    </ClientStoreProvider>
  );
};
export default JobByIdPage;
