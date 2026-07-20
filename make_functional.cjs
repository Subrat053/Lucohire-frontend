const fs = require('fs');
const file = 'src/pages/provider/AiCareerCoach.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add activeRecTab state
content = content.replace(
  "const [goalLoading, setGoalLoading] = useState(false);",
  "const [goalLoading, setGoalLoading] = useState(false);\n  const [activeRecTab, setActiveRecTab] = useState('Focus Areas');"
);

// 2. Replace static tabs in renderRecommended with map
const staticTabs = `<button className="px-4 py-1.5 rounded-full bg-emerald-50 text-[#0f766e] font-bold text-sm whitespace-nowrap border border-emerald-100">Focus Areas</button>
          <button className="px-4 py-1.5 rounded-full bg-white text-gray-500 font-bold text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50">Skill Building</button>
          <button className="px-4 py-1.5 rounded-full bg-white text-gray-500 font-bold text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50">Job Search</button>
          <button className="px-4 py-1.5 rounded-full bg-white text-gray-500 font-bold text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50">Career Growth</button>`;

const dynamicTabs = `{['Focus Areas', 'Skill Building', 'Job Search', 'Career Growth'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveRecTab(tab)}
              className={\`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap border transition-colors \${activeRecTab === tab ? 'bg-emerald-50 text-[#0f766e] border-emerald-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}\`}
            >
              {tab}
            </button>
          ))}`;

content = content.replace(staticTabs, dynamicTabs);

// 3. Add onClick to card buttons
// First card (Learn How)
content = content.replace(
  `<button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            Learn How <ArrowRight className="w-5 h-5" />\n          </button>`,
  `<button onClick={() => toast('Feature Coming Soon! 🚀')} className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            Learn How <ArrowRight className="w-5 h-5" />\n          </button>`
);

// Second card (Start Learning)
content = content.replace(
  `<button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            Start Learning <ArrowRight className="w-5 h-5" />\n          </button>`,
  `<button onClick={() => toast('Feature Coming Soon! 🚀')} className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            Start Learning <ArrowRight className="w-5 h-5" />\n          </button>`
);

// Third card (Practice Now)
content = content.replace(
  `<button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            Practice Now <ArrowRight className="w-5 h-5" />\n          </button>`,
  `<button onClick={() => toast('Feature Coming Soon! 🚀')} className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            Practice Now <ArrowRight className="w-5 h-5" />\n          </button>`
);

// Fourth card (View Insights)
content = content.replace(
  `<button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            View Insights <ArrowRight className="w-5 h-5" />\n          </button>`,
  `<button onClick={() => navigate('/provider/career-health')} className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">\n            View Insights <ArrowRight className="w-5 h-5" />\n          </button>`
);

// 4. Goal update button
content = content.replace(
  `<button className="px-5 py-2.5 rounded-xl border-2 border-[#0f766e] text-[#0f766e] font-bold text-sm hover:bg-teal-50 transition-colors ml-auto sm:ml-0 bg-white shadow-sm">\n            Update Goal\n          </button>`,
  `<button onClick={() => setGoalModalOpen(true)} className="px-5 py-2.5 rounded-xl border-2 border-[#0f766e] text-[#0f766e] font-bold text-sm hover:bg-teal-50 transition-colors ml-auto sm:ml-0 bg-white shadow-sm">\n            Update Goal\n          </button>`
);

fs.writeFileSync(file, content);
console.log('Interactivity added successfully');
