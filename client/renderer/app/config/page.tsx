"use client";
import { ConfigContent } from "../components/config-content";

export default function ConfigPage() {
  return (
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
  );
}
