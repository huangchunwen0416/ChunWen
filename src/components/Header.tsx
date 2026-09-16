import React from 'react';
import { Users, Shuffle, Layers, Volume2, VolumeX, Maximize, Sparkles, GraduationCap } from 'lucide-react';
import { PickerSettings } from '../types';

interface HeaderProps {
  activeTab: 'manager' | 'picker' | 'grouper';
  setActiveTab: (tab: 'manager' | 'picker' | 'grouper') => void;
  studentCount: number;
  drawnCount: number;
  settings: PickerSettings;
  onUpdateSettings: (newSettings: Partial<PickerSettings>) => void;
  onOpenProjector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  drawnCount,
  settings,
  onUpdateSettings,
  onOpenProjector,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
                班級抽籤與分組工具
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  教師專用
                </span>
              </h1>
              <p className="text-xs text-stone-500 hidden sm:block">
                隨機抽名單 · 音效動畫 · 不重複抽取 · 自動視覺化分組
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              id="tab-manager-btn"
              onClick={() => setActiveTab('manager')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'manager'
                  ? 'bg-amber-50 text-amber-700 shadow-xs border border-amber-200'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              <span>名單管理</span>
              {studentCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-stone-200 text-stone-700 font-semibold">
                  {studentCount}
                </span>
              )}
            </button>

            <button
              id="tab-picker-btn"
              onClick={() => setActiveTab('picker')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'picker'
                  ? 'bg-amber-50 text-amber-700 shadow-xs border border-amber-200'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Shuffle className="w-4 h-4 mr-1.5" />
              <span>隨機抽籤</span>
              {!settings.allowRepeat && drawnCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-200 text-amber-900 font-semibold">
                  {drawnCount}/{studentCount}
                </span>
              )}
            </button>

            <button
              id="tab-grouper-btn"
              onClick={() => setActiveTab('grouper')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'grouper'
                  ? 'bg-amber-50 text-amber-700 shadow-xs border border-amber-200'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4 mr-1.5" />
              <span>自動分組</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Audio Toggle */}
            <button
              id="toggle-sound-btn"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              title={settings.soundEnabled ? '音效：開啟 (點擊關閉)' : '音效：靜音 (點擊開啟)'}
              className={`p-2 rounded-lg border text-sm transition-colors ${
                settings.soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-stone-100 border-stone-200 text-stone-400 hover:bg-stone-200'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Projector Big Screen Button */}
            <button
              id="open-projector-btn"
              onClick={onOpenProjector}
              className="hidden md:flex items-center px-3 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Maximize className="w-4 h-4 mr-1.5 text-amber-400" />
              <span>投影全螢幕</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
