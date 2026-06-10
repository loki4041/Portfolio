export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Track = 'dsa' | 'python';

export interface Profile {
  id: string;
  display_name: string | null;
  step_goal: number;
  water_goal_ml: number;
}

export interface Todo {
  id: string;
  title: string;
  priority: Priority;
  due_date: string;
  completed: boolean;
}

export interface WaterLog {
  id: string;
  amount_ml: number;
  day: string;
}

export interface StudySession {
  id: string;
  subject: string;
  minutes: number;
  notes: string | null;
  day: string;
}

export interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  source: string | null;
  day: string;
}

export interface RoadmapTopic {
  id: string;
  track: Track;
  name: string;
  position: number;
  completed: boolean;
}
