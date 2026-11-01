export type InterviewStatus = "scheduled" | "confirmed" | "cancelled" | "completed";

export interface Interview {
  id: number;
  jobApplicationId: number;
  jobListing: { id: number; title: string };
  employer: { id: number; name: string };
  candidate: { id: number; name: string; email: string };
  scheduledAt: string;
  endsAt: string;
  durationMinutes: number;
  timezone: string;
  location: string;
  notes: string | null;
  status: InterviewStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewCounts {
  total: number;
  scheduled: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

export interface InterviewPage {
  items: Interview[];
  pagination: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
  counts: InterviewCounts;
}
