
export type UserRole = 'OWNER' | 'STAFF';

export interface User {
  id: string;
  nickname: string; // Must include real name
  role: UserRole;
  passwordHash: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  isPinned: boolean; // Pinned only by Owners
  createdAt: number;
}

export interface Handover {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  createdAt: number;
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
  lastModifiedBy?: string;
}

export interface DailyReport {
  date: string;
  part: ShiftPart;
  items: ChecklistItem[];
  memoToOwner: string;
  isApproved: boolean;
  submittedAt?: number;
}

export interface WorkSchedule {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hasBreak: boolean; // Auto 30 min
  notes?: string;
}

export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  count: number;
  alertEnabled: boolean;
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
}

export type InventoryCategory = '홀케익' | '피스케익' | '과일' | '음료관련' | '포장재' | '기타' | string;
