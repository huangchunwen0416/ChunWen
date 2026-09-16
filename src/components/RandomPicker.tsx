import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings2,
  History,
  Sparkles,
  Users,
  CheckCircle2,
  Disc,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Student, PickerSettings, DrawHistoryItem } from '../types';
import { WheelCanvas } from './WheelCanvas';
import { WinnerModal } from './WinnerModal';
import { playTickSound, playFanfareSound, playClickSound } from '../utils/audioSynthesizer';

interface RandomPickerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  settings: PickerSettings;
  onUpdateSettings: (settings: Partial<PickerSettings>) => void;
  drawHistory: DrawHistoryItem[];
  onAddHistory: (item: DrawHistoryItem) => void;
  onClearHistory: () => void;
  onOpenProjector: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onUpdateStudents,
  settings,
  onUpdateSettings,
  drawHistory,
  onAddHistory,
  onClearHistory,
  onOpenProjector,
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayCandidateName, setDisplayCandidateName] = useState<string>('？');
  const [wheelTargetIndex, setWheelTargetIndex] = useState<number | null>(null);
  const [currentWinners, setCurrentWinners] = useState<Student[]>([]);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const spinIntervalRef = useRef<number | null>(null);

  // Filter available candidates based on allowRepeat setting
  const availableCandidates = students.filter(s => settings.allowRepeat || !s.drawn);
  const drawnStudents = students.filter(s => s.drawn);

  // Trigger sound effect helper
  const triggerTickSound = () => {
    if (settings.soundEnabled) {
      playTickSound(1.2);
    }
  };

  // Trigger celebration effect
  const triggerCelebration = (winners: Student[]) => {
    if (settings.soundEnabled) {
      playFanfareSound();
    }

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback if confetti fails
    }

    // Add to history
    winners.forEach(winner => {
      onAddHistory({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        student: winner,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    });

    // Mark drawn if non-repeatable
    if (!settings.allowRepeat) {
      const winnerIds = new Set(winners.map(w => w.id));
      const updated = students.map(s => winnerIds.has(s.id) ? { ...s, drawn: true } : s);
      onUpdateStudents(updated);
    }

    setCurrentWinners(winners);
    setIsWinnerModalOpen(true);
  };

  // Start Slot Machine / Shuffle Animation
  const handleStartDraw = () => {
    if (isSpinning) return;
    if (availableCandidates.length === 0) {
      alert(settings.allowRepeat ? '請先新增學生名單！' : '所有人均已抽完！請點擊「重置已抽狀態」再繼續。');
      return;
    }

    if (settings.soundEnabled) {
      playClickSound();
    }

    setIsSpinning(true);
    setCurrentWinners([]);

    // Determine target winners
    const countToPick = Math.min(settings.pickCount, availableCandidates.length);
    const shuffledPool = [...availableCandidates].sort(() => Math.random() - 0.5);
    const selectedWinners = shuffledPool.slice(0, countToPick);

    if (settings.pickerMode === 'wheel') {
      // Wheel mode handles its own animation
      const targetIdx = availableCandidates.findIndex(s => s.id === selectedWinners[0].id);
      setWheelTargetIndex(targetIdx >= 0 ? targetIdx : 0);
    } else {
      // Slot machine / card shuffle mode
      let tickCount = 0;
      const totalTicks = settings.animationSpeed === 'fast' ? 25 : settings.animationSpeed === 'slow' ? 50 : 35;
      let delay = 50;

      const runShuffle = () => {
        tickCount++;
        const randomCand = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
        setDisplayCandidateName(randomCand.name);

        if (settings.soundEnabled && tickCount % 2 === 0) {
          playTickSound(0.8 + (tickCount / totalTicks) * 0.6);
        }

        if (tickCount < totalTicks) {
          // Slow down towards the end
          if (tickCount > totalTicks - 10) {
            delay += 25;
          }
          spinIntervalRef.current = window.setTimeout(runShuffle, delay);
        } else {
          // Finish shuffle
          setDisplayCandidateName(selectedWinners[0].name);
          setIsSpinning(false);
          triggerCelebration(selectedWinners);
        }
      };

      runShuffle();
    }
  };

  // Handle wheel animation complete callback
  const handleWheelComplete = () => {
    setIsSpinning(false);
    if (wheelTargetIndex !== null && availableCandidates[wheelTargetIndex]) {
      const winner = availableCandidates[wheelTargetIndex];
      triggerCelebration([winner]);
    }
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

  // Reset all drawn flags
  const handleResetDrawn = () => {
    const resetList = students.map(s => ({ ...s, drawn: false }));
    onUpdateStudents(resetList);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & Control Settings Panel */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              隨機抽籤設定
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              可切換抽籤動畫視覺風格、設定是否重複抽取及抽籤人數
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Repeat Toggle */}
            <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                id="toggle-repeat-no"
                onClick={() => onUpdateSettings({ allowRepeat: false })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !settings.allowRepeat
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                不重複抽取
              </button>
              <button
                id="toggle-repeat-yes"
                onClick={() => onUpdateSettings({ allowRepeat: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  settings.allowRepeat
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                可重複抽取
              </button>
            </div>

            {/* Pick Count Selector */}
            <div className="flex items-center space-x-1 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-600 font-medium mr-1">每次抽出：</span>
              {[1, 2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  id={`pick-count-${cnt}`}
                  onClick={() => onUpdateSettings({ pickCount: cnt })}
                  className={`w-6 h-6 rounded-md font-bold transition-all ${
                    settings.pickCount === cnt
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <span className="text-stone-600 ml-1">人</span>
            </div>
          </div>
        </div>

        {/* Visual Animation Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-stone-500">動畫風格：</span>
            <button
              id="mode-slot-btn"
              onClick={() => onUpdateSettings({ pickerMode: 'slot' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                settings.pickerMode === 'slot'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>老虎機滾動</span>
            </button>

            <button
              id="mode-wheel-btn"
              onClick={() => onUpdateSettings({ pickerMode: 'wheel' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                settings.pickerMode === 'wheel'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Disc className="w-3.5 h-3.5 text-emerald-500" />
              <span>幸運轉盤</span>
            </button>
          </div>

          {/* Draw Statistics & Actions */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-stone-600">
              候選人數：<strong className="text-stone-900">{availableCandidates.length}</strong> 人
            </span>
            {!settings.allowRepeat && (
              <span className="text-stone-600">
                已抽出：<strong className="text-amber-700">{drawnStudents.length}</strong> 人
              </span>
            )}
            
            {drawnStudents.length > 0 && !settings.allowRepeat && (
              <button
                id="reset-drawn-picker-btn"
                onClick={handleResetDrawn}
                className="text-amber-700 hover:text-amber-900 underline font-semibold"
              >
                重置名單
              </button>
            )}

            <button
              id="show-history-btn"
              onClick={() => setShowHistoryModal(true)}
              className="text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200"
            >
              <History className="w-3.5 h-3.5" />
              <span>抽籤紀錄 ({drawHistory.length})</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Drawing Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Main Stage (8 cols) */}
        <div className="lg:col-span-8 bg-stone-900 rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[440px]">
          
          {/* Subtle Stage Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-400/10 pointer-events-none" />

          {/* MODE 1: Slot Machine / Card Shuffle Display */}
          {settings.pickerMode === 'slot' && (
            <div className="my-auto space-y-8 w-full max-w-md">
              <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-spin" />
                {isSpinning ? '正在隨機抽籤中...' : '準備抽籤'}
              </div>

              {/* Slot Box Display */}
              <div className="relative bg-stone-950 border-4 border-amber-500/80 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-amber-500/30 rounded-full" />
                
                <div
                  className={`text-5xl sm:text-7xl font-black tracking-wider transition-all duration-75 ${
                    isSpinning ? 'scale-105 text-amber-300 blur-[0.3px]' : 'text-white'
                  }`}
                >
                  {displayCandidateName}
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-amber-500/30 rounded-full" />
              </div>

              {/* Draw Trigger Button */}
              <button
                id="start-draw-slot-btn"
                onClick={handleStartDraw}
                disabled={isSpinning || availableCandidates.length === 0}
                className="w-full py-5 px-8 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-black text-xl rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center space-x-3"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>{isSpinning ? '抽籤進行中...' : '開始隨機抽籤！'}</span>
              </button>
            </div>
          )}

          {/* MODE 2: Roulette Wheel Display */}
          {settings.pickerMode === 'wheel' && (
            <div className="my-auto space-y-6 w-full flex flex-col items-center">
              <WheelCanvas
                candidates={availableCandidates.map(c => c.name)}
                spinning={isSpinning}
                targetIndex={wheelTargetIndex}
                onSpinComplete={handleWheelComplete}
                onTickSound={triggerTickSound}
              />

              <button
                id="start-draw-wheel-btn"
                onClick={handleStartDraw}
                disabled={isSpinning || availableCandidates.length === 0}
                className="py-4 px-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-black text-lg rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isSpinning ? '轉盤旋轉中...' : '旋轉轉盤抽籤'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Right Side: Candidate Pool & Drawn Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Candidates List Box */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                待抽學生名單 ({availableCandidates.length})
              </h3>
              {!settings.allowRepeat && (
                <span className="text-[10px] text-stone-500">不重複模式</span>
              )}
            </div>

            {availableCandidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-stone-700">所有人均已抽過一次！</p>
                <button
                  id="reset-drawn-side-btn"
                  onClick={handleResetDrawn}
                  className="px-3 py-1.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 text-xs"
                >
                  重置已抽名單
                </button>
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-1.5">
                  {availableCandidates.map((std) => (
                    <span
                      key={std.id}
                      className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg text-xs font-semibold border border-stone-200"
                    >
                      {std.seatNumber ? `#${std.seatNumber} ${std.name}` : std.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawn History Quick Preview */}
          {drawnStudents.length > 0 && !settings.allowRepeat && (
            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>已抽出學生名單 ({drawnStudents.length})</span>
                <button
                  onClick={handleResetDrawn}
                  className="text-amber-700 hover:text-amber-900 text-[11px] underline"
                >
                  重置
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {drawnStudents.map(s => (
                  <span key={s.id} className="text-[11px] px-2 py-0.5 bg-white text-stone-500 line-through rounded-md border border-stone-200">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Winner Celebration Modal */}
      <WinnerModal
        winners={currentWinners}
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        onDrawNext={handleStartDraw}
        allowRepeat={settings.allowRepeat}
        remainingCount={availableCandidates.length}
      />

      {/* History Log Dialog Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                抽籤歷史紀錄
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {drawHistory.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-8">目前尚未有抽籤紀錄</p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {drawHistory.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                        {drawHistory.length - idx}
                      </span>
                      <span className="font-bold text-stone-900">{item.student.name}</span>
                      {item.student.seatNumber && (
                        <span className="text-stone-400">({item.student.seatNumber}號)</span>
                      )}
                    </div>
                    <span className="text-stone-400">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t flex justify-between">
              <button
                onClick={onClearHistory}
                className="text-xs text-red-600 hover:text-red-800 font-semibold"
              >
                清除歷史紀錄
              </button>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-stone-900 text-white text-xs font-bold rounded-xl"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
