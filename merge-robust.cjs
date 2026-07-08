const fs = require('fs');

const oldCode = fs.readFileSync('src/pages/LandingPage.jsx.bak', 'utf8');
const newCode = fs.readFileSync('src/pages/newLandingpage.jsx', 'utf8');

// 1. Extract Hero and Dual Cards from LandingPage.jsx.bak
const heroStartIdx = oldCode.indexOf('{/* 2. Hero Section */}');
const afterDualCardsIdx = oldCode.indexOf('{/* 4. Live Jobs Banner */}');
if (heroStartIdx === -1 || afterDualCardsIdx === -1) {
  console.error("Could not find hero or dual cards in LandingPage.jsx");
  process.exit(1);
}

const topBannerStartIdx = oldCode.indexOf('{/* 1. Top Banner');
let heroAndDualCards = oldCode.substring(topBannerStartIdx > -1 ? topBannerStartIdx : heroStartIdx, afterDualCardsIdx);

// 2. Extract TOP_TALENT array from LandingPage.jsx.bak
const talentDataMatch = oldCode.match(/const TOP_TALENT = \[[\s\S]*?\];/);
if (!talentDataMatch) {
  console.error("Could not find TOP_TALENT in LandingPage.jsx");
  process.exit(1);
}
const topTalentData = talentDataMatch[0];

// 3. Extract the Hourly Work Cards block from LandingPage.jsx.bak
const cardsContainerStart = oldCode.indexOf('{/* 5. Top Talent Available */}');
const cardsContainerEnd = oldCode.indexOf('{/* 6. Why Choose Lucohire? */}');
if (cardsContainerStart === -1 || cardsContainerEnd === -1) {
  console.error("Could not find Hourly Cards section in LandingPage.jsx");
  process.exit(1);
}
let topTalentSection = oldCode.substring(cardsContainerStart, cardsContainerEnd);

// 4. Now modify newLandingpage.jsx
let mergedCode = newCode;

// Rename Index to LandingPage
mergedCode = mergedCode.replace('const Index = () => {', 'export default function LandingPage() {');
mergedCode = mergedCode.replace('export default Index;', '');

// Add useAuth import and Auth state logic
mergedCode = mergedCode.replace(
  'import { useNavigate } from "react-router-dom";',
  'import { useNavigate } from "react-router-dom";\nimport { useAuth } from "../context/AuthContext";'
);

const endOfVarsIdx = mergedCode.indexOf('const debounceRef = useRef(null);');

const authVars = `const { user } = useAuth();
  const [jobSearch, setJobSearch] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [talentSearch, setTalentSearch] = useState("");

  const handleJobSearch = (e) => {
    e.preventDefault();
    if (user?.activeRole === "provider") {
      navigate("/provider/job-for-me", { state: { formData: { skills: jobSearch, location: jobLocation } } });
    } else if (user?.activeRole === "recruiter") {
      navigate("/recruiter/dashboard");
    } else {
      navigate(\`/unlock-matches\`, { state: { formData: { skills: jobSearch, location: jobLocation } } });
    }
  };
  
  const handleTalentSearch = (e) => {
    e.preventDefault();
    navigate(\`/search?query=\${encodeURIComponent(talentSearch)}\`);
  };
`;

mergedCode = mergedCode.substring(0, endOfVarsIdx) + authVars + mergedCode.substring(endOfVarsIdx);

// Add the TOP_TALENT data array before the component
mergedCode = mergedCode.replace('export default function LandingPage() {', topTalentData + '\n\nexport default function LandingPage() {');

// 5. Replace the Hero section in newLandingpage.jsx
// In newLandingpage.jsx, the first section is the hero. Let's find it.
const firstSectionStart = mergedCode.indexOf('<section className="relative overflow-hidden');
const secondSectionStart = mergedCode.indexOf('<section', firstSectionStart + 10);

if (firstSectionStart === -1 || secondSectionStart === -1) {
    console.error("Could not find sections in newLandingpage.jsx");
    process.exit(1);
}

mergedCode = mergedCode.substring(0, firstSectionStart) + heroAndDualCards + '\n' + mergedCode.substring(secondSectionStart);

// 6. Insert the Top Talent section right before the "VERIFIED PROS" section
const verifiedProsTextIdx = mergedCode.indexOf('1,264 verified pros');
const verifiedProsSectionIdx = mergedCode.lastIndexOf('<section', verifiedProsTextIdx);

mergedCode = mergedCode.substring(0, verifiedProsSectionIdx) + topTalentSection + '\n' + mergedCode.substring(verifiedProsSectionIdx);


fs.writeFileSync('src/pages/LandingPage2.jsx', mergedCode);
console.log('Merge complete to LandingPage2.jsx');
