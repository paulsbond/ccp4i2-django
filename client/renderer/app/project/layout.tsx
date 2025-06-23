"use client";
import { PropsWithChildren } from "react";
import { CootProvider } from "../../providers/coot-provider";

export default function ProjectLayout(props: PropsWithChildren) {
  return (
    <CootProvider>
      {/* Children components will be rendered here */}
      {props.children}
    </CootProvider>
  );
}
