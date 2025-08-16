import { useMemo } from "react";
import { useCCP4i2Window } from "../../../app-context";
import { Job } from "../../../types/models";
import { LinearProgress } from "@mui/material";
import AimlessPipeInterface from "./aimless_pipe";
import LidiaAcedrgNewInterface from "./LidiaAcedrgNew";
import ClustalwInterface from "./clustalw";
import Crank2Interface from "./crank2";
import GenericInterface from "./generic";
import ImportMergedInterface from "./import_merged";
import ModelcraftInterface from "./modelcraft";
import MolrepSelfrot from "./molrep_selfrot";
import ProsmartRefmacInterface from "./prosmart_refmac";
import PhaserSimpleInterface from "./phaser_simple";
import ServalcatPipeInterface from "./servalcat_pipe";
import SubstituteLigandInterface from "./SubstituteLigand";
import ProvideAsuContentsInterface from "./ProvideAsuContents";
import ProvideSequenceInterface from "./ProvideSequence";
import PhaserEPInterface from "./phaser_EP";
import PhaserEPLLGInterface from "./phaser_EP_LLG";
import PhaserPipelineInterface from "./phaser_pipeline";
import ParrotInterface from "./parrot";
import SHELXInterface from "./shelx";
import CSymmatchInterface from "./csymmatch";
import { useJob } from "../../../utils";

export interface CCP4i2TaskInterfaceProps {
  job: Job;
}

export const TaskContainer = () => {
  const { jobId } = useCCP4i2Window();
  const { job, container } = useJob(jobId);

  const taskInterface = useMemo(() => {
    switch (job?.task_name) {
      case null:
        return <LinearProgress />;
      case "aimless_pipe":
        return <AimlessPipeInterface job={job} />;
      case "clustalw":
        return <ClustalwInterface job={job} />;
      case "crank2":
        return <Crank2Interface job={job} />;
      case "csymmatch":
        return <CSymmatchInterface job={job} />;
      case "import_merged":
        return <ImportMergedInterface job={job} />;
      case "LidiaAcedrgNew":
        return <LidiaAcedrgNewInterface job={job} />;
      case "modelcraft":
        return <ModelcraftInterface job={job} />;
      case "molrep_selfrot":
        return <MolrepSelfrot job={job} />;
      case "parrot":
        return <ParrotInterface job={job} />;
      case "phaser_EP":
        return <PhaserEPInterface job={job} />;
      case "phaser_EP_LLG":
        return <PhaserEPLLGInterface job={job} />;
      case "phaser_pipeline":
        return <PhaserPipelineInterface job={job} />;
      case "phaser_simple":
        return <PhaserSimpleInterface job={job} />;
      case "prosmart_refmac":
        return <ProsmartRefmacInterface job={job} />;
      case "ProvideAsuContents":
        return <ProvideAsuContentsInterface job={job} />;
      case "ProvideSequence":
        return <ProvideSequenceInterface job={job} />;
      case "servalcat_pipe":
        return <ServalcatPipeInterface job={job} />;
      case "SubstituteLigand":
        return <SubstituteLigandInterface job={job} />;
      case "shelx":
        return <SHELXInterface job={job} />;
      default:
        return job && <GenericInterface job={job} />;
    }
  }, [job, container]);

  if (!jobId) return <LinearProgress />;
  if (!container) return <LinearProgress />;
  if (!job) return <LinearProgress />;

  return <>{taskInterface}</>;
};
