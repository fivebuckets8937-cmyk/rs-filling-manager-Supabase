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

// Database types (matching Supabase schema)
export interface DatabaseTeamMember {
  id: string;
  user_id: string;
  name: string;
  role: 'MANAGER' | 'MEMBER';
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  project_number: string;
  project_owner: string | null;
  source: string | null;
  batch_info: string | null;
  received_date: string | null;
  start_date: string | null;
  completion_date: string | null;
  deadline_date: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  priority: 'NORMAL' | 'URGENT';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTaskProgress {
  id: string;
  task_id: string;
  day: number;
  label: string;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Application types (for frontend use)
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
  progress: DailyTask[]; // Array of 8 steps
  priority: 'NORMAL' | 'URGENT';
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  tasksPerMember: { name: string; count: number }[];
}