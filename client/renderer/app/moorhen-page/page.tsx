"use client";
import { addMolecule, addMap, setActiveMap } from "moorhen";
import { MoorhenContainer, MoorhenMolecule, MoorhenMap } from "moorhen";
import { useCallback, useEffect, useRef, useState } from "react";
import { moorhen } from "moorhen/types/moorhen";
import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { store } from "../store";
const WrappedMoorhen = () => {
  const dispatch = useDispatch();

  const glRef = useRef(null);
  const timeCapsuleRef = useRef(null);
  const commandCentre = useRef(null);
  const moleculesRef = useRef(null);
  const mapsRef = useRef(null);
  const activeMapRef = useRef(null);
  const lastHoveredAtom = useRef(null);
  const prevActiveMoleculeRef = useRef(null);

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
    const result = [windowWidth - 650, windowHeight - 75];
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
  const onClick = (pdbCode: string) => {
    loadData(pdbCode);
  };

  const fetchMolecule = async (url: string, molName: string) => {
    const newMolecule = new MoorhenMolecule(
      commandCentre,
      glRef,
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
      await newMolecule.centreOn("/*/*/*/*", true, true);
      dispatch(addMolecule(newMolecule));
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
    const newMap = new MoorhenMap(commandCentre, glRef, store);
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

  const loadData = async (pdbCode: string) => {
    await fetchMolecule(`${baseUrl}/download/${pdbCode}.cif`, pdbCode);
    await fetchMap(`${baseUrl}/${pdbCode}_diff.ccp4`, `${pdbCode}-FoFc`, true);
    await fetchMap(`${baseUrl}/${pdbCode}.ccp4`, `${pdbCode}-2FoFc`);
  };

  return (
    <>
      <MoorhenContainer
        {...collectedProps}
        setMoorhenDimensions={setMoorhenDimensions}
      />
    </>
  );
};

export default WrappedMoorhen;
