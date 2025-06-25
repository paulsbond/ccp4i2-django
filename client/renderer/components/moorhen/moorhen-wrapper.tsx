"use client";

import {
  addMolecule,
  addMap,
  setActiveMap,
  setWidth,
  setHeight,
} from "moorhen";
import { MoorhenContainer, MoorhenMolecule, MoorhenMap } from "moorhen";
import {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { moorhen } from "moorhen/types/moorhen";
import { useDispatch, useSelector, useStore } from "react-redux";
import { webGL } from "moorhen/types/mgWebGL";
import { CCP4i2Context } from "../../app-context";

export interface MoorhenWrapperProps {
  fileIds?: number[];
}

const MoorhenWrapper: React.FC<MoorhenWrapperProps> = ({ fileIds }) => {
  const dispatch = useDispatch();

  const glRef: RefObject<webGL.MGWebGL | null> = useRef(null);
  const commandCentre = useRef<null | moorhen.CommandCentre>(null);
  const moleculesRef = useRef<null | moorhen.Molecule[]>(null);
  const mapsRef = useRef<null | moorhen.Map[]>(null);
  const activeMapRef = useRef<null | moorhen.Map>(null);
  const lastHoveredAtom = useRef<null | moorhen.HoveredAtom>(null);
  const prevActiveMoleculeRef = useRef<null | moorhen.Molecule>(null);
  const timeCapsuleRef = useRef(null);
  const cootInitialized = useSelector(
    (state: moorhen.State) => state.generalStates.cootInitialized
  );
  const store = useStore();
  const { cootModule } = useContext(CCP4i2Context);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).CCP4Module = cootModule;
    }
  }, [cootModule]);

  const monomerLibraryPath =
    "https://raw.githubusercontent.com/MRC-LMB-ComputationalStructuralBiology/monomers/master/";
  const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";

  const backgroundColor = useSelector(
    (state: moorhen.State) => state.sceneSettings.backgroundColor
  );
  const defaultBondSmoothness = useSelector(
    (state: moorhen.State) => state.sceneSettings.defaultBondSmoothness
  );

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const setMoorhenDimensions = useCallback(() => {
    const result = [windowWidth, windowHeight - 75];
    return result;
  }, [windowWidth, windowHeight]);

  const collectedProps = {
    glRef,
    timeCapsuleRef,
    commandCentre,
    moleculesRef,
    mapsRef,
    activeMapRef,
    lastHoveredAtom,
    prevActiveMoleculeRef,
    setMoorhenDimensions,
  };

  useEffect(() => {
    //What to do when the component mounts
    console.log("MoorhenWrapper mounted");
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight - 75);
      if (glRef.current) {
        glRef.current.drawScene();
      }
      console.log("Window resized");
    });
    return () => {
      console.log("MoorhenWrapper unmounted");
      window.removeEventListener("resize", () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight - 75);
        if (glRef.current) {
          glRef.current.drawScene();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (fileIds && cootInitialized && cootModule) {
      fileIds.forEach((fileId) => {
        fetchFile(fileId);
      });
    }
  }, [fileIds, cootInitialized, cootModule]);

  useEffect(() => {
    if (cootInitialized) {
      console.log("Coot is initialized, you can now load molecules and maps.");
      dispatch(setWidth(window.innerWidth));
      dispatch(setHeight(window.innerHeight - 75));
    }
  }, [cootInitialized]);

  const fetchFile = async (fileId) => {
    const fileInfo = await fetch(`/api/proxy/files/${fileId}/`).then((res) =>
      res.json()
    );
    console.log(fileInfo);
    if (!fileInfo) {
      console.warn(`File with ID ${fileId} not found.`);
      return;
    }
    if (fileInfo.type === "chemical/x-pdb") {
      const url = `/api/proxy/files/${fileId}/download/`;
      const molName = fileInfo.annotation || fileInfo.job_param_name;
      await fetchMolecule(url, molName);
    } else if (fileInfo.type === "application/CCP4-mtz-map") {
      const url = `/api/proxy/files/${fileId}/download/`;
      const molName = fileInfo.name || fileInfo.job_param_name;
      const isDiffMap = fileInfo.sub_type !== 1 || false;
      await fetchMap(url, molName, isDiffMap);
    } else if (fileInfo.type === "application/refmac-dictionary") {
      const url = `/api/proxy/files/${fileId}/download/`;
      await fetchDict(url);
    }
  };

  const fetchMolecule = async (url: string, molName: string) => {
    if (!glRef.current) return;
    if (!commandCentre.current) return;
    const newMolecule = new MoorhenMolecule(
      commandCentre as RefObject<moorhen.CommandCentre>,
      glRef as RefObject<webGL.MGWebGL>,
      store,
      monomerLibraryPath
    );
    newMolecule.setBackgroundColour(backgroundColor);
    newMolecule.defaultBondOptions.smoothness = defaultBondSmoothness;
    try {
      await newMolecule.loadToCootFromURL(url, molName);
      if (newMolecule.molNo === -1) {
        throw new Error("Cannot read the fetched molecule...");
      }
      await newMolecule.addRepresentation("CBs", "/*/*/*/*");
      await newMolecule.addRepresentation("ligands", "/*/*/*/*");
      await newMolecule.centreOn("/*/*/*/*", false, true);

      dispatch(addMolecule(newMolecule));
      glRef.current.drawScene();
    } catch (err) {
      console.warn(err);
      console.warn(`Cannot fetch PDB entry from ${url}, doing nothing...`);
    }
  };

  const fetchMap = async (
    url: string,
    mapName: string,
    isDiffMap: boolean = false
  ) => {
    if (!glRef.current) return;
    if (!commandCentre.current) return;
    const newMap = new MoorhenMap(
      commandCentre as RefObject<moorhen.CommandCentre>,
      glRef as RefObject<webGL.MGWebGL>,
      store
    );
    try {
      await newMap.loadToCootFromMtzURL(url, mapName, {
        F: "F",
        PHI: "PHI",
        useWeight: false,
        isDifference: isDiffMap,
      });
      if (newMap.molNo === -1)
        throw new Error("Cannot read the fetched map...");
      dispatch(addMap(newMap));
      dispatch(setActiveMap(newMap));
    } catch (err) {
      console.warn(err);
      console.warn(`Cannot fetch map from ${url}`);
    }
    return newMap;
  };

  const fetchDict = async (
    url: string,
    newMolecules: moorhen.Molecule[] = []
  ) => {
    if (!glRef.current) return;
    if (!commandCentre.current) return;
    const fileResponse = await fetch(url);
    const fileContent = await fileResponse.text();
    await commandCentre.current.cootCommand(
      {
        returnType: "status",
        command: "read_dictionary_string",
        commandArgs: [fileContent, -999999],
        changesMolecules: [],
      },
      false
    );
    const instanceName = "LIG";
    const result = (await commandCentre.current.cootCommand(
      {
        returnType: "status",
        command: "get_monomer_and_position_at",
        commandArgs: [
          instanceName,
          -999999, // This is a placeholder for the monomer ID
          ...glRef.current.origin.map((coord) => -coord),
        ],
      },
      true
    )) as moorhen.WorkerResponse<number>;
    if (result.data.result.status === "Completed") {
      const newMolecule = new MoorhenMolecule(
        commandCentre as RefObject<moorhen.CommandCentre>,
        glRef as RefObject<webGL.MGWebGL>,
        store,
        monomerLibraryPath
      );
      newMolecule.molNo = result.data.result.result;
      newMolecule.name = instanceName;
      newMolecule.setBackgroundColour(backgroundColor);
      newMolecule.defaultBondOptions.smoothness = defaultBondSmoothness;
      newMolecule.coordsFormat = "mmcif";
      await Promise.all([
        newMolecule.fetchDefaultColourRules(),
        newMolecule.addDict(fileContent),
      ]);
      newMolecule.centreAndAlignViewOn("/*/*/*/*", false, 100);
      glRef.current.drawScene();
      await newMolecule.fetchIfDirtyAndDraw("ligands");
      dispatch(addMolecule(newMolecule));
    }
  };

  return (
    store &&
    cootModule && (
      <div style={{ width: "100%", height: "100%" }}>
        <MoorhenContainer {...collectedProps} />
      </div>
    )
  );
};

export default MoorhenWrapper;
