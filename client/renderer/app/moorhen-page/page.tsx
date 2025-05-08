"use client";
import { MenuItem } from "@mui/material";
import { MoorhenContainer, MoorhenReduxStore } from "moorhen";

export default function MoorhenPage() {
  const doClick = (evt) => {
    console.log("Click!");
  };

  const exportMenuItem = (
    <MenuItem key={"example-key"} id="example-menu-item" onClick={doClick}>
      Example extra menu
    </MenuItem>
  );

  const setDimensions = () => {
    return [window.innerWidth, window.innerHeight];
  };
  //const MoorhenReduxProvider = MoorhenReduxStore.getMoorhenReduxProvider();
  ////const setMoorhenDimensions = MoorhenReduxStore.getSetMoorhenDimensions();

  // @ts-ignore
  //window.moorhenReduxStore = MoorhenReduxStore;

  // @ts-ignore
  //window.moorhenContainer = MoorhenContainer;
  return <span>"Hello"</span>;
}
