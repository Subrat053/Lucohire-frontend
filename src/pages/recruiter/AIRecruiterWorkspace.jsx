import React, { useState } from 'react';
import { 
  FiSearch, FiFileText, FiUsers, FiMail, FiHelpCircle, FiCode, 
  FiZap, FiDollarSign, FiTrendingUp, FiBarChart2, FiMessageSquare, 
  FiClock, FiArrowRight, FiPlus, FiChevronRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaRobot } from 'react-icons/fa';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

export default function AIRecruiterWorkspace() {
  const [chatInput, setChatInput] = useState('');

  const quickActions = [
    { icon: <HiSparkles />, label: 'Find candidates' },
    { icon: <FiFileText />, label: 'Write a JD' },
    { icon: <FiMail />, label: 'Generate email' },
    { icon: <FiSearch />, label: 'Boolean search' },
    { icon: <FiTrendingUp />, label: 'Market insights' },
    { icon: <FiMessageSquare />, label: 'Interview questions' },
  ];

  const actionCards = [
    {
      icon: <FiSearch />, icBg: 'bg-emerald-50', icColor: 'text-emerald-600',
      title: 'AI Talent Search',
      desc: 'Find the best candidates using natural language or advanced filters.',
      tag: 'Popular', tagBg: 'bg-emerald-50 text-emerald-700',
      link: 'Search Candidates'
    },
    {
      icon: <FiFileText />, icBg: 'bg-purple-50', icColor: 'text-purple-600',
      title: 'JD Generator',
      desc: 'Create a detailed, role-specific job description in seconds.',
      tag: 'Essential', tagBg: 'bg-purple-50 text-purple-700',
      link: 'Generate JD'
    },
    {
      icon: <FiUsers />, icBg: 'bg-emerald-50', icColor: 'text-emerald-600',
      title: 'Candidate Recommendations',
      desc: 'Get AI recommended candidates for your open jobs.',
      tag: 'Recommended', tagBg: 'bg-emerald-50 text-emerald-700',
      link: 'Get Recommendations'
    },
    {
      icon: <FiMail />, icBg: 'bg-orange-50', icColor: 'text-orange-500',
      title: 'Email Generator',
      desc: 'Write personalized outreach emails that get more responses.',
      link: 'Generate Email'
    },
    {
      icon: <FiHelpCircle />, icBg: 'bg-rose-50', icColor: 'text-rose-500',
      title: 'Interview Questions',
      desc: 'Get role-specific interview questions and evaluation criteria.',
      link: 'Generate Questions'
    },
    {
      icon: <FiCode />, icBg: 'bg-blue-50', icColor: 'text-blue-600',
      title: 'Boolean Search Builder',
      desc: 'Build complex boolean strings easily with AI assistance.',
      link: 'Build Boolean'
    },
  ];

  const smartTools = [
    { icon: <FiFileText />, icColor: 'text-indigo-600', title: 'Resume Analysis', desc: 'Analyze any resume with AI' },
    { icon: <FiZap />, icColor: 'text-emerald-600', title: 'Skills Extractor', desc: 'Extract skills and competencies' },
    { icon: <FiUsers />, icColor: 'text-blue-600', title: 'Sourcing Leads', desc: 'Find and qualify sourcing leads' },
    { icon: <FiDollarSign />, icColor: 'text-rose-500', title: 'Salary Insights', desc: 'Get market salary data instantly' },
    { icon: <FiBarChart2 />, icColor: 'text-teal-600', title: 'Competitor Insights', desc: 'Analyze competitor hiring patterns' },
    { icon: <FiTrendingUp />, icColor: 'text-purple-600', title: 'Hiring Trends', desc: 'Discover latest hiring trends' },
  ];

  const recentConversations = [
    { title: 'React developers in Bangalore', desc: 'Looking for 4+ years experience...', time: '10:30 AM' },
    { title: 'Frontend developer with Next.js', desc: 'Find candidates with Next.js and...', time: 'Yesterday' },
    { title: 'Senior UI/UX designers', desc: 'Looking for senior designers with...', time: 'Yesterday' },
    { title: 'DevOps engineer in Mumbai', desc: 'Find DevOps engineers with AWS...', time: '2 days ago' },
    { title: 'Full stack developer salary', desc: 'Market salary insights for full...', time: '3 days ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              AI Recruiter Workspace <HiSparkles className="text-purple-600" />
            </h1>
            <p className="text-sm text-gray-500 mt-1">How can Luco AI help you hire better today?</p>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm">
            <FiPlus /> New Chat
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Left Column */}
          <div className="xl:col-span-8 2xl:col-span-9 space-y-10">
            
            {/* Hero Search Box - Original Theme & Mobile Optimized */}
            <div className="bg-gradient-to-r from-indigo-50 via-[#F3E8FF] to-purple-50 rounded-2xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center min-h-[280px]">
              
              <div className="relative z-10 w-full md:w-[60%] lg:w-[65%] flex flex-col pt-2 md:pt-0">
                <h2 className="text-[22px] sm:text-[26px] font-extrabold text-gray-900 mb-1.5 tracking-tight text-center md:text-left">Start a conversation with Luco AI</h2>
                <p className="text-sm font-medium text-gray-600 mb-6 text-center md:text-left">Ask anything about candidates, jobs, hiring strategies or insights.</p>
                
                <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-1.5 flex items-center mb-6 focus-within:ring-2 focus-within:ring-purple-200 transition">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder='Ask anything... e.g. "Find React developers with 4+ yrs"'
                    className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
                  />
                  <button className="w-9 h-9 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg flex items-center justify-center transition shrink-0 ml-2">
                    <FiArrowRight className="w-4 h-4 font-bold" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                  {quickActions.map((action, idx) => (
                    <button key={idx} className="flex items-center gap-1.5 bg-white text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition">
                      <span className="text-purple-600">{action.icon}</span>
                      <span className="whitespace-nowrap">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Robot Illustration Area */}
              <div className="w-full md:w-[40%] lg:w-[35%] flex justify-center md:absolute md:right-0 md:bottom-0 md:top-0 opacity-100 md:pr-4 mb-6 md:mb-0 pointer-events-none order-first md:order-last">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56">
                  <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full scale-110"></div>
                  <img src="/luco_ai_robot.png" alt="Luco AI" className="w-full h-full object-contain relative z-10 drop-shadow-xl animate-float" />
                  {/* Sparkles */}
                  <HiSparkles className="absolute top-4 right-4 sm:right-8 text-pink-400 w-6 h-6 sm:w-8 sm:h-8 animate-pulse z-20" />
                  <HiSparkles className="absolute bottom-8 left-2 sm:left-4 text-purple-400 w-4 h-4 sm:w-6 sm:h-6 animate-pulse delay-75 z-20" />
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-6">What would you like to do today?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {actionCards.map((card, idx) => (
                  <SCard key={idx} className="p-5 flex flex-col hover:border-indigo-200 transition group cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.icBg} ${card.icColor}`}>
                        <span className="text-lg">{card.icon}</span>
                      </div>
                      {card.tag && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${card.tagBg}`}>
                          {card.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1.5">{card.title}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed flex-1 mb-5">{card.desc}</p>
                    <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:text-indigo-700 transition">
                      {card.link} <FiArrowRight />
                    </div>
                  </SCard>
                ))}
              </div>
            </div>

            {/* Smart Tools */}
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-6">Smart Tools</h3>
              <SCard className="p-6 flex items-center">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
                  {smartTools.map((tool, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center group cursor-pointer">
                      <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition ${tool.icColor}`}>
                        <span className="text-xl">{tool.icon}</span>
                      </div>
                      <div className="text-xs font-bold text-gray-900 mb-1">{tool.title}</div>
                      <div className="text-[10px] text-gray-500 font-medium leading-tight px-2">{tool.desc}</div>
                    </div>
                  ))}
                </div>
              </SCard>
              <div className="mt-4 text-center">
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto transition">
                  Explore All Tools <FiArrowRight />
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
            
            {/* Recent Conversations */}
            <SCard className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-gray-900">Recent Conversations</h3>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1">View all <FiArrowRight /></button>
              </div>
              <div className="space-y-4">
                {recentConversations.map((conv, idx) => (
                  <div key={idx} className="flex gap-3 group cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FiMessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition">{conv.title}</h4>
                        <span className="text-[10px] font-semibold text-gray-400 shrink-0">{conv.time}</span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 truncate">{conv.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SCard>

            {/* AI Insights */}
            <SCard className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-gray-900">AI Insights for You</h3>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1">View all <FiArrowRight /></button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FiTrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-0.5">High demand for React developers</h4>
                    <p className="text-[11px] font-medium text-gray-500">12% increase in demand this month</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-0.5">Best time to hire</h4>
                    <p className="text-[11px] font-medium text-gray-500">Thursdays show 28% more responses</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <FiCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-0.5">Top skill in demand</h4>
                    <p className="text-[11px] font-medium text-gray-500">TypeScript is trending in your market</p>
                  </div>
                </div>
              </div>
            </SCard>

            {/* Copilot Usage */}
            <SCard className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-gray-900">Copilot Usage This Week</h3>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1">View usage <FiArrowRight /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5"><FiMessageSquare className="w-3 h-3" /></div>
                  <div className="text-sm font-extrabold text-gray-900">24</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Conversations</div>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5"><FiClock className="w-3 h-3" /></div>
                  <div className="text-sm font-extrabold text-gray-900">3h 12m</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Time Saved</div>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-1.5"><FiZap className="w-3 h-3" /></div>
                  <div className="text-sm font-extrabold text-gray-900">48</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tasks Completed</div>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5"><HiSparkles className="w-3 h-3" /></div>
                  <div className="text-sm font-extrabold text-gray-900">92%</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Accuracy</div>
                </div>
              </div>
            </SCard>

          </div>
        </div>

      </div>


    </div>
  );
}
