const fs = require('fs');
const path = require('path');
const srcDir = path.join(process.cwd(), 'src', 'pages');
const oldPath = path.join(srcDir, 'LandingPage.jsx');
const newPath = path.join(srcDir, 'newLandingpage.jsx');
const outPath = path.join(srcDir, 'LandingPage.jsx');
const oldCode = fs.readFileSync(oldPath, 'utf8');
const newCode = fs.readFileSync(newPath, 'utf8');

const topBannerRegex = /\{\/\* 1\. Top Banner \(Only on Landing Page\) \*\/\}[\s\S]*?(?=\{\/\* 2\. Hero Section \*\/\})/;
const heroRegex = /\{\/\* 2\. Hero Section \*\/\}[\s\S]*?(?=\{\/\* 3\. Dual Pathway Cards \*\/\})/;
const dualCardsRegex = /\{\/\* 3\. Dual Pathway Cards \*\/\}[\s\S]*?(?=\{\/\* 4\. Live Jobs Banner \*\/\})/;

const topBannerMatch = oldCode.match(topBannerRegex);
const heroMatch = oldCode.match(heroRegex);
const dualCardsMatch = oldCode.match(dualCardsRegex);

if (!topBannerMatch || !heroMatch || !dualCardsMatch) {
  console.error('Could not extract sections from LandingPage.jsx');
  process.exit(1);
}

const newSectionsRegex = /(\{\/\* ━━━━━━━━ VERIFIED PROS ━━━━━━━━ \*\/\}[\s\S]*)(?=<\/div>\s*\)\;\s*\}\;)/;
const newSectionsMatch = newCode.match(newSectionsRegex);

if (!newSectionsMatch) {
  console.error('Could not extract new sections from newLandingpage.jsx');
  process.exit(1);
}

let mergedCode = newCode;
mergedCode = mergedCode.replace(/const Index = \(\) => \{/, 'export default function LandingPage() {');
mergedCode = mergedCode.replace(/export default Index;/, '');
mergedCode = mergedCode.replace(/import \{ useNavigate \} from \"react-router-dom\";/, 'import { useNavigate } from "react-router-dom";\nimport { useAuth } from "../context/AuthContext";');

const stateBlock = `const navigate = useNavigate();
  const { user } = useAuth();
  const [jobSearch, setJobSearch] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const handleJobSearch = (e) => {
    e.preventDefault();
    if (user?.activeRole === "provider") {
      navigate("/provider/job-for-me", { state: { formData: { skills: jobSearch, location: jobLocation } } });
    } else if (user?.activeRole === "recruiter") {
      navigate("/recruiter/dashboard");
    } else {
      navigate(\`/unlock-matches\`, { state: { formData: { skills: jobSearch, location: jobLocation } } });
    }
  };`;
mergedCode = mergedCode.replace(/const navigate = useNavigate\(\);/, stateBlock);

const returnRegex = /return \(\s*<div className=\"min-h-screen bg-white text-\[\#081B3A\] font-sans antialiased\">\s*\{\/\* ━━━━━━━━ NAVBAR ━━━━━━━━ \*\/\}[\s\S]*?(?=\{\/\* ━━━━━━━━ VERIFIED PROS ━━━━━━━━ \*\/\})/;
const replacement = `return (\n    <div className="min-h-screen bg-white text-[#081B3A] font-sans antialiased">\n      ${topBannerMatch[0]}\n      ${heroMatch[0]}\n      ${dualCardsMatch[0]}\n      `;
mergedCode = mergedCode.replace(returnRegex, replacement);

// We need to also add missing imports from LandingPage.jsx that the dual cards need
// like Users, Check, ArrowRight, Briefcase, MapPin, Search (these are mostly already in newLandingpage.jsx)
fs.writeFileSync(outPath, mergedCode);
console.log('Successfully merged LandingPage.jsx');
