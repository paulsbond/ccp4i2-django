"use client";
import { PropsWithChildren } from "react";
import { CootProvider } from "../../providers/coot-provider";
import { RdkitProvider } from "../../providers/rdkit-provider";

export default function ProjectLayout(props: PropsWithChildren) {
  return (
    <CootProvider>
      <RdkitProvider>
        {/* Children components will be rendered here */}
        {props.children}
      </RdkitProvider>
    </CootProvider>
  );
}
