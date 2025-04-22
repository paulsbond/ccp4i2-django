import { DndContext, DragOverlay } from "@dnd-kit/core";
import { PropsWithChildren, useCallback, useContext, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { Avatar } from "@mui/material";
import { File, Job, Project } from "../models";
import { useJob } from "../utils";
import { useApi } from "../api";
import { TaskInterfaceContext } from "./task/task-container";

export const DraggableContext: React.FC<PropsWithChildren> = (props) => {
  const { jobId } = useContext(CCP4i2Context);

  const { setInFlight } = useContext(TaskInterfaceContext);

  const api = useApi();

  const { job, mutateContainer, fileItemToParameterArg, setParameter } =
    useJob(jobId);

  const { activeDragItem, setActiveDragItem } = useContext(CCP4i2Context);

  const setContextJob = useCallback(
    (job: Job, context_job: Job) => {
      const formData = {
        context_job_uuid: context_job ? context_job.uuid : null,
      };
      api.post<Job>(`jobs/${job.id}/set_context_job`, formData).then(() => {
        if (mutateContainer) {
          mutateContainer();
        }
      });
    },
    [mutateContainer, api]
  );

  const { data: project_jobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job?.project,
    endpoint: "jobs",
  });

  const { data: projects } = api.get<Project[]>("projects");

  const setFileByDrop = useCallback(
    async (job: Job, objectPath: string, file: File) => {
      if (!job) return;
      if (!objectPath) return;
      if (!file) return;
      if (!project_jobs) return;
      if (!projects) return;
      const setParameterArg = fileItemToParameterArg(
        file,
        objectPath,
        project_jobs,
        projects
      );
      setInFlight(true);
      await setParameter(setParameterArg);
      await mutateContainer();
    },
    [project_jobs, projects, fileItemToParameterArg]
  );

  const handleDragEnd = async (event: any) => {
    if (event.active.data?.current?.job) {
      const context_job = event.active.data.current.job as Job;
      if (!event.over.data?.current?.job) return;
      if (!event.over.data?.current?.item) {
        const job = event.over.data.current.job as Job;
        setContextJob(job, context_job);
      }
    } else if (event.active.data?.current?.file) {
      const file = event.active.data.current.file as File;
      if (!event.over.data?.current?.job) return;
      if (event.over.data?.current?.item) {
        const job = event.over.data.current.job as Job;
        setFileByDrop(job, event.over.data?.current?.item._objectPath, file);
      }
    }
  };

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={({ active }) => {
        console.log("Drag start", active);
        setActiveDragItem(active.data.current as File | Job);
      }}
    >
      {props.children}
      <DragOverlay>
        {activeDragItem ? (
          <Avatar
            src={`/api/proxy/djangostatic/qticons/ccp4i2.png`}
            sx={{
              width: 64,
              height: 64,
              boxShadow: 3,
              opacity: 0.8,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
