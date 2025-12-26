-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Team Members Table
-- Links to Supabase auth.users
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('MANAGER', 'MEMBER')) NOT NULL DEFAULT 'MEMBER',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_number TEXT NOT NULL,
  project_owner TEXT,
  source TEXT,
  batch_info TEXT,
  received_date DATE,
  start_date DATE,
  completion_date DATE,
  deadline_date DATE,
  assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')) NOT NULL DEFAULT 'PENDING',
  priority TEXT CHECK (priority IN ('NORMAL', 'URGENT')) NOT NULL DEFAULT 'NORMAL',
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Progress Table (8 steps)
CREATE TABLE task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 8),
  label TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, day)
);

-- Task History Table (for audit trail)
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  change_type TEXT CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ASSIGNMENT_CHANGE')) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_deadline_date ON tasks(deadline_date);
CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_progress_updated_at
  BEFORE UPDATE ON task_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log task history
CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, new_data)
    VALUES (NEW.id, NEW.created_by, 'CREATE', row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data, new_data)
    VALUES (NEW.id, NEW.updated_by, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data)
    VALUES (OLD.id, OLD.updated_by, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task history
CREATE TRIGGER task_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_history();

