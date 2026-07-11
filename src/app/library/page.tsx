import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getPrimaryCompanyId, listCompanies, isCompanyAdmin, listUserProjects } from "@/lib/auth/queries";
import { listLibraryMedia, listLibraryActs, listLibraryVendors } from "@/lib/builder/companyLibrary";
import { LibraryClient } from "@/components/library/LibraryClient";

export default async function LibraryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Same "caller's own company, resolved server-side" rule as the API
  // routes — a super admin with no membership row of their own falls back
  // to the first company that exists.
  let companyId = await getPrimaryCompanyId(user.id);
  if (!companyId && user.isAdmin) {
    const companies = await listCompanies();
    companyId = companies[0]?.id ?? null;
  }
  if (!companyId) redirect("/projects");

  const isAdmin = user.isAdmin || (await isCompanyAdmin(user.id, companyId));

  const [media, acts, vendors, projects] = await Promise.all([
    listLibraryMedia(companyId),
    listLibraryActs(companyId),
    listLibraryVendors(companyId),
    listUserProjects(user.id),
  ]);
  const writableProjects = projects
    .filter((p) => p.role === "owner" || p.role === "editor")
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <LibraryClient
      isAdmin={isAdmin}
      initialMedia={media}
      initialActs={acts}
      initialVendors={vendors}
      projects={writableProjects}
    />
  );
}
