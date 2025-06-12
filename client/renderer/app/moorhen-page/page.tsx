"use client";
import { MenuItem, Skeleton } from "@mui/material";
import React, { useContext } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CCP4i2Context } from "../app-context";

export default function MoorhenPage() {
  const [store, setStore] = useState<any>(null);
  const { cootModule, setCootModule } = useContext(CCP4i2Context);

  useEffect(() => {
    console.log("In use effect", typeof window !== "undefined");
    if (cootModule && typeof window !== "undefined") {
      // Dynamically import the moorhen module
      import("moorhen")
        .then((moorhen) => {
          console.log({ moorhen });
          // Extract reducers from the dynamically loaded module
          const {
            moleculesReducer,
            mapsReducer,
            mouseSettingsReducer,
            backupSettingsReducer,
            shortcutSettingsReducer,
            labelSettingsReducer,
            sceneSettingsReducer,
            miscAppSettingsReducer,
            generalStatesReducer,
            hoveringStatesReducer,
            modalsReducer,
            mapContourSettingsReducer,
            moleculeMapUpdateReducer,
            sharedSessionReducer,
            refinementSettingsReducer,
            lhasaReducer,
          } = moorhen;

          // Configure the store with the dynamically loaded reducers

          // Set the store in state
          setStore(store);
        })
        .catch((error) => {
          console.error("Failed to load moorhen module:", error);
        });
    }
  }, [cootModule]);

  const doClick = (evt) => {
    console.log("Click!");
  };

  const exportMenuItem = (
    <MenuItem key={"example-key"} id="example-menu-item" onClick={doClick}>
      Example extra menu
    </MenuItem>
  );

  return store ? <Provider store={store}>Hello</Provider> : <Skeleton />;
}
