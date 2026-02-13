
export type UserRole = 'OWNER' | 'STAFF';

export interface User {
  id: string;
  nickname: string;
  role: UserRole;
  passwordHash: string;
  updatedAt?: number;
  startDate?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Handover {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  createdAt: number;
  updatedAt: number;
  styles?: {
    color?: string;
    isBold?: boolean;
  };
}

export type ShiftPart = 'OPEN' | 'MIDDLE' | 'CLOSE21' | 'CLOSE22' | 'COMMON';

export interface ChecklistItem {
  id: string;
  part: ShiftPart;
  content: string;
  isCompleted: boolean;
  notes?: string;
  updatedAt?: number;
}

export interface DailyReport {
  id: string;
  date: string;
  part: ShiftPart;
  items: ChecklistItem[];
  memoToOwner: string;
  isApproved: boolean;
  submittedAt: number;
  authorNickname: string;
  authorId: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hasBreak?: boolean;
  updatedAt: number;
}

export interface WorkSchedule {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  notes?: string;
  updatedAt: number;
}

export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  count: number;
  alertEnabled: boolean;
  updatedAt: number;
}

export interface Reservation {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;
  time: string;
  item: string;
  notes: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

// Added missing Recipe-related types
export type InventoryCategory = string;

export interface RecipeDetail {
  content: string;
}

export interface RecipeTempOption {
  regular: RecipeDetail;
  large: RecipeDetail;
  max: RecipeDetail;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  hasIce: boolean;
  hasHot: boolean;
  ice?: RecipeTempOption;
  hot?: RecipeTempOption;
  lastUpdated: number;
  updatedAt: number;
}

export interface AppData {
  users: User[];
  notices: Notice[];
  handovers: Handover[];
  inventory: InventoryItem[];
  reservations: Reservation[];
  schedules: WorkSchedule[];
  reports: DailyReport[];
  tasks: ChecklistItem[];
  template: ChecklistItem[];
  recipes: Recipe[];
}
