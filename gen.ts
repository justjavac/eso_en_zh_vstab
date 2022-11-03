import { parse, stringify } from "https://deno.land/std@0.161.0/encoding/csv.ts";

const columns = ["ID", "Unknown", "Index", "Offset", "Text"];

const en = await parseLang("./gamedata/lang/en.lang.csv");
const vstab = await parseLang("./gamedata/lang/vstab.lang.csv");
const zh = await parseLang("./gamedata/lang/zh.lang.csv");

const maps = {
  4330293: "区域",
  10860933: "区域+地点",
  17915077: "技能",
};

await Deno.writeTextFile(
  "./gamedata/lang/en.lang.csv",
  stringify(en.filter((x) => Object.hasOwn(maps, x.ID)), { columns }),
);

await Deno.writeTextFile(
  "./gamedata/lang/vstab.lang.csv",
  stringify(vstab.filter((x) => Object.hasOwn(maps, x.ID)), { columns }),
);

await Deno.writeTextFile(
  "./gamedata/lang/zh.lang.csv",
  stringify(zh.filter((x) => Object.hasOwn(maps, x.ID)), { columns }),
);

// 判断官中文件是否完整
if (en.length !== zh.length) {
  console.log("en.length !== zh.length");
  Deno.exit(1);
}

const en2zh = new Map<string, string>();
for (let i = 0; i < en.length; i++) {
  en2zh.set(en[i].Text, zh[i].Text);
}

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

let output = "# 上古卷轴 OL 中英文对照表（英文 vs 官中 vs 微攻略）\n\n";

output += `## 区域\n\n`;
output += `| 英文 | 官中 | 微攻略 \n`;
output += `| --- | --- | --- \n`;

// 区域
for (const x of en) {
  if (x.ID === "4330293") {
    output += `| ${x.Text} | ${en2zh.get(x.Text)} | ${en2vstab.get(x.Text) ?? "-"} \n`;
  }
}

output += `\n`;

// 地点
output += `## 地点\n\n`;
output += `| 英文 | 官中 | 微攻略 \n`;
output += `| --- | --- | --- \n`;

for (const x of en) {
  if (x.ID === "10860933") {
    output += `| ${x.Text} | ${en2zh.get(x.Text)} | ${en2vstab.get(x.Text) ?? "-"} \n`;
  }
}

output += `\n`;

// 技能
output += `## 技能\n\n`;
output += `| 英文 | 官中 | 微攻略 \n`;
output += `| --- | --- | --- \n`;

for (const x of en) {
  if (x.ID === "17915077") {
    output += `| ${x.Text} | ${en2zh.get(x.Text)} | ${en2vstab.get(x.Text) ?? "-"} \n`;
  }
}

output += `\n`;

await Deno.writeTextFile("./README.md", output);

/**** utils ****/

type LangItem = {
  ID: string;
  Unknown: string;
  Index: string;
  Offset: string;
  Text: string;
};

async function parseLang(path: string) {
  return parse(await Deno.readTextFile(path), {
    skipFirstRow: true,
    columns,
  }) as LangItem[];
}
