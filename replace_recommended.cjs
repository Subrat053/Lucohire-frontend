const fs = require('fs');
const file = 'src/pages/provider/AiCareerCoach.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the start and end of renderRecommended
const startStr = '  const renderRecommended = () => (';
const endStr = '  const renderGoalBanner = () => (';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find renderRecommended block');
  process.exit(1);
}

const replacement = `  const recommendedData = {
    'Focus Areas': [
      { icon: <Folder className="w-5 h-5" />, title: 'Add Case Studies to Your Portfolio', desc: 'Show real projects to stand out.', action: 'Learn How', bg: 'bg-indigo-50 text-indigo-500', link: '/provider/resume-toolkit' },
      { icon: <MousePointerClick className="w-5 h-5" />, title: 'Improve Interaction Design Skills', desc: 'Highly in demand for UI/UX roles.', action: 'Start Learning', bg: 'bg-orange-50 text-orange-500', link: '/provider/ai-tips' },
      { icon: <BrainCircuit className="w-5 h-5" />, title: 'Prepare for Product Design Interviews', desc: 'Most asked questions & how to answer.', action: 'Practice Now', bg: 'bg-blue-50 text-blue-500', link: '/provider/grow-with-ai' },
      { icon: <Banknote className="w-5 h-5" />, title: 'Understand Salary Benchmarks', desc: 'Know your worth in the market.', action: 'View Insights', bg: 'bg-teal-50 text-[#0f766e]', link: '/provider/career-health' }
    ],
    'Skill Building': [
      { icon: <BookOpen className="w-5 h-5" />, title: 'Master Advanced Prototyping', desc: 'Learn Figma interactive components.', action: 'Start Course', bg: 'bg-purple-50 text-purple-500', link: '/provider/ai-tips' },
      { icon: <Layers className="w-5 h-5" />, title: 'Design Systems Architecture', desc: 'Build scalable component libraries.', action: 'Learn How', bg: 'bg-pink-50 text-pink-500', link: '/provider/ai-tips' },
      { icon: <CheckCircle2 className="w-5 h-5" />, title: 'Accessibility (a11y) Fundamentals', desc: 'Design for all users.', action: 'Read Guide', bg: 'bg-green-50 text-green-500', link: '/provider/ai-tips' },
      { icon: <TrendingUp className="w-5 h-5" />, title: 'Data-Driven UX Decisions', desc: 'Using analytics to improve design.', action: 'Start Learning', bg: 'bg-blue-50 text-blue-500', link: '/provider/career-health/analytics' }
    ],
    'Job Search': [
      { icon: <Briefcase className="w-5 h-5" />, title: 'Tailor Your Resume for Senior Roles', desc: 'Highlight leadership and impact.', action: 'Use Toolkit', bg: 'bg-yellow-50 text-yellow-600', link: '/provider/resume-toolkit' },
      { icon: <Target className="w-5 h-5" />, title: 'Find Roles Matching Your Skills', desc: 'AI-curated job opportunities.', action: 'View Jobs', bg: 'bg-red-50 text-red-500', link: '/provider/job-for-me' },
      { icon: <Send className="w-5 h-5" />, title: 'Optimize Your Cover Letter', desc: 'Stand out to hiring managers.', action: 'Generate', bg: 'bg-indigo-50 text-indigo-500', link: '/provider/resume-toolkit' },
      { icon: <BarChart2 className="w-5 h-5" />, title: 'Track Application Success Rate', desc: 'Identify bottlenecks in your funnel.', action: 'View Analytics', bg: 'bg-emerald-50 text-emerald-500', link: '/provider/career-health/analytics' }
    ],
    'Career Growth': [
      { icon: <Award className="w-5 h-5" />, title: 'Path to Staff Designer', desc: 'Understand the expectations.', action: 'Read Path', bg: 'bg-amber-50 text-amber-500', link: '/provider/ai-tips' },
      { icon: <Bot className="w-5 h-5" />, title: 'AI in Design Workflows', desc: 'Leverage AI to work faster.', action: 'Learn How', bg: 'bg-cyan-50 text-cyan-500', link: '/provider/grow-with-ai' },
      { icon: <Clock className="w-5 h-5" />, title: 'Time Management for Leaders', desc: 'Balancing IC work and mentoring.', action: 'Start Module', bg: 'bg-rose-50 text-rose-500', link: '/provider/ai-tips' },
      { icon: <Sparkles className="w-5 h-5" />, title: 'Building Your Personal Brand', desc: 'Get recognized in the industry.', action: 'Get Tips', bg: 'bg-fuchsia-50 text-fuchsia-500', link: '/provider/ai-tips' }
    ]
  };

  const renderRecommended = () => (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">Recommended for You</h3>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          {['Focus Areas', 'Skill Building', 'Job Search', 'Career Growth'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveRecTab(tab)}
              className={\`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap border transition-colors \${activeRecTab === tab ? 'bg-emerald-50 text-[#0f766e] border-emerald-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}\`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendedData[activeRecTab]?.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className={\`w-10 h-10 rounded-xl flex items-center justify-center mb-4 \${card.bg}\`}>
              {card.icon}
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">{card.title}</h4>
            <p className="text-gray-500 text-xs mb-6 flex-1">{card.desc}</p>
            <button onClick={() => navigate(card.link)} className="w-full py-2 border border-gray-200 text-[#0f766e] font-bold text-xs rounded-xl hover:bg-teal-50 flex items-center justify-center gap-1 mt-auto transition-colors">
              {card.action} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent);
console.log('Pills made fully functional');
