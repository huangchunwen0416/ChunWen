import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NameManager } from './components/NameManager';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouper } from './components/AutoGrouper';
import { ProjectorStage } from './components/ProjectorStage';
import { Student, DrawHistoryItem, PickerSettings } from './types';
import { parseRawTextToStudents, SAMPLE_CLASSES } from './utils/csvParser';
import {
  loadSavedStudents,
  saveStudents,
  loadDrawHistory,
  saveDrawHistory,
  loadSettings,
  saveSettings,
} from './utils/storage';

export default function App() {
  // Load initial students or populate sample dataset on first load
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = loadSavedStudents();
    if (saved.length > 0) return saved;
    // Default initial sample class so app shows working state instantly
    return parseRawTextToStudents(SAMPLE_CLASSES[0].names.join('\n'));
  });

  const [drawHistory, setDrawHistory] = useState<DrawHistoryItem[]>(() => loadDrawHistory());
  const [settings, setSettings] = useState<PickerSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<'manager' | 'picker' | 'grouper'>('picker');
  const [isProjectorOpen, setIsProjectorOpen] = useState<boolean>(false);

  // Sync students to localStorage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  // Sync history to localStorage
  useEffect(() => {
    saveDrawHistory(drawHistory);
  }, [drawHistory]);

  // Sync settings to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  const handleResetDrawnStatus = () => {
    setStudents(prev => prev.map(s => ({ ...s, drawn: false })));
  };

  const handleUpdateSettings = (newSettings: Partial<PickerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleAddHistory = (item: DrawHistoryItem) => {
    setDrawHistory(prev => [item, ...prev]);
  };

  const handleClearHistory = () => {
    setDrawHistory([]);
  };

  const drawnCount = students.filter(s => s.drawn).length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        drawnCount={drawnCount}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenProjector={() => setIsProjectorOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'manager' && (
          <NameManager
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onResetDrawnStatus={handleResetDrawnStatus}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onUpdateStudents={handleUpdateStudents}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            drawHistory={drawHistory}
            onAddHistory={handleAddHistory}
            onClearHistory={handleClearHistory}
            onOpenProjector={() => setIsProjectorOpen(true)}
          />
        )}

        {activeTab === 'grouper' && (
          <AutoGrouper
            students={students}
            soundEnabled={settings.soundEnabled}
          />
        )}
      </main>

      {/* Fullscreen Projector Stage */}
      {isProjectorOpen && (
        <ProjectorStage
          students={students}
          onUpdateStudents={handleUpdateStudents}
          settings={settings}
          onClose={() => setIsProjectorOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 text-center text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            班級隨機抽籤與自動分組工具 · 專為教師教學設計
          </div>
          <div className="text-stone-400">
            支援 CSV 匯入/匯出 · Web Audio 音效 · 本地自動儲存
          </div>
        </div>
      </footer>
    </div>
  );
}
