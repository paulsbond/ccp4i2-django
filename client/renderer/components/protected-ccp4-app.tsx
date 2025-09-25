import { PropsWithChildren } from "react";
import RequireAuth from "./require-auth";

export const ProtectedCCP4i2App = (props: PropsWithChildren) => {
  return <RequireAuth>{props.children}</RequireAuth>;
};
