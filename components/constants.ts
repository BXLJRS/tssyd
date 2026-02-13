
import { ShiftPart } from './types';

export const SHIFT_LABELS: Record<ShiftPart, string> = {
  OPEN: '오픈 (09:30~)',
  MIDDLE: '미들',
  CLOSE21: '21시 마감',
  CLOSE22: '22시 마감',
  COMMON: '공통'
};

export const INITIAL_CATEGORIES = ['홀케익', '피스케익', '과일(냉동/생)', '음료관련', '포장재', '기타'];

export const TWOSOME_THEME = {
  primary: '#D32F2F', // Twosome Red
  secondary: '#212121', // Twosome Black
  accent: '#757575',
  background: '#F5F5F5'
};
