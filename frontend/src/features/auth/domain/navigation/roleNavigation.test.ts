import { describe, expect, it } from "vitest";
import {
  canAccessDashboardPath,
  getDefaultDashboardPath,
  getRoleLabel,
  getRoleNavigationItems,
  inferRoleFromPathname,
  isNavItemActive,
  resolvePostAuthRedirect,
} from "./roleNavigation";

describe("roleNavigation domain rules", () => {
  it("returns default dashboard paths and labels for each role", () => {
    expect(getDefaultDashboardPath("admin")).toBe("/admin/dashboard");
    expect(getDefaultDashboardPath("employer")).toBe("/employer/jobs");
    expect(getDefaultDashboardPath("jobseeker")).toBe("/jobseeker/browse");

    expect(getRoleLabel("admin")).toBe("Admin");
    expect(getRoleLabel("employer")).toBe("Employer");
    expect(getRoleLabel("jobseeker")).toBe("Jobseeker");
  });

  it("provides navigation items matching each role workspace", () => {
    expect(getRoleNavigationItems("admin").map((item) => item.href)).toEqual([
      "/admin/dashboard",
    ]);
    expect(getRoleNavigationItems("employer").map((item) => item.href)).toEqual([
      "/employer/jobs",
      "/employer/interviews",
    ]);
    expect(getRoleNavigationItems("jobseeker").map((item) => item.href)).toEqual([
      "/jobseeker/browse",
      "/jobseeker/applications",
      "/jobseeker/interviews",
    ]);
  });

  it("matches active navigation items for nested routes", () => {
    const [employerJobsNav, employerInterviewsNav] =
      getRoleNavigationItems("employer");

    expect(isNavItemActive(employerJobsNav, "/employer/jobs")).toBe(true);
    expect(isNavItemActive(employerJobsNav, "/employer/jobs/12/applicants")).toBe(
      true,
    );
    expect(isNavItemActive(employerJobsNav, "/employer/interviews")).toBe(false);
    expect(isNavItemActive(employerInterviewsNav, "/employer/interviews")).toBe(
      true,
    );
  });

  it("infers role from pathname and enforces role-scoped post-auth redirects", () => {
    expect(inferRoleFromPathname("/employer/jobs/new")).toBe("employer");
    expect(inferRoleFromPathname("/jobseeker/interviews")).toBe("jobseeker");
    expect(inferRoleFromPathname("/admin/dashboard")).toBe("admin");
    expect(inferRoleFromPathname("/login")).toBeNull();

    expect(canAccessDashboardPath("employer", "/employer/interviews")).toBe(true);
    expect(canAccessDashboardPath("employer", "/admin/dashboard")).toBe(false);

    expect(resolvePostAuthRedirect("employer", "/employer/interviews")).toBe(
      "/employer/interviews",
    );
    expect(resolvePostAuthRedirect("employer", "/jobseeker/browse")).toBe(
      "/employer/jobs",
    );
    expect(resolvePostAuthRedirect("jobseeker", "//malicious.example")).toBe(
      "/jobseeker/browse",
    );
  });
});
