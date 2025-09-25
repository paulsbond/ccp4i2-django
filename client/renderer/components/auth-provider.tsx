"use client";
import { ReactNode, useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}`,
    redirectUri: "/",
  },
};

const pca = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    pca.initialize().then(() => setInitialized(true));
  }, []);

  if (!initialized) return null; // or a loading spinner

  return <MsalProvider instance={pca}>{children}</MsalProvider>;
}
