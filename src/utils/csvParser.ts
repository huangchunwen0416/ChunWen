import { Student } from '../types';

/**
 * Parses raw text input into Student objects.
 * Accepts newlines, commas, tabs, spaces, or numbered list format like:
 * 1. 王小明
 * 2. 李小華
 * 01, 張大同, M
 */
export function parseRawTextToStudents(rawText: string): Student[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const students: Student[] = [];

  lines.forEach((line, index) => {
    // Check if line contains comma or tab delimiter
    if (line.includes(',') || line.includes('\t') || line.includes(';')) {
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length > 0) {
        let name = '';
        let seat: string | number | undefined = undefined;
        let gender: 'M' | 'F' | 'Other' | undefined = undefined;

        // Try to identify seat number vs name vs gender
        parts.forEach(part => {
          if (!part) return;
          if (!name && !/^\d+$/.test(part) && !['男', '女', 'M', 'F', 'm', 'f'].includes(part)) {
            name = part;
          } else if (/^\d+$/.test(part) && seat === undefined) {
            seat = parseInt(part, 10);
          } else if (['男', 'M', 'm', 'Male', '男生'].includes(part)) {
            gender = 'M';
          } else if (['女', 'F', 'f', 'Female', '女生'].includes(part)) {
            gender = 'F';
          } else if (!name) {
            name = part;
          }
        });

        if (name) {
          // Clean leading numbers like "01." or "1)" from name if present
          name = name.replace(/^(\d+[\s.、)\-]+)/, '').trim();
          students.push({
            id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name,
            seatNumber: seat || index + 1,
            gender,
            drawn: false,
          });
          return;
        }
      }
    }

    // Handle space-separated items in single line or numbered lines
    // Example: "1. 王小明" or "1 王小明" or multi names in one line: "張三 李四 王五"
    const words = line.split(/[\s,]+/);
    words.forEach(word => {
      let cleaned = word.trim();
      // Remove index numbers like "1.", "02)", "3、"
      cleaned = cleaned.replace(/^(\d+[\s.、)\-]+)/, '').trim();
      if (cleaned) {
        students.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: cleaned,
          seatNumber: students.length + 1,
          drawn: false,
        });
      }
    });
  });

  return students;
}

/**
 * Parses uploaded CSV file content
 */
export function parseCSVFileContent(content: string): Student[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Check header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('姓名') || firstLine.includes('座號') || firstLine.includes('student');
  const startIndex = hasHeader ? 1 : 0;

  const result: Student[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(col => col.replace(/^["']|["']$/g, '').trim());

    if (columns.length === 0 || !columns.some(Boolean)) continue;

    let seat: number | undefined;
    let name = '';
    let gender: 'M' | 'F' | 'Other' | undefined;

    columns.forEach(col => {
      if (!col) return;
      if (/^\d+$/.test(col) && seat === undefined) {
        seat = parseInt(col, 10);
      } else if (['男', 'M', 'm', '男生'].includes(col)) {
        gender = 'M';
      } else if (['女', 'F', 'f', '女生'].includes(col)) {
        gender = 'F';
      } else if (!name) {
        name = col;
      }
    });

    if (name) {
      result.push({
        id: `std-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        seatNumber: seat ?? (result.length + 1),
        gender,
        drawn: false,
      });
    }
  }

  return result;
}

/**
 * Sample Class Datasets for instant demonstration & teacher testing
 */
export const SAMPLE_CLASSES = [
  {
    id: 'sample-standard',
    title: '🎓 三年二班標準名單 (24 人)',
    description: '適合快速體驗隨機抽籤與分組功能的標準班級資料',
    names: [
      '陳志明', '林雅婷', '黃家豪', '張怡君', '李冠宇', '王美玲',
      '吳承翰', '蔡佩珊', '許家瑋', '鄭雅文', '謝宗翰', '郭婷婷',
      '洪宇軒', '曾心怡', '邱柏翰', '廖佳穎', '賴威廷', '周詩涵',
      '徐文傑', '葉品妤', '蘇俊宏', '莊靜宜', '江柏賢', '蕭育婷'
    ]
  },
  {
    id: 'sample-duplicates',
    title: '⚠️ 測試重複姓名名單 (包含 3 組重複姓名)',
    description: '特別加入「陳志明 x2」、「李冠宇 x2」、「郭婷婷 x2」供測試重複偵測與一鍵清除功能',
    names: [
      '陳志明', '林雅婷', '陳志明', '張怡君', '李冠宇', '王美玲',
      '李冠宇', '蔡佩珊', '許家瑋', '鄭雅文', '郭婷婷', '郭婷婷',
      '洪宇軒', '曾心怡', '邱柏翰', '廖佳穎', '賴威廷', '周詩涵'
    ]
  },
  {
    id: 'sample-camp',
    title: '🧪 創意科學營 (帶座號 12 人)',
    description: '小班制教學與分組討論範例名單',
    names: [
      '01. 林哲宇', '02. 張詠晴', '03. 許博文', '04. 鄭羽涵',
      '05. 游尚恩', '06. 魏若瑄', '07. 簡睿廷', '08. 潘宥安',
      '09. 彭彩妮', '10. 鐘皓天', '11. 范馨文', '12. 羅兆恩'
    ]
  }
];
