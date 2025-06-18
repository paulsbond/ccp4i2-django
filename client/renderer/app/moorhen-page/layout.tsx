"use client";
import { PropsWithChildren } from "react";
import { CootProvider } from "../components/coot-provider";
//import { MoorhenReduxStore } from "moorhen";
import { store } from "../store";
import { Provider } from "react-redux";

export default function MoorhenPageLayout(props: PropsWithChildren) {
  return (
    <Provider store={store}>
      <CootProvider>{props.children}</CootProvider>
    </Provider>
  );
}
