import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Shuffle,
  Users,
  Copy,
  Download,
  Printer,
  Sparkles,
  ArrowRightLeft,
  Check,
  Edit2,
  Lock,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { Student, StudentGroup, GroupingStrategy } from '../types';
import { playPopSound, playClickSound } from '../utils/audioSynthesizer';

interface AutoGrouperProps {
  students: Student[];
  soundEnabled: boolean;
}

const GROUP_COLORS = [
  'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-violet-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  'bg-indigo-500', 'bg-pink-500', 'bg-lime-600', 'bg-sky-500'
];

const GROUP_BORDER_COLORS = [
  'border-amber-300', 'border-emerald-300', 'border-blue-300', 'border-violet-300',
  'border-rose-300', 'border-cyan-300', 'border-orange-300', 'border-teal-300',
  'border-indigo-300', 'border-pink-300', 'border-lime-300', 'border-sky-300'
];

const GROUP_NAMES_CREATIVE = [
  '第一組', '第二組', '第三組', '第四組', '第五組', '第六組',
  '第七組', '第八組', '第九組', '第十組', '第十一組', '第十二組'
];

export const AutoGrouper: React.FC<AutoGrouperProps> = ({ students, soundEnabled }) => {
  const [strategy, setStrategy] = useState<GroupingStrategy>('perGroup');
  const [targetNumber, setTargetNumber] = useState<number>(4); // default 4 per group
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<boolean>(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');
  
  // Selected student for manual swap
  const [swapSource, setSwapSource] = useState<{ groupId: string; studentId: string } | null>(null);

  // Perform automatic grouping logic
  const performGrouping = () => {
    if (students.length === 0) return;

    if (soundEnabled) {
      playPopSound(700);
    }

    const shuffled = [...students].sort(() => Math.random() - 0.5);
    let numGroups = 1;

    if (strategy === 'perGroup') {
      const perGroup = Math.max(1, targetNumber);
      numGroups = Math.max(1, Math.ceil(shuffled.length / perGroup));
    } else {
      numGroups = Math.max(1, Math.min(targetNumber, shuffled.length));
    }

    // Initialize group containers
    const newGroups: StudentGroup[] = Array.from({ length: numGroups }, (_, i) => ({
      id: `grp-${Date.now()}-${i}`,
      name: GROUP_NAMES_CREATIVE[i % GROUP_NAMES_CREATIVE.length] || `第 ${i + 1} 組`,
      color: GROUP_COLORS[i % GROUP_COLORS.length],
      students: [],
    }));

    // Distribute students round-robin (snake format for balanced size)
    shuffled.forEach((student, index) => {
      const groupIdx = index % numGroups;
      newGroups[groupIdx].students.push(student);
    });

    setGroups(newGroups);
    setSwapSource(null);

    try {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch {
      // Fallback
    }
  };

  // Initial group generation when students change or first view
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      performGrouping();
    }
  }, [students]);

  // Handle manual swap between students
  const handleSelectStudentForSwap = (groupId: string, studentId: string) => {
    if (!swapSource) {
      setSwapSource({ groupId, studentId });
      if (soundEnabled) playClickSound();
    } else if (swapSource.groupId === groupId && swapSource.studentId === studentId) {
      // Deselect
      setSwapSource(null);
    } else {
      // Swap target
      const updatedGroups = groups.map(g => {
        let newStudents = [...g.students];

        if (g.id === swapSource.groupId && g.id === groupId) {
          // Internal swap within same group
          const idx1 = newStudents.findIndex(s => s.id === swapSource.studentId);
          const idx2 = newStudents.findIndex(s => s.id === studentId);
          if (idx1 !== -1 && idx2 !== -1) {
            const temp = newStudents[idx1];
            newStudents[idx1] = newStudents[idx2];
            newStudents[idx2] = temp;
          }
          return { ...g, students: newStudents };
        }

        if (g.id === swapSource.groupId) {
          // Source group: replace source student with target student
          const targetStudent = groups.find(tg => tg.id === groupId)?.students.find(s => s.id === studentId);
          if (targetStudent) {
            newStudents = newStudents.map(s => s.id === swapSource.studentId ? targetStudent : s);
          }
        } else if (g.id === groupId) {
          // Target group: replace target student with source student
          const sourceStudent = groups.find(sg => sg.id === swapSource.groupId)?.students.find(s => s.id === swapSource.studentId);
          if (sourceStudent) {
            newStudents = newStudents.map(s => s.id === studentId ? sourceStudent : s);
          }
        }
        return { ...g, students: newStudents };
      });

      setGroups(updatedGroups);
      setSwapSource(null);
      if (soundEnabled) playPopSound(900);
    }
  };

  // Save group title edit
  const handleSaveGroupName = (groupId: string) => {
    if (!editingGroupName.trim()) return;
    setGroups(groups.map(g => g.id === groupId ? { ...g, name: editingGroupName.trim() } : g));
    setEditingGroupId(null);
  };

  // Copy text formatted results
  const handleCopyResults = () => {
    if (groups.length === 0) return;
    const textLines: string[] = ['【班級分組結果】', ''];
    groups.forEach((g) => {
      const names = g.students.map((s, idx) => `${s.seatNumber ? `${s.seatNumber}號 ` : ''}${s.name}`).join('、');
      textLines.push(`📌 ${g.name} (${g.students.length}人)：`);
      textLines.push(`   ${names}`);
      textLines.push('');
    });
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export CSV results
  const handleExportCSV = () => {
    if (groups.length === 0) return;
    const csvRows = ['組別,座號,學生姓名,性別'];
    groups.forEach(g => {
      g.students.forEach(s => {
        csvRows.push(`"${g.name}",${s.seatNumber || ''},"${s.name}",${s.gender || ''}`);
      });
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = `班級分組結果_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3000);
  };

  // Print friendly mode
  const handlePrint = () => {
    window.print();
  };

  if (students.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">尚無學生名單，無法進行自動分組</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          請先前往「名單管理」分頁貼上名單或上傳 CSV 檔案，再使用自動分組功能。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast notification for CSV download */}
      {downloadToast && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in border border-stone-800">
          <Download className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce" />
          <span>已成功將分組結果下載為 CSV 試算表檔案！</span>
        </div>
      )}

      {/* Control Configuration Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4 print:hidden">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-amber-500" />
              自動分組設定
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              設定每組人數或總組數，一鍵視覺化自動分組，支援點擊交換學生
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Strategy switch */}
            <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                id="strategy-per-group-btn"
                onClick={() => setStrategy('perGroup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  strategy === 'perGroup'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                固定每組人數
              </button>
              <button
                id="strategy-total-groups-btn"
                onClick={() => setStrategy('totalGroups')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  strategy === 'totalGroups'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                固定分成幾組
              </button>
            </div>

            {/* Target Number input */}
            <div className="flex items-center space-x-2 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-700 font-bold">
                {strategy === 'perGroup' ? '每組幾人：' : '一共分成：'}
              </span>
              <input
                type="number"
                id="target-number-input"
                min={1}
                max={students.length}
                value={targetNumber}
                onChange={(e) => setTargetNumber(parseInt(e.target.value, 10) || 1)}
                className="w-14 text-center py-1 px-1 bg-white border border-stone-300 rounded-md font-bold text-stone-900"
              />
              <span className="text-stone-700 font-bold">
                {strategy === 'perGroup' ? '人' : '組'}
              </span>
            </div>

            {/* Perform Grouping Button */}
            <button
              id="run-grouping-btn"
              onClick={performGrouping}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新隨機分組</span>
            </button>
          </div>
        </div>

        {/* Action bar for exported formats */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-stone-500">
            目前學生總數：<strong className="text-stone-900">{students.length}</strong> 人 · 
            預計分為 <strong className="text-amber-700">{groups.length}</strong> 組
            {swapSource && (
              <span className="ml-2 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ⚡ 請點擊第二位學生進行組別對調
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="copy-groups-btn"
              onClick={handleCopyResults}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製分組結果' : '複製結果文字'}</span>
            </button>

            <button
              id="export-groups-csv-btn"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="匯出並下載可於 Excel 開啟之 CSV 試算表"
            >
              <Download className="w-4 h-4" />
              <span>下載分組結果 CSV</span>
            </button>

            <button
              id="print-groups-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>友善列印/廣播</span>
            </button>
          </div>
        </div>

      </div>

      {/* Visualized Group Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {groups.map((group, groupIdx) => {
          const borderColorClass = GROUP_BORDER_COLORS[groupIdx % GROUP_BORDER_COLORS.length];
          return (
            <div
              key={group.id}
              className={`bg-white rounded-2xl border-2 ${borderColorClass} shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col`}
            >
              {/* Card Header with Vibrant Color */}
              <div className={`${group.color} text-white px-4 py-3 flex items-center justify-between`}>
                {editingGroupId === group.id ? (
                  <div className="flex items-center space-x-1 flex-1">
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      className="text-xs px-2 py-1 text-stone-900 rounded-md font-bold w-full"
                    />
                    <button
                      onClick={() => handleSaveGroupName(group.id)}
                      className="px-2 py-1 bg-stone-900 text-white text-xs rounded-md font-bold"
                    >
                      儲存
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm tracking-wide">{group.name}</span>
                    <button
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditingGroupName(group.name);
                      }}
                      className="opacity-70 hover:opacity-100 text-white p-0.5 rounded-md"
                      title="編輯組名"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 font-bold">
                  {group.students.length} 人
                </span>
              </div>

              {/* Card Body: Student Tags */}
              <div className="p-4 flex-1 space-y-2 bg-stone-50/40">
                <div className="grid grid-cols-1 gap-1.5">
                  {group.students.map((student, stdIdx) => {
                    const isSelectedForSwap = swapSource?.studentId === student.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudentForSwap(group.id, student.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isSelectedForSwap
                            ? 'bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-400 scale-[1.02]'
                            : 'bg-white border-stone-200 text-stone-800 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                        title="點擊與其他學生對調組別"
                      >
                        <div className="flex items-center space-x-2">
                          {stdIdx === 0 ? (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                              組長
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center">
                              {stdIdx + 1}
                            </span>
                          )}
                          <span className="font-bold">{student.name}</span>
                        </div>

                        {student.seatNumber && (
                          <span className="text-stone-400 text-[10px]">
                            #{student.seatNumber}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer: Quick swap indicator */}
              <div className="px-4 py-2 bg-stone-100 border-t border-stone-200/80 text-[10px] text-stone-500 flex items-center justify-between">
                <span>組別 #{groupIdx + 1}</span>
                <span className="flex items-center gap-1 text-stone-600">
                  <ArrowRightLeft className="w-3 h-3" /> 點擊學生微調
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
