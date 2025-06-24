"use client";

import { useContext } from "react";
import { ClientStoreProvider } from "../../providers/client-store-provider";
import MoorhenWrapper, { MoorhenWrapperProps } from "./moorhen-wrapper";
import { CCP4i2Context } from "../../app-context";

const ClientSideMoorhenComponent: React.FC<MoorhenWrapperProps> = (props) => {
  const { cootModule } = useContext(CCP4i2Context);
  return (
    <ClientStoreProvider>
      {cootModule && <MoorhenWrapper {...props} />}
    </ClientStoreProvider>
  );
};

export default ClientSideMoorhenComponent;
