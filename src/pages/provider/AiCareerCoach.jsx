import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Settings, Send, CheckCircle2, Circle,
  Calendar, Video, FileText, Target, X,
  ThumbsUp, ThumbsDown, Bot, Sparkles, Briefcase,
  TrendingUp, Award, Clock, RefreshCw, ChevronRight,
  BarChart2, BookOpen, Layers, Edit2, Check
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
  const [goalRole, setGoalRole] = useState('');
  const [goalTimeline, setGoalTimeline] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
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
        <p className="text-xs text-gray-500 font-medium">Your AI coach is preparing your dashboard...</p>
      </div>
    );
  }

  const { progressStats = {}, upcomingSessions = [], careerRoadmap = [], dailyTip = '', currentGoal = {}, recommended = [], milestones = [], aiInsights = [], skillsCount = 0 } = data;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  // ─── TAB CONTENT ──────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="xl:col-span-2 space-y-4">
      {/* AI Chat */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
            <Bot className="w-6 h-6 text-[#0f766e]" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              Hi {user?.name?.split(' ')[0] || 'there'}! <span>👋</span>
            </h2>
            <p className="text-gray-500 text-xs font-medium">Ask me anything about your career journey.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {['Improve My Resume', 'Find Better Jobs', 'Prepare for Interview', 'Salary Tips'].map((action, i) => (
            <button key={i} onClick={() => handleQuickChip(action)}
              className="px-3 py-1 bg-white border border-gray-200 hover:border-[#0f766e] hover:text-[#0f766e] hover:bg-teal-50/50 rounded-full text-xs font-bold transition-all">
              {action}
            </button>
          ))}
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="mb-3 space-y-2 max-h-52 overflow-y-auto pr-1">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs font-medium ${msg.role === 'user' ? 'bg-[#0f766e] text-white' : 'bg-gray-50 border border-gray-100 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-xs text-gray-500 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#0f766e] border-t-transparent rounded-full animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <form onSubmit={handleChatSubmit} className="relative">
          <input
            type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
            placeholder="Ask me anything about your career..."
            className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 focus:border-[#0f766e] focus:outline-none text-xs font-medium transition-all"
            disabled={chatLoading}
          />
          <button type="submit" disabled={chatLoading || !chatMessage.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[#0f766e] hover:bg-teal-800 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Today's Plan Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" /> Today's Plan
            <span className="text-xs font-semibold text-gray-400 ml-1">({completedCount}/{tasks.length})</span>
          </h3>
          <button onClick={() => setActiveTab('Daily Tasks')}
            className="text-xs font-bold text-[#0f766e] hover:text-teal-800 flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-3 h-3" />
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2">
              Your Career Goal <Target className="w-4 h-4 text-red-500" />
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target Role</p>
                <p className="font-extrabold text-[#0f766e] text-sm">{currentGoal.role || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timeline</p>
                <p className="font-extrabold text-[#0f766e] text-sm">{currentGoal.time || '—'}</p>
              </div>
              <button onClick={() => setGoalModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-teal-200 hover:border-[#0f766e] text-[#0f766e] font-bold text-xs rounded-lg transition-all">
                <Edit2 className="w-3 h-3" /> Update Goal
              </button>
            </div>
          </div>
          <div className="flex-1 sm:border-l border-teal-200/50 sm:pl-4 w-full">
            <p className="text-xs font-bold text-gray-900 mb-1">Next Milestone</p>
            <p className="text-[10px] font-medium text-gray-600 line-clamp-2 mb-2">{currentGoal.currentMilestone}</p>
            <div className="h-1.5 w-full bg-teal-100/50 rounded-full overflow-hidden">
              <div className="h-full bg-[#0f766e] rounded-full transition-all" style={{ width: `${currentGoal.completion || 0}%` }} />
            </div>
            <p className="text-[10px] font-bold text-gray-500 mt-1">{currentGoal.completion || 0}% Completed</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDailyTasks = () => (
    <div className="xl:col-span-2 space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" /> All Tasks
            <span className="text-xs text-gray-400 font-semibold ml-1">({completedCount}/{tasks.length} done)</span>
          </h3>
          <button onClick={handleTasksRefresh} disabled={refreshingTasks}
            className="flex items-center gap-1 text-xs font-bold text-[#0f766e] hover:text-teal-800 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingTasks ? 'animate-spin' : ''}`} /> Refresh Tasks
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
          <p className="text-center text-xs text-gray-400 py-6">No tasks yet. Loading...</p>
        )}
      </div>
    </div>
  );

  const renderCareerPlan = () => (
    <div className="xl:col-span-2 space-y-4">
      {/* Goal Card */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Target className="w-4 h-4 text-red-500" /> Current Goal
          </h3>
          <button onClick={() => setGoalModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-teal-200 hover:border-[#0f766e] text-[#0f766e] font-bold text-[10px] rounded-lg transition-all">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>
        <div className="flex gap-6 mb-3">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Target Role</p>
            <p className="font-extrabold text-[#0f766e] text-base">{currentGoal.role}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Timeline</p>
            <p className="font-extrabold text-[#0f766e] text-base">{currentGoal.time}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Progress</p>
            <p className="font-extrabold text-[#0f766e] text-base">{currentGoal.completion || 0}%</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 font-medium">📌 {currentGoal.currentMilestone}</p>
      </div>

      {/* Full Roadmap */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-4">Career Roadmap</h3>
        <div className="relative pl-5 space-y-4">
          <div className="absolute top-2 bottom-2 left-[18px] w-0.5 bg-gray-100" />
          {careerRoadmap.map((step, i) => (
            <div key={i} className="flex items-start justify-between relative z-10 pl-6">
              <div className={`absolute left-0 w-3 h-3 rounded-full border-2 mt-0.5 ${i === 0 ? 'border-[#0f766e] bg-[#0f766e]' : i === 1 ? 'border-indigo-400 bg-white' : 'border-gray-300 bg-white'}`} style={{ left: '5px' }} />
              <div>
                <p className={`font-bold text-xs ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</p>
                {step.timeframe && <p className="text-[10px] text-gray-400">{step.timeframe}</p>}
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md shrink-0 ${step.status === 'Current' ? 'bg-teal-50 text-[#0f766e]' : step.status === 'Next Step' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-3">Milestones</h3>
        <div className="space-y-2">
          {(milestones.length ? milestones : [
            { title: 'Profile Completed', done: true, date: '2 weeks ago' },
            { title: 'First Application', done: true, date: '1 week ago' },
            { title: 'Resume Optimized', done: false, date: 'In progress' },
            { title: 'First Interview', done: false, date: 'Upcoming' },
          ]).map((m, i) => (
            <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${m.done ? 'bg-teal-50/40 border-teal-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                {m.done ? <CheckCircle2 className="w-4 h-4 text-[#0f766e] shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                <span className={`text-xs font-bold ${m.done ? 'text-[#0f766e]' : 'text-gray-600'}`}>{m.title}</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="xl:col-span-2 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-amber-500" /> Recommended for You</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommended.map((rec, idx) => (
            <div key={idx} className="p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-teal-100 transition-all cursor-pointer group"
              onClick={() => handleRecommendedAction(rec)}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-[#0f766e] shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-tight mb-1">{rec.title}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{rec.description}</p>
                  <div className="flex items-center gap-1 text-[#0f766e] font-bold text-[10px] mt-2">
                    {rec.actionText || 'Learn How'} <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2 text-amber-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Daily Tip from AI Coach
        </h3>
        <p className="text-xs font-medium text-amber-900 leading-relaxed mb-3">
          {dailyTip || 'A strong portfolio with 3-4 case studies can increase your profile views by up to 60%.'}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-amber-200">
          <span className="text-[10px] font-bold text-amber-700">Was this helpful?</span>
          <div className="flex items-center gap-1">
            <button onClick={() => handleTipFeedback(true)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'up' ? 'bg-teal-100 text-teal-700' : 'hover:bg-amber-100 text-amber-600'}`}>
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleTipFeedback(false)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-amber-100 text-amber-600'}`}>
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="xl:col-span-2 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tasks Done', value: completedCount, icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, color: 'bg-green-50 border-green-100' },
          { label: 'Interviews', value: 0, icon: <Video className="w-4 h-4 text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
          { label: 'Skills', value: skillsCount, icon: <Award className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
          { label: 'Day Streak', value: 0, icon: <Clock className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} border rounded-2xl p-3 text-center`}>
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
            <p className="text-[10px] font-bold text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-4">Overall Career Progress</h3>
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
            <p className="text-sm font-bold text-gray-900 mb-1">You're making great progress! 🚀</p>
            <p className="text-xs text-gray-500 mb-3">Keep completing daily tasks to boost your score.</p>
            <div className="space-y-2">
              {[
                { label: 'Profile Strength', val: 80 },
                { label: 'Activity Score', val: progressStats.percentage || 0 },
                { label: 'Goal Progress', val: currentGoal.completion || 0 },
              ].map((bar, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-0.5">
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
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5 text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-500" /> AI Coach Insights
          </h3>
          <div className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 bg-white/60 p-3 rounded-xl border border-indigo-50/50">
                <div className="shrink-0 mt-0.5">
                  {insight.type === 'strength' && <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-green-600" /></div>}
                  {insight.type === 'improvement' && <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center"><Target className="w-3 h-3 text-orange-600" /></div>}
                  {insight.type === 'opportunity' && <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center"><Sparkles className="w-3 h-3 text-purple-600" /></div>}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-indigo-500">{insight.type}</p>
                  <p className="text-xs font-medium text-indigo-950">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks Progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-3">Today's Tasks</h3>
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
    <div className="space-y-4">
      {/* Coach Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-3">Coach Summary</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 shrink-0">
            <CircularProgressbar
              value={progressStats.percentage || 0}
              text={`${progressStats.percentage || 0}%`}
              styles={buildStyles({ pathColor: '#0f766e', textColor: '#0f766e', trailColor: '#f1f5f9', textSize: '28px' })}
              strokeWidth={12}
            />
          </div>
          <div>
            <h4 className="font-bold text-[#0f766e] text-xs">Overall Progress</h4>
            <p className="text-[10px] text-gray-500 leading-tight">You're on the right track!</p>
            <button onClick={() => setActiveTab('Progress')}
              className="text-[10px] font-bold text-[#0f766e] flex items-center gap-0.5 mt-1">
              View Details <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { v: progressStats.tasksCompleted || 0, l: 'Tasks', icon: <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-0.5" /> },
            { v: progressStats.interviewsPracticed || 0, l: 'Interviews', icon: <Video className="w-4 h-4 text-purple-500 mx-auto mb-0.5" /> },
            { v: progressStats.skillsImproved || 0, l: 'Skills', icon: <Award className="w-4 h-4 text-blue-500 mx-auto mb-0.5" /> },
            { v: progressStats.streakDays || 0, l: 'Streak', icon: <Clock className="w-4 h-4 text-orange-500 mx-auto mb-0.5" /> },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              {s.icon}
              <span className="text-base font-extrabold text-gray-900">{s.v}</span>
              <span className="text-[9px] font-bold text-gray-500">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold">Upcoming Sessions</h3>
          <button onClick={() => setShowCalendar(v => !v)}
            className="text-xs font-bold text-[#0f766e] flex items-center gap-1 hover:text-teal-800">
            {showCalendar ? 'Hide' : 'Calendar'} <Calendar className="w-3 h-3" />
          </button>
        </div>

        {showCalendar && (
          <div className="mb-3 p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs">
            <p className="font-bold text-teal-800 mb-2">July 2026</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500">
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
              {Array.from({length: 31}, (_, i) => (
                <button key={i}
                  className={`aspect-square flex items-center justify-center rounded-md text-[10px] font-bold
                    ${[18, 20].includes(i+1) ? 'bg-[#0f766e] text-white' : 'hover:bg-teal-100 text-gray-700'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-teal-700 mt-2 font-medium">🟢 Sessions on 18th & 20th</p>
          </div>
        )}

        <div className="space-y-2">
          {upcomingSessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg text-indigo-500 border border-gray-100">
                  {session.title?.toLowerCase().includes('interview') ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 leading-tight">{session.title}</h4>
                  <p className="text-[10px] text-gray-500">{session.date}</p>
                </div>
              </div>
              <button
                onClick={() => toast('Feature Coming Soon! 🚀')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${i === 0 ? 'border border-[#0f766e] text-[#0f766e] hover:bg-teal-50' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {i === 0 ? 'Join' : 'Later'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Career Roadmap (sidebar) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold">Career Roadmap</h3>
          <button onClick={() => setActiveTab('Career Plan')} className="text-xs font-bold text-[#0f766e] flex items-center gap-1">
            Full Plan <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="relative pl-3 space-y-3">
          <div className="absolute top-2 bottom-2 left-[17px] w-0.5 bg-gray-100" />
          {careerRoadmap.map((step, i) => (
            <div key={i} className="flex items-center justify-between relative z-10 pl-7">
              <div className={`absolute w-2.5 h-2.5 rounded-full border-2 bg-white ${i === 0 ? 'border-[#0f766e] bg-[#0f766e]' : 'border-gray-300'}`} style={{ left: '3.5px' }} />
              <span className={`font-bold text-xs ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${step.status === 'Current' ? 'bg-teal-50 text-[#0f766e]' : step.status === 'Next Step' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                {step.status === 'Future' ? step.timeframe : step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Daily Tip
        </h3>
        <p className="text-xs text-gray-700 leading-relaxed mb-3">{dailyTip}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-500">Helpful?</span>
          <div className="flex gap-1">
            <button onClick={() => handleTipFeedback(true)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'up' ? 'bg-teal-100 text-teal-700' : 'text-gray-400 hover:bg-gray-100'}`}>
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleTipFeedback(false)}
              className={`p-1.5 rounded-lg transition-colors ${tipFeedback === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}>
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-3 md:p-4 w-full bg-white min-h-screen font-sans text-gray-900 pb-16">

      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">AI Career Coach</h1>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">Your personal AI coach to help you grow and land your dream role.</p>
          </div>
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 font-semibold text-xs transition-colors shadow-sm">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-3 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-2 text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-[#0f766e] border-b-2 border-[#0f766e] -mb-[1px]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Daily Tasks' && renderDailyTasks()}
        {activeTab === 'Career Plan' && renderCareerPlan()}
        {activeTab === 'Resources' && renderResources()}
        {activeTab === 'Progress' && renderProgress()}
        {renderSidebar()}
      </div>

      {/* Goal Update Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setGoalModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2"><Target className="w-4 h-4 text-red-500" /> Update Your Goal</h3>
              <button onClick={() => setGoalModalOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Target Role</label>
                <input value={goalRole} onChange={e => setGoalRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Developer"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#0f766e] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Timeline</label>
                <select value={goalTimeline} onChange={e => setGoalTimeline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#0f766e] focus:outline-none">
                  <option value="">Select timeline...</option>
                  {['6 Months', '1 Year', '1.5 Years', '2 Years', '3 Years', '5 Years'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleGoalSave} disabled={goalLoading}
              className="w-full mt-4 py-2.5 bg-[#0f766e] hover:bg-teal-800 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {goalLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Check className="w-4 h-4" /> Save & Regenerate Roadmap</>}
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-end" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white h-full sm:h-auto sm:rounded-2xl shadow-2xl p-6 w-full max-w-xs sm:mr-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Coach Settings</h3>
              <button onClick={() => setSettingsOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Current Goal</p>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs">
                  <p className="font-bold text-teal-800">{currentGoal.role || 'Not set'}</p>
                  <p className="text-teal-600">{currentGoal.time || ''}</p>
                </div>
              </div>
              <button onClick={() => { setSettingsOpen(false); setGoalModalOpen(true); }}
                className="w-full py-2 border-2 border-[#0f766e] text-[#0f766e] font-bold text-sm rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
                <Edit2 className="w-3.5 h-3.5" /> Update Career Goal
              </button>
              <button onClick={() => { setSettingsOpen(false); fetchDashboardData(); toast.success('Dashboard refreshed!'); }}
                className="w-full py-2 border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
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
          {task.type === 'resume' ? <FileText className="w-3 h-3" /> : task.type === 'job' ? <Briefcase className="w-3 h-3" /> : <Award className="w-3 h-3" />}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-xs truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
          {expanded && <p className="text-[10px] text-gray-500 truncate">{task.description}</p>}
        </div>
      </div>
      {task.status === 'completed'
        ? <span className="px-2 py-0.5 bg-teal-50 text-[#0f766e] font-bold text-[10px] rounded-lg shrink-0 ml-2">Done</span>
        : <button onClick={() => onToggle(idx)} className="ml-2 px-3 py-1 bg-white border border-gray-200 group-hover:border-[#0f766e] text-gray-700 group-hover:text-[#0f766e] font-bold text-[10px] rounded-lg transition-all shrink-0">Finish</button>
      }
    </div>
  );
}
