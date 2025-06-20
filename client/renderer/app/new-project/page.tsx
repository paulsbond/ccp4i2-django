"use client";
import { NewProjectContent } from "../../components/new-project-content";
import { NavigationShortcutsProvider } from "../../contexts/navigation-shortcuts-provider";

export default function ImportProjectPage() {
  return (
    <NavigationShortcutsProvider>
      <NewProjectContent />
    </NavigationShortcutsProvider>
  );
}
