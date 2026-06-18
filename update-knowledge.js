const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('artifact-knowledge-已核对版.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, {header:1}).slice(1);

const byId = {};
data.forEach(row => {
  const [id, , , content, type, credibility, source] = row;
  if (!id || !content) return;
  if (!byId[id]) byId[id] = [];
  byId[id].push({
    content: String(content),
    type: String(type || 'history'),
    credibility: Number(credibility) || 3,
    source: String(source || '')
  });
});

const files = [
  'prototype/src/data/artifacts/neolithic.ts',
  'prototype/src/data/artifacts/shang-zhou.ts',
  'prototype/src/data/artifacts/qin-han.ts',
  'prototype/src/data/artifacts/wei-tang.ts',
  'prototype/src/data/artifacts/song-yuan.ts',
  'prototype/src/data/artifacts/ming-qing.ts',
];

let totalUpdated = 0;
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = 0;

  Object.entries(byId).forEach(([id, items]) => {
    const escapedId = id.replace(/[-]/g, '[-]');
    const idPattern = new RegExp(
      '(id:\\s*["\']' + escapedId + '["\'][\\s\\S]*?knowledge:\\s*\\[)[\\s\\S]*?(\\s*\\],)',
      'g'
    );
    const newItems = items.map(item =>
      '    { content: ' + JSON.stringify(item.content) +
      ', type: ' + JSON.stringify(item.type) + ' as const' +
      ', credibility: ' + item.credibility + ' as const' +
      ', source: ' + JSON.stringify(item.source) + ' }'
    ).join(',\n');

    const newContent = content.replace(idPattern, (match, before, after) => {
      updated++;
      return before + '\n' + newItems + '\n  ]' + after.replace(/^\s*\],/, ',');
    });
    if (newContent !== content) content = newContent;
  });

  if (updated > 0) {
    fs.writeFileSync(filePath, content);
    console.log(filePath + ': ' + updated + ' updated');
    totalUpdated += updated;
  }
});
console.log('Total:', totalUpdated);
