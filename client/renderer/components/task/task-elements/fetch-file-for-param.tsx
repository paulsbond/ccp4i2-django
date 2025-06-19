import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../types/models";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CCP4i2Context } from "../../../app-context";
import { useJob } from "../../../utils";

interface FetchFileForParamProps {
  itemParams: any;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedItem: any) => void;
}
export const FetchFileForParam: React.FC<FetchFileForParamProps> = ({
  itemParams,
  open,
  onClose,
}) => {
  const api = useApi();

  const { item, modes, onParameterChangeSuccess } = useMemo(() => {
    //alert(JSON.stringify(itemParams));
    return itemParams
      ? itemParams
      : { item: null, modes: null, onParameterChangeSuccess: null };
  }, [itemParams]);

  const downloadModes: string[] = useMemo(
    () => modes || item?._qualifiers?.downloadModes || [],
    [item, modes]
  );

  const { jobId, cootModule } = useContext(CCP4i2Context);
  const { job } = useJob(jobId);

  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job?.project,
    endpoint: "jobs",
  });

  const { mutate: mutateContainer } = api.get_wrapped_endpoint_json<any>({
    type: "jobs",
    id: job?.id,
    endpoint: "container",
  });

  const { mutate: mutateValidation } = api.get_endpoint_xml({
    type: "jobs",
    id: job?.id,
    endpoint: "validation",
  });

  const { mutate: mutateFiles } = api.get<File[]>(
    `projects/${job?.project}/files`
  );
  const [mode, setMode] = useState<string | null>(null);

  useEffect(() => {
    if (modes && modes.length > 0 && (!mode || !modes.includes(mode))) {
      setMode(modes[0]);
    }
  }, [modes]);

  const [identifier, setIdentifier] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (fileBlob: Blob, fileName: string) => {
      if (job) {
        const formData = new FormData();
        formData.append("objectPath", itemParams.item._objectPath);
        formData.append("file", fileBlob, fileName);
        const uploadResult = await api.post<any>(
          `jobs/${job.id}/upload_file_param`,
          formData
        );
        if (uploadResult.status === "Success") {
          if (onParameterChangeSuccess) {
            onParameterChangeSuccess(uploadResult.updated_item);
          }
          mutateJobs();
          mutateFiles();
          mutateContainer();
          mutateValidation();
        }
      }
    },
    [itemParams, job]
  );

  const handleEbiCoordFetch = useCallback(async () => {
    if (identifier) {
      try {
        const url = `https://www.ebi.ac.uk/pdbe/api/pdb/entry/files/${identifier.toLowerCase()}`;
        const result = await fetch(url);
        if (result.ok) {
          const data = await result.json();
          if (data && data[identifier.toLowerCase()]) {
            const file = data[identifier.toLowerCase()];
            let fetchURL = file.PDB.downloads
              .filter((item: any) => item.label === "Archive mmCIF file")
              .at(0).url;
            const fileContent = await fetch(fetchURL);
            if (fileContent.ok) {
              const content = await fileContent.blob();
              uploadFile(content, fetchURL.split("/").at(-1));
              onClose();
            }
          }
        } else {
          console.log("FetchFileForParam handleFetch result", result);
        }
      } catch (err) {
        console.log("FetchFileForParam handleFetch error", err);
        return;
      }
    }
  }, [identifier, uploadFile, onClose]);

  const handleEbiSFsFetch = useCallback(async () => {
    if (identifier) {
      const url = `https://www.ebi.ac.uk/pdbe/api/pdb/entry/files/${identifier.toLowerCase()}`;
      const result = await fetch(url);
      if (result.ok) {
        const data = await result.json();
        if (data && data[identifier.toLowerCase()]) {
          const file = data[identifier.toLowerCase()];
          let fetchURL = file.PDB.downloads
            .filter((item: any) => item.label === "Structure Factors")
            .at(0).url;
          const fileContent = await fetch(fetchURL);
          if (fileContent.ok) {
            const content = await fileContent.blob();
            uploadFile(content, fetchURL.split("/").at(-1));
            onClose();
          }
        }
      } else {
        console.log("FetchFileForParam handleFetch result", result);
      }
    }
  }, [identifier, uploadFile, onClose]);

  const handleUniprotFastaFetch = useCallback(async () => {
    if (identifier) {
      const url = `/api/proxy/uniprot/${identifier.toUpperCase()}.fasta`;
      const result = await fetch(url);
      if (result.ok) {
        const data = await result.text();
        const content = new Blob([data], {
          type: "text/plain",
        });
        uploadFile(content, `${identifier.toUpperCase()}.fasta`);
        onClose();
      } else {
        console.log("FetchFileForParam handleFetch result", result);
      }
    }
  }, [identifier, uploadFile, onClose]);

  const handleFetch = useCallback(async () => {
    if (mode) {
      if (mode === "ebiPdb") {
        handleEbiCoordFetch();
      } else if (mode === "ebiSFs") {
        handleEbiSFsFetch();
      } else if (mode === "uniprotFasta") {
        handleUniprotFastaFetch();
      }
    }
  }, [mode, identifier]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {" "}
        Fetch value for {item?._objectPath?.split(".").at(-1)} from internet
      </DialogTitle>
      <DialogContent>
        {downloadModes?.length && downloadModes?.length > 0 ? (
          <>
            <Autocomplete
              sx={{ width: "30rem", mt: 2 }}
              value={mode || ""}
              renderInput={(params) => (
                <TextField {...params} label="Download mode" />
              )}
              options={downloadModes}
              onChange={(event, newValue) => {
                setMode(newValue);
              }}
            />
            <TextField
              sx={{ width: "30rem", mt: 2 }}
              label="Accession code"
              value={identifier || ""}
              onChange={(event) => {
                setIdentifier(event.target.value);
              }}
            />
          </>
        ) : (
          <Typography>nload modes</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleFetch}>Fetch</Button>
      </DialogActions>
    </Dialog>
  );
};
