const fs = require('fs');
const path = require('path');
const srcDir = path.join(process.cwd(), 'src', 'pages');
const oldPath = path.join(srcDir, 'old_landing_content.jsx');
const currentPath = path.join(srcDir, 'LandingPage.jsx');

const oldCode = fs.readFileSync(oldPath, 'utf8');
let currentCode = fs.readFileSync(currentPath, 'utf8');

const topTalentDataRegex = /\/\/ Mock Data for Top Talent[\s\S]*?(?=export default function LandingPage\(\) \{)/;
const topTalentDataMatch = oldCode.match(topTalentDataRegex);

const topTalentSectionRegex = /\{\/\* 5\. Top Talent Available \*\/\}[\s\S]*?(?=\{\/\* 6\. Why Choose Lucohire\? \*\/\})/;
const topTalentSectionMatch = oldCode.match(topTalentSectionRegex);

if (!topTalentDataMatch || !topTalentSectionMatch) {
  console.error("Could not find Top Talent section or data");
  process.exit(1);
}

// Add state variables
const stateVars = `const [talentSearch, setTalentSearch] = useState("");
  const handleTalentSearch = (e) => {
    e.preventDefault();
    navigate(\`/search?query=\${encodeURIComponent(talentSearch)}\`);
  };`;

currentCode = currentCode.replace(/const handleJobSearch = \(e\) => \{/, stateVars + '\n  const handleJobSearch = (e) => {');

// Add data definition before 'export default function LandingPage'
currentCode = currentCode.replace(/export default function LandingPage/, topTalentDataMatch[0] + '\nexport default function LandingPage');

// Add section before '{/* ━━━━━━━━ VERIFIED PROS ━━━━━━━━ */}'
currentCode = currentCode.replace(/\{\/\* ━━━━━━━━ VERIFIED PROS ━━━━━━━━ \*\/\}/, topTalentSectionMatch[0] + '\n      {/* ━━━━━━━━ VERIFIED PROS ━━━━━━━━ */}');

// Write back to LandingPage.jsx
fs.writeFileSync(currentPath, currentCode);
console.log('Successfully injected Top Talent Hourly Work section');
