"use client";

import React, { createContext, ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";

export const appStoreContext: React.Context<any> = createContext(null);

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  // Import moorhen reducers only on the client
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

  return (
    <appStoreContext.Provider value={store}>
      {children}
    </appStoreContext.Provider>
  );
}
