
export const calculateWorkHours = (start: string, end: string, hasBreak: boolean): number => {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;
  
  let diff = endMinutes - startMinutes;
  if (hasBreak) diff -= 30; // Mandatory 30 min break
  
  return Math.max(0, diff / 60);
};

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp);
};

export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const getDayOfWeek = (dateStr: string): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
};
