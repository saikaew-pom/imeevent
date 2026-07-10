"use client";

import { createContext, useContext } from "react";

// The active project for everything rendered under /p/[slug]. Set once by the
// [slug] layout (server-resolved) and read by client pages/components via the
// hooks below — replacing the old hardcoded PROJECT_SLUG constant.
export interface ProjectContextValue {
  slug: string;
  projectId: string;
  name: string;
  role: "owner" | "editor" | "viewer";
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  value,
  children,
}: {
  value: ProjectContextValue;
  children: React.ReactNode;
}) {
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider (a /p/[slug] route).");
  }
  return ctx;
}

export function useProjectSlug(): string {
  return useProject().slug;
}
