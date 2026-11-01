export type AdminUserRole = "admin" | "employer" | "jobseeker";
export type AdminUserStatus = "verified" | "unverified" | "suspended";
export type AdminActivityType =
  | "user_registered"
  | "job_published"
  | "application_submitted"
  | "candidate_hired";

export interface AdminMetric {
  value: number;
  changePercent: number | null;
}

export interface AdminDashboardStats {
  totalUsers: AdminMetric;
  totalEmployers: AdminMetric;
  totalJobseekers: AdminMetric;
  totalJobListings: AdminMetric;
  applicationsToday: AdminMetric;
  hiresThisMonth: AdminMetric;
}

export interface AdminGrowthPoint {
  month: string;
  newUsers: number;
  newJobListings: number;
  applications: number;
}

export interface AdminActivity {
  type: AdminActivityType;
  description: string;
  occurredAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
}

export interface AdminUserFilters {
  search?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  page: number;
  perPage: number;
}

export interface UpdateAdminUserInput {
  role?: AdminUserRole;
  suspended?: boolean;
}

export interface AdminUserPage {
  items: AdminUser[];
  pagination: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
}

export interface AdminDashboard {
  stats: AdminDashboardStats;
  userDistribution: {
    employers: number;
    jobseekers: number;
  };
  growth: AdminGrowthPoint[];
  recentActivity: AdminActivity[];
  latestUsers: AdminUser[];
  generatedAt: string;
}
