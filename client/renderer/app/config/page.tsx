"use client";
import { ConfigContent } from "../../components/config-content";
import { NavigationShortcutsProvider } from "../../contexts/navigation-shortcuts-provider";

export default function ConfigPage() {
  return (
    <NavigationShortcutsProvider>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <ConfigContent />
      </div>
    </NavigationShortcutsProvider>
  );
}
