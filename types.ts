
export type UserRole = 'OWNER' | 'STAFF';

export interface User {
  id: string;
  nickname: string;
  role: UserRole;
  passwordHash: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  isPinned: boolean;
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
}

export interface DailyReport {
  id: string;
  date: string;
  part: ShiftPart;
  items: ChecklistItem[];
  memoToOwner: string;
  isApproved: boolean;
  submittedAt: number;
  // 실제 근무 정보 필드 추가
  authorNickname: string;
  authorId: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hasBreak?: boolean;
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
}
