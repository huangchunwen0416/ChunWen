import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Minimize, Play, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Student, PickerSettings } from '../types';
import { playTickSound, playFanfareSound } from '../utils/audioSynthesizer';

interface ProjectorStageProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  settings: PickerSettings;
  onClose: () => void;
}

export const ProjectorStage: React.FC<ProjectorStageProps> = ({
  students,
  onUpdateStudents,
  settings,
  onClose,
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('點擊按鈕或按空白鍵抽籤');
  const [winner, setWinner] = useState<Student | null>(null);

  const availableCandidates = students.filter(s => settings.allowRepeat || !s.drawn);

  const startDraw = () => {
    if (isSpinning) return;
    if (availableCandidates.length === 0) {
      alert('所有學生已抽完！');
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    const winnerStudent = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];

    let ticks = 0;
    const maxTicks = 40;
    let delay = 40;

    const shuffle = () => {
      ticks++;
      const rand = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
      setDisplayName(rand.name);

      if (settings.soundEnabled && ticks % 2 === 0) {
        playTickSound(0.8 + (ticks / maxTicks) * 0.7);
      }

      if (ticks < maxTicks) {
        if (ticks > maxTicks - 10) delay += 20;
        setTimeout(shuffle, delay);
      } else {
        setDisplayName(winnerStudent.name);
        setWinner(winnerStudent);
        setIsSpinning(false);

        if (settings.soundEnabled) {
          playFanfareSound();
        }

        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        } catch {
          // ignore
        }

        if (!settings.allowRepeat) {
          onUpdateStudents(students.map(s => s.id === winnerStudent.id ? { ...s, drawn: true } : s));
        }
      }
    };

    shuffle();
  };

  // Spacebar key shortcut for projector mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        startDraw();
      } else if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, availableCandidates]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col justify-between p-8 select-none overflow-hidden">
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-black tracking-tight">班級抽籤大螢幕</h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-stone-400">
            剩餘未抽：<strong className="text-amber-400 font-bold">{availableCandidates.length}</strong> 人
          </span>
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Minimize className="w-4 h-4 mr-2" />
            退出全螢幕 (ESC)
          </button>
        </div>
      </div>

      {/* Main Big Name Display */}
      <div className="my-auto text-center space-y-12">
        <div className="relative inline-block w-full max-w-4xl bg-stone-900 border-4 border-amber-500 rounded-3xl p-16 shadow-2xl">
          <div
            className={`text-7xl sm:text-9xl font-black tracking-wider transition-all ${
              isSpinning ? 'text-amber-300 scale-105 blur-[0.5px]' : winner ? 'text-amber-400 scale-110' : 'text-stone-300'
            }`}
          >
            {displayName}
          </div>

          {winner && winner.seatNumber && (
            <div className="mt-6 inline-block px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-lg border border-amber-500/40">
              座號 #{winner.seatNumber}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={startDraw}
            disabled={isSpinning || availableCandidates.length === 0}
            className="py-6 px-16 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-black text-3xl rounded-3xl shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-4 mx-auto"
          >
            <Play className="w-8 h-8 fill-current" />
            <span>{isSpinning ? '抽籤中...' : '開始抽籤 (按 Space)'}</span>
          </button>
        </div>
      </div>

      {/* Bottom info */}
      <div className="text-center text-xs text-stone-500 border-t border-stone-900 pt-4">
        提示：按鍵盤 <kbd className="px-2 py-1 bg-stone-800 rounded-md text-stone-300 font-mono">Space 空白鍵</kbd> 可快速觸發抽籤
      </div>

    </div>
  );
};
