import React from 'react';
import { Sparkles, X, RotateCcw, Award } from 'lucide-react';
import { Student } from '../types';

interface WinnerModalProps {
  winners: Student[];
  isOpen: boolean;
  onClose: () => void;
  onDrawNext: () => void;
  allowRepeat: boolean;
  remainingCount: number;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winners,
  isOpen,
  onClose,
  onDrawNext,
  allowRepeat,
  remainingCount,
}) => {
  if (!isOpen || winners.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative overflow-hidden text-center space-y-6 animate-scale-up">
        
        {/* Decorative Top Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-amber-400 to-amber-500 rounded-b-full opacity-20 blur-xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <Award className="w-9 h-9" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600 flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" /> 恭喜抽中 <Sparkles className="w-4 h-4" />
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            {winners.length === 1 ? '幸運學生誕生！' : `一次抽中了 ${winners.length} 位學生！`}
          </p>
        </div>

        {/* Winner Display Cards */}
        <div className="space-y-3 py-2">
          {winners.map((student) => (
            <div
              key={student.id}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white rounded-2xl p-6 shadow-lg transform transition-all hover:scale-[1.02]"
            >
              {student.seatNumber && (
                <div className="inline-block px-3 py-1 rounded-full bg-black/20 text-white text-xs font-semibold mb-2">
                  座號 {student.seatNumber}
                </div>
              )}
              <div className="text-4xl sm:text-5xl font-black tracking-wider drop-shadow-sm">
                {student.name}
              </div>
            </div>
          ))}
        </div>

        {/* Non-repeat info badge */}
        {!allowRepeat && (
          <div className="text-xs text-stone-500 bg-stone-100 rounded-xl py-2 px-3 inline-block">
            模式：不重複抽取（剩餘未抽人數：<span className="font-bold text-amber-700">{remainingCount}</span> 人）
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition-colors text-sm"
          >
            關閉
          </button>
          
          <button
            onClick={() => {
              onClose();
              onDrawNext();
            }}
            disabled={!allowRepeat && remainingCount === 0}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold transition-all shadow-md text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再抽下一個</span>
          </button>
        </div>

      </div>
    </div>
  );
};
