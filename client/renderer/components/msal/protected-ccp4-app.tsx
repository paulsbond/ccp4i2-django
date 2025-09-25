"use client";
import { PropsWithChildren } from "react";
import RequireAuth from "./require-auth";
import { CCP4i2App } from "../../providers/ccp4i2-app";

export const ProtectedCCP4i2App = (props: PropsWithChildren) => {
  return (
    <RequireAuth>
      <CCP4i2App>{props.children}</CCP4i2App>
    </RequireAuth>
  );
};
