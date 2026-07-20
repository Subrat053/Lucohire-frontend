import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Settings, Send, CheckCircle2, Circle,
  Calendar, Video, FileText, Target, X,
  ThumbsUp, ThumbsDown, Bot, Sparkles, Briefcase,
  TrendingUp, Award, Clock, RefreshCw, ChevronRight,
  BarChart2, BookOpen, Layers, Edit2, Check,
  Folder, MousePointerClick, BrainCircuit, Banknote, Flag
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TABS = ['Overview', 'Daily Tasks', 'Career Plan', 'Resources', 'Progress'];

export default function AiCareerCoach() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core data
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Task state (local, derived from data)
  const [tasks, setTasks] = useState([]);
  const [refreshingTasks, setRefreshingTasks] = useState(false);

  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // UI state
  const [showCalendar, setShowCalendar] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [fullPlanModalOpen, setFullPlanModalOpen] = useState(false);
  const [goalRole, setGoalRole] = useState('');
  const [goalTimeline, setGoalTimeline] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
  const [activeRecTab, setActiveRecTab] = useState('Focus Areas');
  const [tipFeedback, setTipFeedback] = useState(null); // 'up' | 'down' | null
  const chatEndRef = useRef(null);

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (data?.currentGoal) {
      setGoalRole(data.currentGoal.role || '');
      setGoalTimeline(data.currentGoal.time || '');
    }
  }, [data]);

  useEffect(() => {
    if (data?.todaysTasks) setTasks(data.todaysTasks);
  }, [data?.todaysTasks]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Check if all tasks done → refresh
  useEffect(() => {
    if (tasks.length > 0 && tasks.every(t => t.status === 'completed')) {
      handleTasksRefresh();
    }
  }, [tasks]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/provider/ai/ai-coach/dashboard');
      if (res.data?.success) setData(res.data.data);
    } catch (error) {
      console.error('Failed to load AI Coach data', error);
      toast.error('Failed to load your AI Coach dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e, overrideMsg) => {
    e?.preventDefault();
    const msg = overrideMsg || chatMessage;
    if (!msg.trim()) return;

    const userMsg = { role: 'user', text: msg };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await api.post('/provider/ai/ai-coach/chat', { message: msg });
      if (res.data?.success) {
        setChatHistory(prev => [...prev, { role: 'ai', text: res.data.data.message }]);
      }
    } catch (error) {
      toast.error('Failed to get AI response');
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I ran into an issue. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickChip = (text) => {
    handleChatSubmit(null, text);
  };

  const handleTaskToggle = async (idx) => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.map((t, i) =>
      i === idx ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    ));

    try {
      await api.post('/provider/ai/ai-coach/tasks/toggle', { taskIndex: idx });
    } catch (err) {
      toast.error('Failed to save task status');
      setTasks(prevTasks); // Revert on failure
    }
  };

  const handleTasksRefresh = async () => {
    setRefreshingTasks(true);
    toast('🎉 All tasks done! Loading fresh tasks...', { icon: '✅' });
    try {
      const res = await api.post('/provider/ai/ai-coach/tasks/refresh');
      if (res.data?.success) {
        setTasks(res.data.data.todaysTasks);
        toast.success('New tasks loaded!');
      }
    } catch {
      toast.error('Could not refresh tasks');
    } finally {
      setRefreshingTasks(false);
    }
  };

  const handleTaskStart = (task) => {
    if (task.type === 'resume') navigate('/provider/grow-with-ai');
    else if (task.type === 'job') navigate('/provider/jobs');
    else {
      // skill/other — pre-fill chat and go to overview
      setActiveTab('Overview');
      handleChatSubmit(null, `How can I improve my ${task.title.toLowerCase()}?`);
    }
  };

  const handleRecommendedAction = (rec) => {
    setActiveTab('Overview');
    setTimeout(() => {
      handleChatSubmit(null, `Tell me more about: ${rec.title}. ${rec.description}`);
    }, 100);
  };

  const handleGoalSave = async () => {
    if (!goalRole.trim() || !goalTimeline.trim()) {
      toast.error('Please fill in both fields');
      return;
    }
    setGoalLoading(true);
    try {
      const res = await api.post('/provider/ai/ai-coach/goal', { role: goalRole, timeline: goalTimeline });
      if (res.data?.success) {
        setData(prev => ({ ...prev, ...res.data.data }));
        setGoalModalOpen(false);
        toast.success('Goal updated! Your roadmap has been regenerated.');
      }
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setGoalLoading(false);
    }
  };

  const handleTipFeedback = async (helpful) => {
    if (tipFeedback) return;
    setTipFeedback(helpful ? 'up' : 'down');
    toast.success(helpful ? 'Glad it was helpful!' : 'Thanks for the feedback!');
    try {
      await api.post('/provider/ai/ai-coach/tip/feedback', { helpful });
    } catch { /* silent */ }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0f766e] border-t-transparent" />
        <p className="text-sm text-gray-500 font-medium">Your AI coach is preparing your dashboard...</p>
      </div>
    );
  }

  const { progressStats = {}, upcomingSessions = [], careerRoadmap = [], dailyTip = '', currentGoal = {}, recommended = [], milestones = [], aiInsights = [], skillsCount = 0 } = data;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  // ─── TAB CONTENT ──────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="xl:col-span-2 space-y-6">
      {/* AI Chat */}
      {/* AI Chat */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-5 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
          {/* Robot Image */}
          <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 flex items-center justify-center">
            <img src="/ai-robot-coach.png" alt="AI Coach" className="w-[120%] h-[120%] object-contain" />
          </div>
          
          {/* Header Text & Pills */}
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#1a1b41] flex items-center gap-2 mb-2">
              Hi {user?.name?.split(' ')[0] || 'Ananya'}! <span>👋</span>
            </h2>
            <p className="text-gray-500 text-xs md:text-sm font-medium mb-4">
              I'm your AI Career Coach. I'll help you take the right steps every day to reach your dream role.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {['Improve My Resume', 'Find Better Jobs', 'Prepare for Interview', 'Salary Negotiation Tips'].map((action, i) => (
                <button key={i} onClick={() => handleQuickChip(action)}
                  className="px-4 py-2 bg-white border border-gray-100 shadow-sm hover:border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-all">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="mb-4 space-y-3 max-h-52 overflow-y-auto pr-2">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium ${msg.role === 'user' ? 'bg-[#0d8765] text-white rounded-br-sm' : 'bg-[#f8f9fc] text-[#1a1b41] rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f8f9fc] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0d8765] border-t-transparent rounded-full animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleChatSubmit} className="relative mb-4">
          <input
            type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
            placeholder="Ask me anything about your career..."
            className="w-full pl-5 pr-14 py-3.5 rounded-2xl border border-gray-100 shadow-sm focus:border-[#0d8765] focus:ring-2 focus:ring-emerald-50 focus:outline-none text-sm font-medium transition-all"
            disabled={chatLoading}
          />
          <button type="submit" disabled={chatLoading || !chatMessage.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#0d8765] hover:bg-[#096c4f] text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 shadow-sm">
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Try asking Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-2">Try asking:</span>
          {['How can I improve my resume?', 'What skills should I learn?', 'How do I prepare for a UI/UX interview?'].map((action, i) => (
            <button key={i} onClick={() => { setChatMessage(action); handleChatSubmit({ preventDefault: () => {} }); }}
              className="px-3.5 py-1.5 bg-[#f4f5f8] hover:bg-gray-200 text-[#1a1b41] rounded-lg text-xs font-bold transition-colors">
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Plan Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold flex items-center gap-1.5">
            <Calendar className="w-6 h-6 text-indigo-500" /> Today's Plan
            <span className="text-sm font-semibold text-gray-400 ml-1">({completedCount}/{tasks.length})</span>
          </h3>
          <button onClick={() => setActiveTab('Daily Tasks')}
            className="text-sm font-bold text-[#0f766e] hover:text-teal-800 flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 3).map((task, idx) => (
            <TaskRow key={idx} task={task} idx={idx} onToggle={handleTaskToggle} onStart={handleTaskStart} />
          ))}
        </div>
      </div>

      {/* Goal Section */}
      <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-100 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-base font-bold flex items-center gap-1.5 mb-2">
              Your Career Goal <Target className="w-6 h-6 text-red-500" />
            </h3>
            <div className="flex flex-wrap gap-8 items-center">
              <div>
                <p className="text-base font-bold text-gray-500 uppercase tracking-wider">Target Role</p>
                <p className="font-extrabold text-[#0f766e] text-base">{currentGoal.role || '—'}</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-500 uppercase tracking-wider">Timeline</p>
                <p className="font-extrabold text-[#0f766e] text-base">{currentGoal.time || '—'}</p>
              </div>
              <button onClick={() => setGoalModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-teal-200 hover:border-[#0f766e] text-[#0f766e] font-bold text-sm rounded-lg transition-all">
                <Edit2 className="w-4 h-4" /> Update Goal
              </button>
            </div>
          </div>
          <div className="flex-1 sm:border-l border-teal-200/50 sm:pl-4 w-full">
            <p className="text-sm font-bold text-gray-900 mb-1">Next Milestone</p>
            <p className="text-base font-medium text-gray-600 line-clamp-2 mb-2">{currentGoal.currentMilestone}</p>
            <div className="h-1.5 w-full bg-teal-100/50 rounded-full overflow-hidden">
              <div className="h-full bg-[#0f766e] rounded-full transition-all" style={{ width: `${currentGoal.completion || 0}%` }} />
            </div>
            <p className="text-base font-bold text-gray-500 mt-1">{currentGoal.completion || 0}% Completed</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDailyTasks = () => (
    <div className="xl:col-span-2 space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold flex items-center gap-1.5">
            <Calendar className="w-6 h-6 text-indigo-500" /> All Tasks
            <span className="text-sm text-gray-400 font-semibold ml-1">({completedCount}/{tasks.length} done)</span>
          </h3>
          <button onClick={handleTasksRefresh} disabled={refreshingTasks}
            className="flex items-center gap-1 text-sm font-bold text-[#0f766e] hover:text-teal-800 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-5 h-5 ${refreshingTasks ? 'animate-spin' : ''}`} /> Refresh Tasks
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-[#0f766e] rounded-full transition-all duration-500" style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} />
        </div>
        <div className="space-y-2">
          {tasks.map((task, idx) => (
            <TaskRow key={idx} task={task} idx={idx} onToggle={handleTaskToggle} onStart={handleTaskStart} expanded />
          ))}
        </div>
        {tasks.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">No tasks yet. Loading...</p>
        )}
      </div>
    </div>
  );

  const renderCareerPlan = () => (
    <div className="xl:col-span-2 space-y-6">
      {/* Goal Card */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-bold flex items-center gap-1.5">
            <Target className="w-6 h-6 text-red-500" /> Current Goal
          </h3>
          <button onClick={() => setGoalModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-teal-200 hover:border-[#0f766e] text-[#0f766e] font-bold text-base rounded-lg transition-all">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="flex gap-6 mb-3">
          <div>
            <p className="text-base font-bold text-gray-500 uppercase">Target Role</p>
            <p className="font-extrabold text-[#0f766e] text-lg">{currentGoal.role}</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-500 uppercase">Timeline</p>
            <p className="font-extrabold text-[#0f766e] text-lg">{currentGoal.time}</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-500 uppercase">Progress</p>
            <p className="font-extrabold text-[#0f766e] text-lg">{currentGoal.completion || 0}%</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-medium">📌 {currentGoal.currentMilestone}</p>
      </div>

      {/* Full Roadmap */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold mb-4">Career Roadmap</h3>
        <div className="relative pl-5 space-y-6">
          <div className="absolute top-2 bottom-2 left-[18px] w-0.5 bg-gray-100" />
          {careerRoadmap.map((step, i) => (
            <div key={i} className="flex items-start justify-between relative z-10 pl-6">
              <div className={`absolute left-0 w-4 h-4 rounded-full border-2 mt-0.5 ${i === 0 ? 'border-[#0f766e] bg-[#0f766e]' : i === 1 ? 'border-indigo-400 bg-white' : 'border-gray-300 bg-white'}`} style={{ left: '5px' }} />
              <div>
                <p className={`font-bold text-sm ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</p>
                {step.timeframe && <p className="text-base text-gray-400">{step.timeframe}</p>}
              </div>
              <span className={`px-2 py-0.5 text-sm font-bold rounded-md shrink-0 ${step.status === 'Current' ? 'bg-teal-50 text-[#0f766e]' : step.status === 'Next Step' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold mb-3">Milestones</h3>
        <div className="space-y-2">
          {(milestones.length ? milestones : [
            { title: 'Profile Completed', done: true, date: '2 weeks ago' },
            { title: 'First Application', done: true, date: '1 week ago' },
            { title: 'Resume Optimized', done: false, date: 'In progress' },
            { title: 'First Interview', done: false, date: 'Upcoming' },
          ]).map((m, i) => (
            <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${m.done ? 'bg-teal-50/40 border-teal-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                {m.done ? <CheckCircle2 className="w-6 h-6 text-[#0f766e] shrink-0" /> : <Circle className="w-6 h-6 text-gray-300 shrink-0" />}
                <span className={`text-sm font-bold ${m.done ? 'text-[#0f766e]' : 'text-gray-600'}`}>{m.title}</span>
              </div>
              <span className="text-base font-semibold text-gray-400">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="xl:col-span-2 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-base font-bold mb-3 flex items-center gap-1.5"><BookOpen className="w-6 h-6 text-amber-500" /> Recommended for You</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommended.map((rec, idx) => (
            <div key={idx} className="p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-teal-100 transition-all cursor-pointer group"
              onClick={() => handleRecommendedAction(rec)}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-[#0f766e] shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{rec.title}</p>
                  <p className="text-base text-gray-500 line-clamp-2">{rec.description}</p>
                  <div className="flex items-center gap-1 text-[#0f766e] font-bold text-base mt-2">
                    {rec.actionText || 'Learn How'} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2 text-amber-800">
          <Sparkles className="w-5 h-5 text-amber-500" /> Daily Tip from AI Coach
        </h3>
        <p className="text-sm font-medium text-amber-900 leading-relaxed mb-3">
          {dailyTip || 'A strong portfolio with 3-4 case studies can increase your profile views by up to 60%.'}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-amber-200">
          <span className="text-base font-bold text-amber-700">Was this helpful?</span>
          <div className="flex items-center gap-1">
            <button onClick={() => handleTipFeedback(true)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'up' ? 'bg-teal-100 text-teal-700' : 'hover:bg-amber-100 text-amber-600'}`}>
              <ThumbsUp className="w-5 h-5" />
            </button>
            <button onClick={() => handleTipFeedback(false)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-amber-100 text-amber-600'}`}>
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="xl:col-span-2 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tasks Done', value: completedCount, icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, color: 'bg-green-50 border-green-100' },
          { label: 'Interviews', value: 0, icon: <Video className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
          { label: 'Skills', value: skillsCount, icon: <Award className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
          { label: 'Day Streak', value: 0, icon: <Clock className="w-6 h-6 text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} border rounded-2xl p-3 text-center`}>
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
            <p className="text-base font-bold text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold mb-4">Overall Career Progress</h3>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 shrink-0">
            <CircularProgressbar
              value={progressStats.percentage || 0}
              text={`${progressStats.percentage || 0}%`}
              styles={buildStyles({ pathColor: '#0f766e', textColor: '#0f766e', trailColor: '#f1f5f9', textSize: '26px' })}
              strokeWidth={12}
            />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900 mb-1">You're making great progress! 🚀</p>
            <p className="text-sm text-gray-500 mb-3">Keep completing daily tasks to boost your score.</p>
            <div className="space-y-2">
              {[
                { label: 'Profile Strength', val: 80 },
                { label: 'Activity Score', val: progressStats.percentage || 0 },
                { label: 'Goal Progress', val: currentGoal.completion || 0 },
              ].map((bar, i) => (
                <div key={i}>
                  <div className="flex justify-between text-base font-bold text-gray-500 mb-0.5">
                    <span>{bar.label}</span><span>{bar.val}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0f766e] rounded-full" style={{ width: `${bar.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold mb-3 flex items-center gap-1.5 text-indigo-900">
            <Sparkles className="w-6 h-6 text-indigo-500" /> AI Coach Insights
          </h3>
          <div className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 bg-white/60 p-3 rounded-xl border border-indigo-50/50">
                <div className="shrink-0 mt-0.5">
                  {insight.type === 'strength' && <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>}
                  {insight.type === 'improvement' && <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center"><Target className="w-4 h-4 text-orange-600" /></div>}
                  {insight.type === 'opportunity' && <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center"><Sparkles className="w-4 h-4 text-purple-600" /></div>}
                </div>
                <div>
                  <p className="text-base font-bold uppercase tracking-wider mb-0.5 text-indigo-500">{insight.type}</p>
                  <p className="text-sm font-medium text-indigo-950">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks Progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold mb-3">Today's Tasks</h3>
        <div className="space-y-2">
          {tasks.map((task, idx) => (
            <TaskRow key={idx} task={task} idx={idx} onToggle={handleTaskToggle} onStart={handleTaskStart} />
          ))}
        </div>
      </div>
    </div>
  );

  // ─── SIDEBAR ──────────────────────────────────────────────────────────────

  const renderSidebar = () => (
    <div className="space-y-6">
      {/* Coach Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold mb-3">Coach Summary</h3>
        <div className="flex items-center gap-8 mb-4">
          <div className="w-16 h-16 shrink-0">
            <CircularProgressbar
              value={progressStats.percentage || 0}
              text={`${progressStats.percentage || 0}%`}
              styles={buildStyles({ pathColor: '#0f766e', textColor: '#0f766e', trailColor: '#f1f5f9', textSize: '28px' })}
              strokeWidth={12}
            />
          </div>
          <div>
            <h4 className="font-bold text-[#0f766e] text-sm">Overall Progress</h4>
            <p className="text-base text-gray-500 leading-tight">You're on the right track!</p>
            <button onClick={() => setActiveTab('Progress')}
              className="text-base font-bold text-[#0f766e] flex items-center gap-0.5 mt-1">
              View Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>



      {/* Career Roadmap (sidebar) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold">Career Roadmap</h3>
          <button onClick={() => { setActiveTab('Career Plan'); setFullPlanModalOpen(true); }} className="text-sm font-bold text-[#0f766e] flex items-center gap-1">
            Full Plan <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="relative pl-3 space-y-3">
          <div className="absolute top-2 bottom-2 left-[17px] w-0.5 bg-gray-100" />
          {careerRoadmap.map((step, i) => (
            <div key={i} className="flex items-center justify-between relative z-10 pl-7">
              <div className={`absolute w-4 h-4 rounded-full border-2 bg-white ${i === 0 ? 'border-[#0f766e] bg-[#0f766e]' : 'border-gray-300'}`} style={{ left: '3.5px' }} />
              <span className={`font-bold text-sm ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</span>
              <span className={`px-2 py-0.5 text-sm font-bold rounded-md ${step.status === 'Current' ? 'bg-teal-50 text-[#0f766e]' : step.status === 'Next Step' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                {step.status === 'Future' ? step.timeframe : step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Daily Tip
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">{dailyTip}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-base font-bold text-gray-500">Helpful?</span>
          <div className="flex gap-1">
            <button onClick={() => handleTipFeedback(true)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'up' ? 'bg-teal-100 text-teal-700' : 'text-gray-400 hover:bg-gray-100'}`}>
              <ThumbsUp className="w-5 h-5" />
            </button>
            <button onClick={() => handleTipFeedback(false)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}>
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  
  const recommendedData = {
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
              className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap border transition-colors ${activeRecTab === tab ? 'bg-emerald-50 text-[#0f766e] border-emerald-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendedData[activeRecTab]?.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.bg}`}>
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
          <button onClick={() => setGoalModalOpen(true)} className="px-5 py-2.5 rounded-xl border-2 border-[#0f766e] text-[#0f766e] font-bold text-sm hover:bg-teal-50 transition-colors ml-auto sm:ml-0 bg-white shadow-sm">
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


  // ─── MAIN RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 w-full bg-white min-h-screen font-sans text-gray-900 pb-16">

      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">AI Career Coach</h1>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Your personal AI coach to help you grow and land your dream role.</p>
          </div>
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 font-semibold text-sm transition-colors shadow-sm">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-3 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-[#0f766e] border-b-2 border-[#0f766e] -mb-[1px]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Daily Tasks' && renderDailyTasks()}
        {activeTab === 'Career Plan' && renderCareerPlan()}
        {activeTab === 'Resources' && renderResources()}
        {activeTab === 'Progress' && renderProgress()}
        {renderSidebar()}
      </div>

      {renderRecommended()}
      {renderGoalBanner()}

      {/* Goal Update Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setGoalModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Target className="w-6 h-6 text-red-500" /> Update Your Goal</h3>
              <button onClick={() => setGoalModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1">Target Role</label>
                <input value={goalRole} onChange={e => setGoalRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Developer"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base focus:border-[#0f766e] focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1">Timeline</label>
                <select value={goalTimeline} onChange={e => setGoalTimeline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base focus:border-[#0f766e] focus:outline-none">
                  <option value="">Select timeline...</option>
                  {['6 Months', '1 Year', '1.5 Years', '2 Years', '3 Years', '5 Years'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleGoalSave} disabled={goalLoading}
              className="w-full mt-4 py-2.5 bg-[#0f766e] hover:bg-teal-800 text-white font-bold text-base rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {goalLoading ? <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Check className="w-6 h-6" /> Save & Regenerate Roadmap</>}
            </button>
          </div>
        </div>
      )}

      {/* Full Plan Modal */}
      {fullPlanModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={() => setFullPlanModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-gray-900">Full Career Plan</h3>
              <button onClick={() => setFullPlanModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            {renderCareerPlan()}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-end" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white h-full sm:h-auto sm:rounded-2xl shadow-2xl p-6 w-full max-w-xs sm:mr-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="w-6 h-6" /> Coach Settings</h3>
              <button onClick={() => setSettingsOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Current Goal</p>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-sm">
                  <p className="font-bold text-teal-800">{currentGoal.role || 'Not set'}</p>
                  <p className="text-teal-600">{currentGoal.time || ''}</p>
                </div>
              </div>
              <button onClick={() => { setSettingsOpen(false); setGoalModalOpen(true); }}
                className="w-full py-2 border-2 border-[#0f766e] text-[#0f766e] font-bold text-base rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
                <Edit2 className="w-5 h-5" /> Update Career Goal
              </button>
              <button onClick={() => { setSettingsOpen(false); fetchDashboardData(); toast.success('Dashboard refreshed!'); }}
                className="w-full py-2 border border-gray-200 text-gray-600 font-bold text-base rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" /> Refresh Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TASK ROW COMPONENT ───────────────────────────────────────────────────
function TaskRow({ task, idx, onToggle, onStart, expanded }) {
  return (
    <div className={`flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors group ${task.status === 'completed' ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => onToggle(idx)} className="text-gray-300 hover:text-[#0f766e] transition-colors shrink-0">
          {task.status === 'completed'
            ? <CheckCircle2 className="w-5 h-5 text-[#0f766e]" />
            : <Circle className="w-5 h-5" />}
        </button>
        <div className={`p-1 rounded-md shrink-0 ${task.type === 'resume' ? 'bg-purple-100 text-purple-600' : task.type === 'job' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
          {task.type === 'resume' ? <FileText className="w-4 h-4" /> : task.type === 'job' ? <Briefcase className="w-4 h-4" /> : <Award className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
          {expanded && <p className="text-base text-gray-500 truncate">{task.description}</p>}
        </div>
      </div>
      {task.status === 'completed'
        ? <span className="px-2 py-0.5 bg-teal-50 text-[#0f766e] font-bold text-base rounded-lg shrink-0 ml-2">Done</span>
        : <button onClick={() => onToggle(idx)} className="ml-2 px-3 py-1 bg-white border border-gray-200 group-hover:border-[#0f766e] text-gray-700 group-hover:text-[#0f766e] font-bold text-base rounded-lg transition-all shrink-0">Finish</button>
      }
    </div>
  );
}
