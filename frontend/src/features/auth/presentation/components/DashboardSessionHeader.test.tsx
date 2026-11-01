import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  DashboardSessionHeaderView,
  performDashboardSignOut,
} from "./DashboardSessionHeader";

describe("DashboardSessionHeaderView & sign-out controller", () => {
  it("renders employer navigation links, active aria-current state, and authenticated user details", () => {
    const markup = renderToStaticMarkup(
      <DashboardSessionHeaderView
        pathname="/employer/interviews"
        user={{
          id: 2,
          name: "Employer User",
          email: "employer@jobboard.com",
          role: "employer",
          createdAt: "2026-10-30T00:00:00.000000Z",
        }}
        isLoading={false}
        isLoggingOut={false}
        onOpenSettings={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Workspace navigation"');
    expect(markup).toContain("Employer User");
    expect(markup).toContain("employer@jobboard.com");
    expect(markup).toContain('href="/employer/jobs"');
    expect(markup).toContain('href="/employer/interviews"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("Account settings");
    expect(markup).toContain("Sign out");
  });

  it("renders jobseeker workspace links and loading placeholder before session hydration completes", () => {
    const markup = renderToStaticMarkup(
      <DashboardSessionHeaderView
        pathname="/jobseeker/browse"
        user={null}
        isLoading={true}
        isLoggingOut={false}
        onSignOut={vi.fn()}
      />,
    );

    expect(markup).toContain("Jobseeker");
    expect(markup).toContain('href="/jobseeker/browse"');
    expect(markup).toContain('href="/jobseeker/applications"');
    expect(markup).toContain('href="/jobseeker/interviews"');
    expect(markup).toContain('aria-label="Loading active user session"');
  });

  it("shows signing-out state and disables the sign-out button while logout is in flight", () => {
    const markup = renderToStaticMarkup(
      <DashboardSessionHeaderView
        pathname="/admin/dashboard"
        user={{
          id: 1,
          name: "Admin User",
          email: "admin@jobboard.com",
          role: "admin",
          createdAt: "2026-10-30T00:00:00.000000Z",
        }}
        isLoading={false}
        isLoggingOut={true}
        onSignOut={vi.fn()}
      />,
    );

    expect(markup).toContain("Admin User");
    expect(markup).toContain('href="/admin/dashboard"');
    expect(markup).toContain("Signing out…");
    expect(markup).toContain("disabled");
  });

  it("executes logout and redirects to /login with router refresh", async () => {
    const callOrder: string[] = [];
    const logout = vi.fn(async () => {
      callOrder.push("logout");
    });
    const router = {
      replace: vi.fn((href: string) => {
        callOrder.push(`replace:${href}`);
      }),
      refresh: vi.fn(() => {
        callOrder.push("refresh");
      }),
    };

    await performDashboardSignOut(logout, router);

    expect(callOrder).toEqual(["logout", "replace:/login", "refresh"]);
  });
});
