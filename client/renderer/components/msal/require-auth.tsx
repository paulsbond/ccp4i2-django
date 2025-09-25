"use client";

"use client";
import { ReactNode, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useRouter } from "next/navigation";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();

  useEffect(() => {
    if (accounts.length === 0 && inProgress === InteractionStatus.None) {
      instance.loginRedirect().catch((e) => {
        console.error(e);
        router.push("/error?message=Login%20failed");
      });
    }
  }, [accounts, inProgress, router]);

  if (accounts.length === 0) return null;
  return <>{children}</>;
}
