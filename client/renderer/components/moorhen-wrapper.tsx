"use client";
import {
  addMolecule,
  addMap,
  setActiveMap,
  setWidth,
  setHeight,
} from "moorhen";
import { MoorhenContainer, MoorhenMolecule, MoorhenMap } from "moorhen";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { moorhen } from "moorhen/types/moorhen";
import { useDispatch, useSelector, useStore } from "react-redux";
import { webGL } from "moorhen/types/mgWebGL";

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

  const monomerLibraryPath =
    "https://raw.githubusercontent.com/MRC-LMB-ComputationalStructuralBiology/monomers/master/";
  const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";

  const backgroundColor = useSelector(
    (state: moorhen.State) => state.sceneSettings.backgroundColor
  );
  const defaultBondSmoothness = useSelector(
    (state: moorhen.State) => state.sceneSettings.defaultBondSmoothness
  );

  const collectedProps = {
    glRef,
    timeCapsuleRef,
    commandCentre,
    moleculesRef,
    mapsRef,
    activeMapRef,
    lastHoveredAtom,
    prevActiveMoleculeRef,
  };
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const setMoorhenDimensions = useCallback(() => {
    const result = [windowWidth, windowHeight - 75];
    return result;
  }, [windowWidth, windowHeight]);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
      console.log("Window resized");
    });
    return () => {
      window.removeEventListener("resize", () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
      });
    };
  }, []);

  useEffect(() => {
    if (fileIds && cootInitialized) {
      fileIds.forEach((fileId) => {
        fetchMolecule(`/api/proxy/files/${fileId}/download/`, `file-${fileId}`);
      });
    }
  }, [fileIds, cootInitialized]);

  useEffect(() => {
    if (cootInitialized) {
      dispatch(setWidth(window.innerWidth - 500));
      dispatch(setHeight(window.innerHeight - 156));
    }
  }, [cootInitialized]);

  const fetchMolecule = async (url: string, molName: string) => {
    if (!glRef.current) return;
    const newMolecule = new MoorhenMolecule(
      commandCentre,
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
      await newMolecule.fetchIfDirtyAndDraw("CBs");
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
    const newMap = new MoorhenMap(
      commandCentre,
      glRef as RefObject<webGL.MGWebGL>,
      store
    );
    try {
      await newMap.loadToCootFromMapURL(url, mapName, isDiffMap);
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

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MoorhenContainer
        {...collectedProps}
        setMoorhenDimensions={setMoorhenDimensions}
      />
    </div>
  );
};

export default MoorhenWrapper;
