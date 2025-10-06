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
      instance.loginRedirect();
    }
  }, [accounts, inProgress, instance]);

  // Check if user is signed in
  if (accounts.length === 0) return null;

  // Get the current user's account
  const currentAccount = accounts[0];
  
  // Check if the user has the required "User" role
  const userRoles = currentAccount.idTokenClaims?.roles as string[] | undefined;
  const hasUserRole = userRoles?.includes("User");

  if (!hasUserRole) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        border: '1px solid #f8bbd9',
        borderRadius: '4px',
        margin: '1rem'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have the required permissions to access this application.</p>
        <p>Please contact your administrator to request the "User" role.</p>
        <button 
          onClick={() => instance.logout()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
