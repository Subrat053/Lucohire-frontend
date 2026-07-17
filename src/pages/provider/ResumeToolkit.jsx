import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  ArrowLeft, RefreshCw, Upload, CheckCircle2, FileText, Layout,
  Link2, Download, Edit, Zap, ShieldCheck, MoreVertical, Info,
  Star, PenTool, Check, Eye
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { getResumeToolkit } from '../../services/providerAIService';
import { getCurrentSubscription } from '../../services/providerPlanService';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResumeToolkit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [profile, setProfile] = useState(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [missingData, setMissingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch whenever profile is saved (same trigger as GrowWithAI)
  const fileHash = location.state?.fileHash || localStorage.getItem('lastResumeHash');

  useEffect(() => { fetchAll(false); }, [fileHash]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
    toast.success(t('AI analysis refreshed'));
  };

  const fetchAll = async (force = false) => {
    try {
      setLoading(true);
      const [toolkitRes, planRes, profileRes] = await Promise.allSettled([
        getResumeToolkit(force),
        getCurrentSubscription(),
        providerAPI.getProfile(),
      ]);

      if (toolkitRes.status === 'fulfilled' && toolkitRes.value?.data?.data) {
        setData(toolkitRes.value.data.data);
        setMissingData(false);
      } else if (
        toolkitRes.status === 'rejected' ||
        toolkitRes.value?.data?.code === 'REQUIRED_DATA_MISSING' ||
        !toolkitRes.value?.data?.success
      ) {
        // Backend says profile/resume is incomplete — show prompt
        setMissingData(true);
        setData(fallback());
      } else {
        setData(fallback());
      }

      if (planRes.status === 'fulfilled') {
        const tier = planRes.value?.plan || planRes.value?.subscription?.tier || 'free';
        setIsPro(['pro', 'premium', 'beta'].includes(String(tier).toLowerCase()));
      }

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value?.data?.data || profileRes.value?.data || null;
        setProfile(p);
        setWhatsappEnabled(!!(p?.whatsappAlerts));
      }
    } catch (err) {
      console.error('ResumeToolkit fetch error', err);
      setData(fallback());
    } finally {
      setLoading(false);
    }
  };

  function fallback() {
    return {
      resumeScore: { overall: 0, content: 0, structure: 0, ats: 0 },
      profileCompletion: 0,
      aiSuggestions: [],
      resumeStats: { atsScore: 0, readability: 'N/A', sections: '0/10', keywords: '0/24' },
    };
  }

  const handleEnableWhatsApp = async () => {
    const phone = profile?.whatsappNumber || profile?.phone;
    if (!phone) {
      toast.error(t('Please add a WhatsApp number in your profile first'));
      navigate('/provider/profile');
      return;
    }
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(t('Hi! I want to enable resume & job updates on WhatsApp.'))}`, '_blank');
    setWhatsappEnabled(true);
  };

  const handleOpenWhatsAppHelp = () => {
    const phone = profile?.whatsappNumber || profile?.phone || '';
    const cleaned = phone.replace(/\D/g, '');
    const supportNumber = cleaned || '919999999999';
    window.open(`https://wa.me/${supportNumber}?text=${encodeURIComponent(t('Hi! I need career help.'))}`, '_blank');
  };

  const handleDownloadResume = () => {
    const url = profile?.resumeApproval?.pendingUrl || profile?.resumeUrl;
    if (!url) { toast.error(t('No resume uploaded yet')); return; }
    window.open(url, '_blank');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { resumeScore, profileCompletion, aiSuggestions, resumeStats } = data;

  const resumeUrl = profile?.resumeApproval?.pendingUrl || profile?.resumeUrl || null;
  const resumeFileName = profile?.resumeFileName || (resumeUrl ? resumeUrl.split('/').pop() : null);
  const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.name || 'Your Resume';
  const updatedAt = profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not uploaded';

  // Profile completion checklist derived from actual profile data
  const profileCheckList = [
    { label: 'Basic Information', done: !!(profile?.firstName && profile?.phone) },
    { label: 'Work Experience', done: !!(profile?.experience?.length > 0 || profile?.workExperience?.length > 0) },
    { label: 'Skills', done: !!(profile?.skills?.length > 0) },
    { label: 'Education', done: !!(profile?.education?.length > 0) },
    { label: 'Resume', done: !!resumeUrl },
    { label: 'Career Goals', done: !!(profile?.desiredRole || profile?.careerGoal) },
  ];

  const completedCount = profileCheckList.filter(i => i.done).length;
  const dynamicCompletion = Math.round((completedCount / profileCheckList.length) * 100);

  const resumeTools = [
    { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50', title: 'AI Resume Optimizer', desc: 'Get AI suggestions to improve content, keywords & impact.', btn: 'Optimize Now', pro: false, action: () => navigate('/provider/grow-with-ai') },
    { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', title: 'ATS Check', desc: 'Check how well your resume passes ATS systems.', btn: 'Check ATS Score', pro: false, action: () => navigate('/provider/grow-with-ai') },
    { icon: Link2, color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Keyword Match', desc: 'See missing keywords for your target roles.', btn: 'Analyze Keywords', pro: true, action: () => navigate('/provider/grow-with-ai') },
    { icon: Layout, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Resume Templates', desc: 'Professional templates trusted by recruiters.', btn: 'Browse Templates', pro: false, action: () => navigate('/provider/profile?tab=Generate+Resume') },
    { icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50', title: 'Resume Builder', desc: 'Create a new resume step by step.', btn: 'Build New', pro: false, action: () => navigate('/provider/profile?tab=Generate+Resume') },
  ];

  const contentTools = [
    { icon: PenTool, color: 'text-purple-600', title: 'About Me Generator', desc: 'Generate a professional summary for your profile.', btn: 'Generate Now', action: () => navigate('/provider/grow-with-ai') },
    { icon: FileText, color: 'text-blue-600', title: 'Cover Letter Builder', desc: 'Create a tailored cover letter for any job.', btn: 'Create Letter', action: () => navigate('/provider/grow-with-ai') },
    { icon: Edit, color: 'text-emerald-600', title: 'Experience Rewriter', desc: 'Make your experience more impactful with AI.', btn: 'Rewrite Now', action: () => navigate('/provider/grow-with-ai') },
    { icon: Star, color: 'text-orange-500', title: 'Achievements Optimizer', desc: 'Add strong achievements that get you noticed.', btn: 'Add Achievements', action: () => navigate('/provider/profile?tab=Details') },
    { icon: Link2, color: 'text-teal-600', title: 'Portfolio Link', desc: 'Add your portfolio to stand out.', btn: 'Add Portfolio', action: () => navigate('/provider/profile?tab=Portfolio') },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/provider/ai-tips')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition mb-2 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> {t('Back to AI Dashboard')}
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">{t('Resume & Profile Toolkit')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Build a stronger profile that gets you more interviews')}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition flex items-center gap-2 shadow-md disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('Analyzing...') : t('Refresh AI Analysis')}
        </button>
      </div>

      {/* Missing data banner */}
      {missingData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">{t('Complete your profile to unlock AI analysis')}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('Add your skills, experience, and upload a resume so our AI can generate personalized scores and suggestions.')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/provider/profile?tab=Resume')}
            className="shrink-0 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition"
          >
            {t('Complete Profile')} →
          </button>
        </div>
      )}

      {/* ── Row 1: Score / Completion / AI Suggestions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Resume Score */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-sm font-bold text-gray-900">{t('Resume Score')}</h2>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-28 shrink-0">
              <CircularProgressbar
                value={resumeScore.overall}
                text={`${resumeScore.overall}%`}
                styles={buildStyles({ pathColor: '#0f766e', textColor: '#0f766e', trailColor: '#f1f5f9', textSize: '22px', pathTransitionDuration: 1.5 })}
              />
              <p className="text-center text-xs font-bold text-teal-700 mt-1">
                {resumeScore.overall >= 80 ? t('Very Good') : resumeScore.overall >= 50 ? t('Average') : t('Needs Work')}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{t('Improve the areas below to make it excellent.')}</p>
              {[['Content', resumeScore.content], ['Structure', resumeScore.structure], ['ATS Readability', resumeScore.ats]].map(([label, val]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700 w-24 shrink-0">{t(label)}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-8 text-right">{val}%</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/provider/grow-with-ai')}
            className="mt-auto w-full py-2.5 rounded-xl border border-gray-100 text-teal-700 text-sm font-bold hover:bg-teal-50 transition"
          >
            {t('View Detailed Analysis')} →
          </button>
        </div>

        {/* Profile Completion — dynamic from real profile */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-sm font-bold text-gray-900">{t('Profile Completion')}</h2>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-28 shrink-0">
              <CircularProgressbar
                value={dynamicCompletion}
                text={`${dynamicCompletion}%`}
                styles={buildStyles({ pathColor: '#0f766e', textColor: '#0f766e', trailColor: '#f1f5f9', textSize: '22px', pathTransitionDuration: 1.5 })}
              />
              <p className="text-center text-xs font-bold text-teal-700 mt-1">
                {dynamicCompletion === 100 ? t('Complete') : dynamicCompletion >= 67 ? t('Almost Complete') : t('In Progress')}
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {profileCheckList.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{t(item.label)}</span>
                  {item.done
                    ? <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/provider/profile')}
            className="mt-auto w-full py-2.5 rounded-xl border border-gray-100 text-teal-700 text-sm font-bold hover:bg-teal-50 transition"
          >
            {t('Complete Profile')} →
          </button>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">{t('AI Suggestions for You')}</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            {data?.targetRole
              ? `${t('Based on your target role')}: ${data.targetRole}`
              : profile?.desiredRole
              ? `${t('Based on your target role')}: ${profile.desiredRole}`
              : t('Based on your profile')}
          </p>
          <div className="space-y-3 mb-5 flex-1">
            {aiSuggestions.length > 0 ? aiSuggestions.map((sug, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-blue-50 p-3 rounded-2xl border border-blue-100">
                <div className="w-8 h-8 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">{t(sug.title)}</h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${sug.impact === 'High Impact' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t(sug.impact)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">{t(sug.metric)}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400 italic">{t('No suggestions yet. Upload your resume to get started.')}</p>
            )}
          </div>
          <button
            onClick={() => navigate('/provider/grow-with-ai')}
            className="mt-auto w-full py-2.5 rounded-xl border border-gray-100 text-teal-700 text-sm font-bold hover:bg-teal-50 transition"
          >
            {t('Apply All Suggestions')} →
          </button>
        </div>
      </div>

      {/* ── Row 2: Enhance Tools + WhatsApp ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h3 className="text-base font-bold text-gray-900 mb-4">{t('Enhance Your Resume')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {resumeTools.map((tool, idx) => {
              const locked = tool.pro && !isPro;
              return (
                <div key={idx} className={`bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col transition hover:shadow-md ${locked ? 'opacity-70' : ''}`}>
                  <div className={`w-9 h-9 rounded-2xl ${tool.bg} flex items-center justify-center mb-3`}>
                    <tool.icon className={`w-4 h-4 ${tool.color}`} />
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">{t(tool.title)}</h4>
                    {locked && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold ml-1">PRO</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 mb-4 flex-1">{t(tool.desc)}</p>
                  <button
                    className={`text-xs font-bold flex items-center gap-1 ${locked ? 'text-amber-600 hover:text-amber-800' : 'text-teal-700 hover:text-teal-900'} transition`}
                    onClick={() => locked ? navigate('/provider/my-plan') : tool.action()}
                  >
                    {locked ? t('Upgrade to Pro') : t(tool.btn)} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Updates — functional */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <FaWhatsapp className="w-4 h-4 text-green-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{t('Stay Updated on WhatsApp')}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t('Get real-time updates about your resume score, profile views & job opportunities.')}</p>
          <div className="space-y-2 mb-6 flex-1">
            {['Resume score updates', 'Profile views by recruiters', 'New job matches', 'Application tips & reminders'].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-gray-600">{t(item)}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleEnableWhatsApp}
            className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition ${whatsappEnabled ? 'bg-green-50 border border-green-200 text-green-700' : 'border border-gray-200 text-teal-800 hover:bg-gray-50'}`}
          >
            {whatsappEnabled
              ? <><Check className="w-4 h-4" /> {t('WhatsApp Enabled')}</>
              : <>{t('Enable WhatsApp Updates')} <FaWhatsapp className="w-4 h-4 text-green-500" /></>
            }
          </button>
        </div>
      </div>

      {/* ── Row 3: Resume Overview (real data, full width) ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-5">{t('Your Resume')}</h3>
        <div className="flex flex-col md:flex-row gap-6 mb-5">
          {/* PDF preview thumbnail */}
          <div className="w-28 h-36 bg-gray-50 rounded-xl border border-gray-200 shrink-0 flex flex-col items-center justify-center gap-1 shadow-inner overflow-hidden relative">
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex flex-col items-center justify-center gap-2 group">
                <FileText className="w-8 h-8 text-teal-500 group-hover:scale-110 transition" />
                <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wide">PDF</span>
                <span className="text-[8px] text-gray-400">{t('Click to view')}</span>
              </a>
            ) : (
              <>
                <FileText className="w-8 h-8 text-gray-300" />
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t('No File')}</span>
              </>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 text-sm truncate max-w-xs">
                {resumeFileName || profileName}
              </h4>
              {resumeUrl && (
                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">{t('Primary')}</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              {t('Last updated')}: {updatedAt}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'ATS Score', val: `${resumeStats.atsScore}%`, color: 'text-teal-700' },
                { label: 'Readability', val: t(resumeStats.readability), color: 'text-teal-700' },
                { label: 'Sections', val: resumeStats.sections, color: 'text-indigo-600' },
                { label: 'Keywords', val: resumeStats.keywords, color: 'text-orange-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold mb-1">{t(label)}</div>
                  <div className={`text-lg font-black ${color}`}>{val}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition"
                >
                  <Eye className="w-3.5 h-3.5" /> {t('Preview Resume')}
                </a>
              )}
              <button
                onClick={() => navigate('/provider/profile?tab=Resume')}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition"
              >
                <Edit className="w-3.5 h-3.5" /> {t('Edit Profile')}
              </button>
              {resumeUrl && (
                <button
                  onClick={handleDownloadResume}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" /> {t('Download')}
                </button>
              )}
              <button
                onClick={() => navigate('/provider/profile?tab=Resume')}
                className="px-3 py-2 border border-teal-200 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 shadow-sm transition"
              >
                <Upload className="w-3.5 h-3.5" /> {t('Upload New')}
              </button>
            </div>
          </div>
        </div>
        {!resumeUrl && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800 font-medium">{t('No resume uploaded yet. Upload your resume to get AI-powered analysis and more recruiter visibility.')}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 text-xs font-bold bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition"
            >
              {t('Upload Now')} →
            </button>
          </div>
        )}
      </div>

      {/* ── Row 4: Profile & Content Tools + Need Help ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h3 className="text-base font-bold text-gray-900 mb-4">{t('Profile & Content Tools')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {contentTools.map((tool, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col hover:shadow-md transition cursor-pointer" onClick={tool.action}>
                <div className="flex items-center gap-2 mb-2">
                  <tool.icon className={`w-4 h-4 ${tool.color}`} />
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">{t(tool.title)}</h4>
                </div>
                <p className="text-[10px] text-gray-500 mb-4 flex-1">{t(tool.desc)}</p>
                <button className="text-xs font-bold text-teal-700 flex items-center gap-1 hover:text-teal-900 transition">{t(tool.btn)} →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Need Help? — functional WhatsApp chat */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <FaWhatsapp className="w-4 h-4 text-green-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{t('Need Help?')}</h3>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-2 w-3/4">{t('Chat with our career experts on WhatsApp')}</p>
          <p className="text-[9px] text-gray-400 mb-6">📅 {t('Mon – Sat, 9 AM – 9 PM')}</p>
          <button
            onClick={handleOpenWhatsAppHelp}
            className="w-36 border border-gray-200 text-teal-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            {t('Chat on WhatsApp')} <FaWhatsapp className="w-3.5 h-3.5 text-green-500" />
          </button>
          <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-teal-50 rounded-full flex items-center justify-center pointer-events-none">
            <span className="text-3xl translate-y-1">👩🏻‍💻</span>
          </div>
        </div>
      </div>

    </div>
  );
}
