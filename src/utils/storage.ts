import { Student, DrawHistoryItem, PickerSettings } from '../types';

const STORAGE_KEY_STUDENTS = 'class_students_list_v1';
const STORAGE_KEY_HISTORY = 'class_draw_history_v1';
const STORAGE_KEY_SETTINGS = 'class_picker_settings_v1';

export const defaultSettings: PickerSettings = {
  allowRepeat: false,
  pickCount: 1,
  animationSpeed: 'normal',
  soundEnabled: true,
  pickerMode: 'slot',
};

export function loadSavedStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load students from localStorage', e);
  }
  return [];
}

export function saveStudents(students: Student[]) {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students', e);
  }
}

export function loadDrawHistory(): DrawHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load draw history', e);
  }
  return [];
}

export function saveDrawHistory(history: DrawHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save draw history', e);
  }
}

export function loadSettings(): PickerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: PickerSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
