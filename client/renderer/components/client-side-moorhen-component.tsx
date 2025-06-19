"use client";

import { ClientStoreProvider } from "../contexts/client-store-provider";
import MoorhenWrapper from "./moorhen-wrapper";

export const ClientSideMoorhenComponent = () => {
  return (
    <ClientStoreProvider>
      <MoorhenWrapper />
    </ClientStoreProvider>
  );
};
