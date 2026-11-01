import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { User } from "@/features/auth/domain/entities/User";
import {
  DashboardRoleGuardView,
  resolveUnauthorizedDashboardRedirect,
} from "@/features/auth/presentation/components/DashboardRoleGuard";

const jobseekerUser: User = {
  id: 10,
  name: "Seeker User",
  email: "seeker@jobboard.com",
  role: "jobseeker",
  createdAt: "2026-10-30T00:00:00.000000Z",
};

describe("DashboardRoleGuard", () => {
  it("allows rendering when user is null or accesses an authorized role prefix", () => {
    expect(resolveUnauthorizedDashboardRedirect(null, "/admin/dashboard")).toBeNull();
    expect(
      resolveUnauthorizedDashboardRedirect(jobseekerUser, "/jobseeker/browse"),
    ).toBeNull();
  });

  it("computes the default dashboard redirect when a user visits another role's path", () => {
    expect(
      resolveUnauthorizedDashboardRedirect(jobseekerUser, "/employer/jobs"),
    ).toBe("/jobseeker/browse");
    expect(
      resolveUnauthorizedDashboardRedirect(jobseekerUser, "/admin/dashboard"),
    ).toBe("/jobseeker/browse");
  });

  it("renders children when authorized and a redirect status view when unauthorized", () => {
    const allowedHtml = renderToStaticMarkup(
      <DashboardRoleGuardView redirectTarget={null}>
        <div>Authorized workspace content</div>
      </DashboardRoleGuardView>,
    );
    expect(allowedHtml).toContain("Authorized workspace content");

    const blockedHtml = renderToStaticMarkup(
      <DashboardRoleGuardView redirectTarget="/jobseeker/browse">
        <div>Forbidden workspace content</div>
      </DashboardRoleGuardView>,
    );
    expect(blockedHtml).not.toContain("Forbidden workspace content");
    expect(blockedHtml).toContain("Redirecting to your workspace");
    expect(blockedHtml).toContain('href="/jobseeker/browse"');
  });
});
