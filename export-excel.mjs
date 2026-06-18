import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("./node_modules/xlsx");

// 动态加载 TS 数据（已编译到 .next，直接读取源文件并用 eval 解析）
// 改用直接 import 编译后的数据
const artifactFiles = [
  "./prototype/src/data/artifacts/neolithic.ts",
  "./prototype/src/data/artifacts/shang-zhou.ts",
  "./prototype/src/data/artifacts/qin-han.ts",
  "./prototype/src/data/artifacts/wei-tang.ts",
  "./prototype/src/data/artifacts/song-yuan.ts",
  "./prototype/src/data/artifacts/ming-qing.ts",
];

function parseArtifactsFromTS(content) {
  // 提取数组内容，转为可解析的 JSON
  const artifacts = [];
  // 用正则匹配每个对象块
  const objRegex = /\{[\s\S]*?\n  \}/g;

  // 简单方案：用 Function 执行 TS（去掉类型注解）
  const cleaned = content
    .replace(/import type.*?;\n/g, "")
    .replace(/import.*?;\n/g, "")
    .replace(/export const \w+: \w+\[\] = /g, "return ")
    .replace(/: "history" \| "craft" \| "legend" \| "mystery"/g, "")
    .replace(/: 1 \| 2 \| 3 \| 4 \| 5/g, "")
    .replace(/: Artifact\[\]/g, "");

  try {
    const fn = new Function(cleaned);
    return fn();
  } catch (e) {
    console.error("Parse error:", e.message);
    return [];
  }
}

const allArtifacts = [];
for (const file of artifactFiles) {
  const content = readFileSync(file, "utf-8");
  const artifacts = parseArtifactsFromTS(content);
  if (Array.isArray(artifacts)) allArtifacts.push(...artifacts);
}

console.log(`共加载 ${allArtifacts.length} 件文物`);

// Sheet 1: 知识要点
const knowledgeRows = [];
for (const a of allArtifacts) {
  for (const k of (a.knowledge || [])) {
    knowledgeRows.push({
      文物ID: a.id,
      文物名称: a.name,
      朝代: a.dynasty,
      知识内容: k.content,
      类型: k.type,
      可信度: k.credibility,
      来源: k.source,
    });
  }
}

// Sheet 2: 知识图谱（实体-关系）
const graphRows = [];
for (const a of allArtifacts) {
  const entity = a.name;
  const addRel = (rel, target) => graphRows.push({ 主体: entity, 关系: rel, 客体: target, 文物ID: a.id });

  addRel("朝代", a.dynasty);
  addRel("时期", a.period);
  addRel("类别", a.category);
  addRel("材质", a.material);
  addRel("出土地点", a.discoveryPlace);
  addRel("现藏地", a.currentLocation);
  if (a.discoveryYear) addRel("出土年份", String(a.discoveryYear));

  for (const k of (a.knowledge || [])) {
    addRel(`知识[${k.type}]`, k.content.slice(0, 50) + (k.content.length > 50 ? "…" : ""));
  }
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(knowledgeRows), "知识要点");
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(graphRows), "知识图谱");

const outPath = "./artifact-knowledge.xlsx";
XLSX.writeFile(wb, outPath);
console.log(`已导出: ${outPath}`);
