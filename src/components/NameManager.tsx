import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileText,
  UserPlus,
  Trash2,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Download,
  Users,
  Check,
  HelpCircle,
  Layers
} from 'lucide-react';
import { Student } from '../types';
import { parseRawTextToStudents, parseCSVFileContent, SAMPLE_CLASSES } from '../utils/csvParser';

interface NameManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onResetDrawnStatus: () => void;
  onClearHistory: () => void;
}

export const NameManager: React.FC<NameManagerProps> = ({
  students,
  onUpdateStudents,
  onResetDrawnStatus,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'preset'>('paste');
  const [rawText, setRawText] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Duplicate name analysis
  const nameCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const trimmed = s.name.trim();
      counts[trimmed] = (counts[trimmed] || 0) + 1;
    });
    return counts;
  }, [students]);

  const duplicateNamesList = useMemo(() => {
    return Object.keys(nameCounts).filter(name => nameCounts[name] > 1);
  }, [nameCounts]);

  const totalDuplicateEntries = useMemo(() => {
    return students.filter(s => nameCounts[s.name.trim()] > 1).length;
  }, [students, nameCounts]);

  // Handle Pasted Text Parse
  const handleParseText = () => {
    const parsed = parseRawTextToStudents(rawText);
    if (parsed.length === 0) {
      showToast('請輸入有效的姓名內容！');
      return;
    }
    onUpdateStudents(parsed);
    showToast(`成功匯入 ${parsed.length} 位學生名單！`);
  };

  // Append Pasted Text to existing list
  const handleAppendText = () => {
    const parsed = parseRawTextToStudents(rawText);
    if (parsed.length === 0) return;
    const combined = [...students, ...parsed];
    onUpdateStudents(combined);
    showToast(`新增了 ${parsed.length} 位學生，目前共 ${combined.length} 人！`);
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCSVFileContent(content);
        if (parsed.length > 0) {
          onUpdateStudents(parsed);
          showToast(`成功從 CSV 檔案載入 ${parsed.length} 位學生！`);
        } else {
          showToast('無法讀取 CSV 內容，請檢查檔案格式！');
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handle Preset Load
  const handleLoadPreset = (names: string[], title?: string) => {
    const parsed = parseRawTextToStudents(names.join('\n'));
    onUpdateStudents(parsed);
    showToast(`已成功載入模擬名單：${title || '預設班級'} (共 ${parsed.length} 人)`);
  };

  // Add single student manually
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const newStd: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newStudentName.trim(),
      seatNumber: students.length + 1,
      drawn: false,
    };
    onUpdateStudents([...students, newStd]);
    setNewStudentName('');
    showToast(`已新增學生：${newStd.name}`);
  };

  // Delete single student
  const handleDeleteStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    onUpdateStudents(updated);
  };

  // Remove duplicates completely (one click)
  const handleRemoveDuplicates = () => {
    const uniqueMap = new Map<string, Student>();
    students.forEach(s => {
      const trimmed = s.name.trim();
      if (!uniqueMap.has(trimmed)) {
        uniqueMap.set(trimmed, s);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());
    const removedCount = students.length - uniqueList.length;
    onUpdateStudents(uniqueList);
    showToast(`已一次性移除 ${removedCount} 個重複姓名項目！目前保留 ${uniqueList.length} 位不重複學生`);
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('確定要清空所有學生名單嗎？')) {
      onUpdateStudents([]);
      onClearHistory();
      showToast('名單已完全清空');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csvRows = ['座號,姓名,性別'];
    students.forEach(s => {
      csvRows.push(`${s.seatNumber || ''},"${s.name}",${s.gender || ''}`);
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = `學生名單_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('學生名單已下載為 CSV 檔案');
  };

  // Copy to clipboard
  const handleCopyText = () => {
    if (students.length === 0) return;
    const names = students.map((s, idx) => `${s.seatNumber || idx + 1}. ${s.name}`).join('\n');
    navigator.clipboard.writeText(names);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered list by search
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.seatNumber && s.seatNumber.toString().includes(searchQuery))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in border border-stone-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner: Mock/Simulation List Launcher for Teachers */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 md:mt-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                💡 快速體驗：一鍵載入「模擬名單」
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-950 font-bold rounded-full">
                新手教師教學指南
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              還沒有學生名單嗎？可直接載入以下模擬名單體驗「隨機抽籤」、「音效動畫」與「自動分組」功能，或測試「重複姓名檢測標記與一鍵刪除」。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          {SAMPLE_CLASSES.map((sample) => (
            <button
              key={sample.id}
              id={`load-sample-${sample.id}`}
              onClick={() => handleLoadPreset(sample.names, sample.title)}
              className="flex-1 md:flex-initial px-3 py-2 bg-white hover:bg-amber-100/70 border border-amber-300/80 text-amber-900 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>{sample.title.split(' ')[0]} {sample.title.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Source & Management Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Sources (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              設定學生名單來源
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              可貼上文字名單、上傳 CSV 試算表，或點擊快速試用範例名單
            </p>
          </div>

          {/* Sub Tabs */}
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200/80">
            <button
              id="source-paste-tab"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'paste' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              貼上文字/名單
            </button>
            <button
              id="source-upload-tab"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'upload' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              上傳 CSV 檔案
            </button>
            <button
              id="source-preset-tab"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preset' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              模擬與測試範例
            </button>
          </div>

          {/* Tab 1: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                id="raw-names-textarea"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`請貼上學生姓名名單（每行一個，或以逗號/空格隔開）&#10;&#10;範例：&#10;1. 陳志明&#10;2. 林雅婷&#10;3. 黃家豪`}
                className="w-full text-sm p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50 font-mono resize-none"
              />
              <div className="flex gap-2">
                <button
                  id="parse-text-btn"
                  onClick={handleParseText}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
                >
                  取代目前名單
                </button>
                <button
                  id="append-text-btn"
                  onClick={handleAppendText}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  附加至現有名單
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Upload CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 text-center bg-stone-50/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv, .txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-stone-800">
                    點擊選擇 CSV 檔案，或拖曳至此處
                  </div>
                  <p className="text-xs text-stone-500">
                    支援包含「姓名」、「座號」、「性別」等欄位之 CSV UTF-8 文字檔
                  </p>
                </label>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> CSV 檔案說明：
                </div>
                <p>若從 Excel 匯出，請選擇 CSV (UTF-8) 格式。匯入後若發現重複姓名，系統會自動在預覽區標記並提供一鍵去重複功能。</p>
              </div>
            </div>
          )}

          {/* Tab 3: Presets & Simulation */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">點擊下方按鈕可快速載入不同模擬情境的班級資料：</p>
              <div className="space-y-2.5">
                {SAMPLE_CLASSES.map((preset, idx) => (
                  <button
                    key={preset.id || idx}
                    id={`preset-btn-${idx}`}
                    onClick={() => handleLoadPreset(preset.names, preset.title)}
                    className="w-full text-left p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all flex items-start justify-between group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-stone-800 group-hover:text-amber-900 flex items-center gap-1.5">
                        {preset.title}
                      </div>
                      <p className="text-xs text-stone-500">
                        {preset.description}
                      </p>
                      <div className="text-[11px] text-stone-400 font-mono line-clamp-1">
                        範例：{preset.names.slice(0, 5).join('、')}...
                      </div>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single Add Form */}
          <div className="pt-3 border-t border-stone-200">
            <form onSubmit={handleAddSingleStudent} className="flex gap-2">
              <input
                type="text"
                id="add-student-input"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="手動新增一名學生姓名..."
                className="flex-1 text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="submit"
                id="add-student-btn"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>新增</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Current Student List & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col space-y-4">
          
          {/* Top Bar: Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                目前班級名單預覽
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-full">
                  共 {students.length} 人
                </span>
                {duplicateNamesList.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-full flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {duplicateNamesList.length} 組重複
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                此名單將同步用於「隨機抽籤」與「自動分組」
              </p>
            </div>

            {/* List Operations */}
            <div className="flex flex-wrap items-center gap-2">
              {students.length > 0 && (
                <>
                  <button
                    id="reset-drawn-status-btn"
                    onClick={onResetDrawnStatus}
                    className="text-xs px-2.5 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                    title="重置所有已抽出的紀錄"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重置已抽狀態</span>
                  </button>

                  <button
                    id="remove-duplicates-btn"
                    onClick={handleRemoveDuplicates}
                    className={`text-xs px-2.5 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      duplicateNamesList.length > 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title="清除所有重複出現的學生姓名"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>去重複 {duplicateNamesList.length > 0 ? `(${totalDuplicateEntries - duplicateNamesList.length}項)` : ''}</span>
                  </button>

                  <button
                    id="copy-list-btn"
                    onClick={handleCopyText}
                    className="text-xs px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已複製' : '複製名單'}</span>
                  </button>

                  <button
                    id="export-csv-btn"
                    onClick={handleExportCSV}
                    className="text-xs px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>匯出 CSV</span>
                  </button>

                  <button
                    id="clear-all-students-btn"
                    onClick={handleClearAll}
                    className="text-xs px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DUPLICATE WARNING & ONE-CLICK REMOVE BANNER */}
          {duplicateNamesList.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-200/80 text-rose-900 rounded-xl font-bold shrink-0 mt-0.5 sm:mt-0">
                  <AlertTriangle className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-950 flex flex-wrap items-center gap-2">
                    <span>偵測到名單包含 {duplicateNamesList.length} 組重複學生姓名</span>
                    <span className="text-[10px] px-2 py-0.5 bg-rose-200 text-rose-900 font-bold rounded-full">
                      共 {totalDuplicateEntries} 個項目重複
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1">
                    重複姓名：<span className="font-bold underline decoration-rose-300">{duplicateNamesList.join('、')}</span>
                  </p>
                </div>
              </div>

              <button
                id="one-click-remove-duplicates-btn"
                onClick={handleRemoveDuplicates}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>一鍵移除重複姓名</span>
              </button>
            </div>
          )}

          {/* Search bar */}
          {students.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="search-students-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋學生姓名或座號..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-stone-50"
              />
            </div>
          )}

          {/* Student Grid / List */}
          {students.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
              <div className="w-12 h-12 rounded-full bg-stone-200/60 text-stone-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-stone-700">目前尚無學生名單</div>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                請利用左側功能貼上名單、上傳 CSV 檔，或點擊頂部「載入模擬名單」快速體驗。
              </p>
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredStudents.map((std, idx) => {
                  const isDuplicate = nameCounts[std.name.trim()] > 1;
                  return (
                    <div
                      key={std.id}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group relative ${
                        isDuplicate
                          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-300/60'
                          : std.drawn
                          ? 'bg-stone-100 border-stone-200 opacity-60'
                          : 'bg-stone-50/80 border-stone-200 hover:border-amber-300 hover:bg-amber-50/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          isDuplicate ? 'bg-rose-200 text-rose-900' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {std.seatNumber || idx + 1}
                        </span>
                        <span className={`text-sm font-semibold truncate ${
                          isDuplicate ? 'text-rose-950 font-bold' : std.drawn ? 'line-through text-stone-500' : 'text-stone-800'
                        }`}>
                          {std.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {isDuplicate && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold flex items-center gap-0.5" title="此姓名在名單中重複出現">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            重複
                          </span>
                        )}

                        {!isDuplicate && std.drawn && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-600 font-medium">
                            已抽過
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteStudent(std.id)}
                          title="刪除此學生"
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 p-1 rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
