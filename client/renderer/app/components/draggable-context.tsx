import { DndContext, DragOverlay } from "@dnd-kit/core";
import { PropsWithChildren, useContext, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { Avatar } from "@mui/material";
import { File, Job } from "../models";
import { useJob } from "../utils";
import { useApi } from "../api";

export const DraggableContext: React.FC<PropsWithChildren> = (props) => {
  const { jobId } = useContext(CCP4i2Context);
  const api = useApi();
  const { mutateContainer } = useJob(jobId);
  const { activeDragItem, setActiveDragItem } = useContext(CCP4i2Context);
  const handleDragEnd = async (event: any) => {
    if (event.active.data?.current?.job) {
      const context_job = event.active.data.current.job as Job;
      if (!event.active.data?.current?.item) {
        const job = event.over.data.current.job as Job;
        const formData = {
          context_job_uuid: context_job ? context_job.uuid : null,
        };
        const result = await api
          .post<Job>(`jobs/${job.id}/set_context_job`, formData)
          .then(() => {
            if (mutateContainer) {
              mutateContainer();
            }
          });
        console.log({ context_job_response: result });
      }
    } else if (event.active.data?.current?.file) {
      const file = event.active.data.current.file as File;
      console.log("Drag file end", event);
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
