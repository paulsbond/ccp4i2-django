"use client";
import { PropsWithChildren } from "react";
import { CootProvider } from "../components/coot-provider";

export default function MoorhenPageLayout(props: PropsWithChildren) {
  return <CootProvider>Hi{props.children}</CootProvider>;
}
