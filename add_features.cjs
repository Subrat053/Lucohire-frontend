const fs = require('fs');

const file = 'src/pages/provider/AiCareerCoach.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
const importsToAdd = `Folder, MousePointerClick, BrainCircuit, Banknote, Flag,`;
content = content.replace(/import \{/, `import {\n  ${importsToAdd}`);

// 2. Add the two new render functions before the main return
const renderRecommendedStr = `
  const renderRecommended = () => (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">Recommended for You</h3>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <button className="px-4 py-1.5 rounded-full bg-emerald-50 text-[#0f766e] font-bold text-sm whitespace-nowrap border border-emerald-100">Focus Areas</button>
          <button className="px-4 py-1.5 rounded-full bg-white text-gray-500 font-bold text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50">Skill Building</button>
          <button className="px-4 py-1.5 rounded-full bg-white text-gray-500 font-bold text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50">Job Search</button>
          <button className="px-4 py-1.5 rounded-full bg-white text-gray-500 font-bold text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50">Career Growth</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
            <Folder className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">Add Case Studies to Your Portfolio</h4>
          <p className="text-gray-500 text-xs mb-6 flex-1">Show real projects to stand out.</p>
          <button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-xs rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">
            Learn How <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">Improve Interaction Design Skills</h4>
          <p className="text-gray-500 text-xs mb-6 flex-1">Highly in demand for UI/UX roles.</p>
          <button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-xs rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">
            Start Learning <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">Prepare for Product Design Interviews</h4>
          <p className="text-gray-500 text-xs mb-6 flex-1">Most asked questions & how to answer.</p>
          <button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-xs rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">
            Practice Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center mb-4">
            <Banknote className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">Understand Salary Benchmarks</h4>
          <p className="text-gray-500 text-xs mb-6 flex-1">Know your worth in the market.</p>
          <button className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-xs rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">
            View Insights <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderGoalBanner = () => (
    <div className="mt-6 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-6 flex flex-col lg:flex-row gap-8 justify-between items-center relative overflow-hidden">
      <div className="flex-1 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">Let's Achieve Your Goal <Target className="w-6 h-6 text-red-500" /></h3>
        <p className="text-gray-600 text-sm">You want to become a Senior UI/UX Designer within 2 years.</p>
        
        <div className="flex flex-wrap items-center gap-8 pt-2">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Target Role</p>
            <p className="text-[#0f766e] font-extrabold text-base">Senior UI/UX Designer</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Target Time</p>
            <p className="text-[#0f766e] font-extrabold text-base">2 Years</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl border-2 border-[#0f766e] text-[#0f766e] font-bold text-sm hover:bg-teal-50 transition-colors ml-auto sm:ml-0 bg-white shadow-sm">
            Update Goal
          </button>
        </div>
      </div>

      <div className="hidden lg:block w-px h-24 bg-emerald-200/60" />

      <div className="flex-1 relative w-full flex items-center lg:pl-4">
        <div className="max-w-md relative z-10 w-full">
          <h4 className="font-bold text-[#0f766e] text-base mb-1">Next Milestone</h4>
          <p className="text-gray-600 text-sm mb-4">Strengthen your portfolio and gain advanced UI interaction skills.</p>
          <div className="w-3/4 bg-emerald-200/50 h-2.5 rounded-full mb-1">
            <div className="bg-[#0f766e] h-2.5 rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="text-xs font-bold text-gray-700">60% Completed</p>
        </div>
        
        <div className="absolute -right-8 -bottom-10 text-emerald-100 opacity-60">
          <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 60 L20 150 L180 150 Z" fill="#d1fae5" />
            <path d="M140 40 L60 150 L220 150 Z" fill="#a7f3d0" />
            <path d="M140 40 L140 20" stroke="#0f766e" strokeWidth="3" />
            <path d="M140 20 L165 25 L140 35" fill="#0f766e" />
          </svg>
        </div>
      </div>
    </div>
  );
`;

content = content.replace('// ─── MAIN RENDER ─────────────────────────────────────────────────────────', renderRecommendedStr + '\n\n  // ─── MAIN RENDER ─────────────────────────────────────────────────────────');

// 3. Insert calls at the bottom of the grid
const gridEnd = `      </div>

      {/* Goal Update Modal */}`;
      
const replacement = `      </div>

      {renderRecommended()}
      {renderGoalBanner()}

      {/* Goal Update Modal */}`;

content = content.replace(gridEnd, replacement);

fs.writeFileSync(file, content);
console.log('Features added successfully');
