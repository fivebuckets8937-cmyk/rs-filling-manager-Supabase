export enum TaskStatus {
  PENDING = 'PENDING',       // Just created, not assigned
  ASSIGNED = 'ASSIGNED',     // Assigned to a person
  IN_PROGRESS = 'IN_PROGRESS', // Work started
  COMPLETED = 'COMPLETED',   // Finished
}

export interface DailyTask {
  day: number;
  label: string;
  isCompleted: boolean;
  notes: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'MANAGER' | 'MEMBER';
  avatar: string;
}

export interface Task {
  id: string;
  projectNumber: string;
  projectOwner: string; // The external requester
  source: string;
  batchInfo: string;
  receivedDate: string; // When the request came in
  startDate: string;    // When work actually starts (Day 1)
  completionDate?: string; // When work finished
  deadlineDate: string;
  assigneeId: string | null;
  status: TaskStatus;
  progress: DailyTask[]; // Array of 5 days
  priority: 'NORMAL' | 'URGENT';
}

export interface DashboardStats {
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  tasksPerMember: { name: string; count: number }[];
}