"use client";

import { useContext } from "react";
import { ClientStoreProvider } from "../../providers/client-store-provider";
import MoorhenWrapper, { MoorhenWrapperProps } from "./moorhen-wrapper";
import { CCP4i2Context } from "../../app-context";
import { useStore } from "react-redux";

const ClientSideMoorhenComponent: React.FC<MoorhenWrapperProps> = (props) => {
  const { cootModule } = useContext(CCP4i2Context);
  const store = useStore();
  return (
    <ClientStoreProvider>
      {cootModule && store && <MoorhenWrapper {...props} />}
    </ClientStoreProvider>
  );
};

export default ClientSideMoorhenComponent;
