export interface Student {
  id: string;
  name: string;
  seatNumber?: number | string;
  gender?: 'M' | 'F' | 'Other';
  note?: string;
  drawn?: boolean;
}

export interface DrawHistoryItem {
  id: string;
  student: Student;
  timestamp: string;
}

export type PickerMode = 'slot' | 'card' | 'wheel';

export interface PickerSettings {
  allowRepeat: boolean;
  pickCount: number; // How many students to pick at once (default 1)
  animationSpeed: 'fast' | 'normal' | 'slow';
  soundEnabled: boolean;
  pickerMode: PickerMode;
}

export type GroupingStrategy = 'perGroup' | 'totalGroups';

export interface GroupConfig {
  strategy: GroupingStrategy;
  targetNumber: number; // Number of students per group OR total number of groups
  balanceGender: boolean;
  groupPrefix: string; // Default: '第 {n} 組'
}

export interface StudentGroup {
  id: string;
  name: string;
  color: string;
  students: Student[];
}
