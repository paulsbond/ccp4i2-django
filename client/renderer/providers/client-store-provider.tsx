"use client";

import React, { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  const {
    moleculesReducer,
    mapsReducer,
    mouseSettingsReducer,
    backupSettingsReducer,
    shortcutSettingsReducer,
    labelSettingsReducer,
    sceneSettingsReducer,
    generalStatesReducer,
    hoveringStatesReducer,
    modalsReducer,
    mapContourSettingsReducer,
    moleculeMapUpdateReducer,
    sharedSessionReducer,
    refinementSettingsReducer,
    lhasaReducer,
    overlaysReducer,
  } = require("moorhen");

  const store = configureStore({
    reducer: {
      molecules: moleculesReducer,
      maps: mapsReducer,
      mouseSettings: mouseSettingsReducer,
      backupSettings: backupSettingsReducer,
      shortcutSettings: shortcutSettingsReducer,
      labelSettings: labelSettingsReducer,
      sceneSettings: sceneSettingsReducer,
      generalStates: generalStatesReducer,
      hoveringStates: hoveringStatesReducer,
      modals: modalsReducer,
      mapContourSettings: mapContourSettingsReducer,
      moleculeMapUpdate: moleculeMapUpdateReducer,
      sharedSession: sharedSessionReducer,
      refinementSettings: refinementSettingsReducer,
      lhasa: lhasaReducer,
      overlays: overlaysReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

  return <Provider store={store}>{children}</Provider>;
}
