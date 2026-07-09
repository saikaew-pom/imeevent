import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listUserProjects } from "@/lib/auth/queries";
import { SignOutButton } from "@/components/SignOutButton";
import { ink, sub, border, hoverBg } from "@/lib/notionTheme";

// Only project we route internally today — extend this map as more projects
// get their own dashboards.
const PROJECT_HREF: Record<string, string> = {
  "jw-gala-garden-night": "/dashboard",
};

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const projects = await listUserProjects(user.id);

  return (
    <div className="min-h-screen font-sans" style={{ background: "#ffffff", color: ink }}>
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto max-w-[880px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
              style={{ background: ink, color: "#fff" }}
            >
              E
            </span>
            <span className="text-[14px] font-semibold">EventFlow Production</span>
          </div>
          <div className="flex items-center gap-4">
            {user.isAdmin && (
              <Link href="/admin" className="text-[13px] hover:underline" style={{ color: sub }}>
                Admin
              </Link>
            )}
            <SignOutButton className="text-[13px] hover:underline" style={{ color: sub }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h1 className="text-[22px] font-semibold mb-1">Your projects</h1>
        <p className="text-[13.5px] mb-8" style={{ color: sub }}>
          Signed in as {user.name} ({user.email})
        </p>

        {projects.length === 0 ? (
          <div
            className="rounded-[8px] px-5 py-6 text-[13.5px]"
            style={{ border: `1px solid ${border}`, color: sub }}
          >
            You don&apos;t have any projects assigned yet. Ask your admin to add you to
            one.
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={PROJECT_HREF[p.slug] ?? "#"}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-[8px] transition-colors"
                style={{ border: `1px solid ${border}` }}
              >
                <span
                  className="w-9 h-9 rounded-[7px] flex items-center justify-center shrink-0 text-[13px] font-semibold"
                  style={{ background: hoverBg, color: ink }}
                >
                  {p.name.slice(0, 1)}
                </span>
                <span className="flex-1">
                  <span className="text-[14.5px] font-semibold block">{p.name}</span>
                  <span className="text-[12px]" style={{ color: sub }}>
                    Your role: {p.role}
                  </span>
                </span>
                <span className="text-[13px]" style={{ color: sub }}>
                  Open →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
