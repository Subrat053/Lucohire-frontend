const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');
const data = fs.readFileSync('talentData.txt', 'utf8');
const section = fs.readFileSync('talentSection.txt', 'utf8');

if (!code.includes('export default function LandingPage')) {
  console.log('Error 1'); process.exit(1);
}

// 1. Inject data
if (!code.includes('const TOP_TALENT = [')) {
  code = code.replace(/export default function LandingPage/, data + '\nexport default function LandingPage');
}

// 2. Inject section
// The section to insert before is: <section className="bg-[#F7F9FC] py-20 overflow-hidden">
code = code.replace(/<section className=\"bg-\[\#F7F9FC\] py-20 overflow-hidden\">/, section + '\n\n<section className="bg-[#F7F9FC] py-20 overflow-hidden">');

fs.writeFileSync('src/pages/LandingPage.jsx', code);
console.log('Successfully injected correctly this time!');
