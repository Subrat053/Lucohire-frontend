const fs = require("fs");
const file = "src/pages/AuthPage.jsx";
const content = fs.readFileSync(file, "utf8");

const splitStr = "/* ═══════════════════════════ SHARED SMALL COMPONENTS ═══════════════════════════ */";
const splitIndex = content.indexOf(splitStr);

if (splitIndex === -1) {
  console.log("Could not find split string");
  process.exit(1);
}

const part1 = content.substring(0, splitIndex);
let part2 = content.substring(splitIndex);

const replacements = {
  "blue-600": "emerald-800",
  "blue-700": "emerald-900",
  "indigo-600": "emerald-800",
  "blue-500": "emerald-600",
  "blue-400": "emerald-500",
  "blue-300": "emerald-400",
  "blue-200": "emerald-200",
  "blue-100": "emerald-100",
  "blue-50": "emerald-50",
  "indigo-500": "emerald-600",
  "indigo-400": "emerald-500",
  "indigo-100": "emerald-100",
  "indigo-50": "emerald-50",
};

for (const [key, val] of Object.entries(replacements)) {
  const regex = new RegExp(key, "g");
  part2 = part2.replace(regex, val);
}

fs.writeFileSync(file, part1 + part2);
console.log("Colors updated successfully");
