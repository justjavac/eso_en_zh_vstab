import { parse, stringify } from "https://deno.land/std@0.161.0/encoding/csv.ts";

type LangItem = {
  ID: typeof ids[number];
  Unknown: string;
  Index: string;
  Offset: string;
  Text: string;
};

const columns = ["ID", "Unknown", "Index", "Offset", "Text"];

// 只保留：区域、地点、技能
const ids = ["4330293", "10860933", "17915077"] as const;

const en = await parseLang("./gamedata/lang/en.lang.csv");
const zh = await parseLang("./gamedata/lang/zh.lang.csv");
const vstab = await parseLang("./gamedata/lang/vstab.lang.csv");

clearCSV("en", en);
clearCSV("zh", zh);
clearCSV("vstab", vstab);

// 判断官中文件是否完整
if (en.length !== zh.length) {
  console.log("en.length !== zh.length");
  Deno.exit(1);
}

// 构建官方英文到中文的映射
const en2zh: Record<typeof ids[number], Map<string, string>> = {
  4330293: new Map(),
  10860933: new Map(),
  17915077: new Map(),
};
en.forEach(({ ID, Text }, i) => {
  en2zh[ID].set(Text, zh[i].Text);
});

// 构建微攻略英文到中文的映射
// 格式 `"中文<英文>"`，例如 `"迪沙安<Deshaan>"`
const en2vstab = new Map<string, string>();
for (const x of vstab) {
  const m = x.Text.match(/(.*)<(.*)>/);
  if (m === null || m.length !== 3) {
    console.warn(`Invalid vstab.lang.csv: ${x.Text}`);
    continue;
  }
  const [_, zh, en] = m;
  en2vstab.set(en, zh);
}

const output = `# 上古卷轴 OL 中英文对照表（英文 vs 官中 vs 微攻略）

## 区域

| 英文 | 官中 | 微攻略
| --- | --- | ---
${[...en2zh["4330293"]].map(([en, zh]) => `| ${en} | ${zh} | ${en2vstab.get(en) ?? "-"}`).join("\n")}

## 地牢

| 英文 | 官中 | 微攻略
| --- | --- | ---
${
  [...en2zh["10860933"]]
    .filter(([en]) => en.startsWith("Dungeon:"))
    .map(([en, zh]) => `| ${en} | ${zh} | ${en2vstab.get(en) ?? "-"}`)
    .join("\n")
}

## 试炼

| 英文 | 官中 | 微攻略
| --- | --- | ---
${
  [...en2zh["10860933"]]
    .filter(([en]) => en.startsWith("Trial:"))
    .map(([en, zh]) => `| ${en} | ${zh} | ${en2vstab.get(en) ?? "-"}`)
    .join("\n")
}

## 竞技场

| 英文 | 官中 | 微攻略
| --- | --- | ---
${
  [...en2zh["10860933"]]
    .filter(([en]) => en.startsWith("Arena:"))
    .map(([en, zh]) => `| ${en} | ${zh} | ${en2vstab.get(en) ?? "-"}`)
    .join("\n")
}

## 地点

| 英文 | 官中 | 微攻略
| --- | --- | ---
${
  [...en2zh["10860933"]]
    .filter(([en]) => !en.startsWith("Dungeon:"))
    .filter(([en]) => !en.startsWith("Trial:"))
    .filter(([en]) => !en.startsWith("Arena:"))
    .map(([en, zh]) => `| ${en} | ${zh} | ${en2vstab.get(en) ?? "-"}`)
    .join("\n")
}

## 技能

| 英文 | 官中 | 微攻略
| --- | --- | ---
${
  [...en2zh["17915077"]]
    .map(([en, zh]) => `| ${en} | ${zh} | ${en2vstab.get(en) ?? "-"}`)
    .join("\n")
}
`;

await Deno.writeTextFile("./README.md", output);

/**** utils ****/

async function parseLang(path: string) {
  return parse(await Deno.readTextFile(path), {
    skipFirstRow: true,
    columns,
  }) as LangItem[];
}

async function clearCSV(lang: string, items: LangItem[]) {
  const result = items.filter((item) => ids.includes(item.ID));
  const csv = stringify(result, { columns });
  await Deno.writeTextFile(`./gamedata/lang/${lang}.lang.csv`, csv);
}
