import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiChevronDown, FiBookmark, FiShare2, FiMail, FiMoreHorizontal, FiEdit2, FiArrowUpRight, FiCalendar, FiPhoneCall, FiStar, FiFileText, FiDownload, FiCheckCircle, FiPlus, FiInbox, FiMessageSquare, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { HiSparkles, HiOutlineLocationMarker, HiOutlineUser, HiOutlineGlobeAlt, HiOutlineBriefcase, HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { toOptimizedMediaUrl } from '../../utils/media';
import { useAuth } from '../../context/AuthContext';

const TAG_COLORS = ['bg-purple-50 text-purple-700 border-purple-100','bg-indigo-50 text-indigo-700 border-indigo-100','bg-emerald-50 text-emerald-700 border-emerald-100','bg-orange-50 text-orange-700 border-orange-100','bg-rose-50 text-rose-700 border-rose-100','bg-gray-100 text-gray-700 border-gray-200'];

const CandidateDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSidebarTab, setActiveSidebarTab] = useState('AI Insights');
  const [candidate, setCandidate] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef(null);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    const h = (e) => { if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) setShowMoreActions(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    recruiterAPI.viewProvider(id).then(res => {
      const p = res.data.provider || res.data.profile || res.data;
      setCandidate(p); setReviews(res.data.reviews || []);
      if (res.data.isUnlocked && res.data.contactInfo) { setContactUnlocked(true); setContactInfo(res.data.contactInfo); }
      setLoading(false);
      recruiterAPI.checkUnlockStatus(id).then(({ data }) => {
        if (data.isUnlocked) { setContactUnlocked(true); setContactInfo(data.contactInfo || null); }
      }).catch(() => {});
    }).catch(err => {
      if (err.response?.status === 403 && err.response?.data?.limitReached)
        toast.error('Free profile view limit reached. Please upgrade your plan.');
      else toast.error(err.response?.data?.message || 'Failed to fetch candidate details');
      setLoading(false);
    });
  }, [id]);

  const handleUnlock = async () => {
    if (!isAuthenticated) return toast.error(t('Please login first'));
    if ((user?.activeRole || user?.role) !== 'recruiter') return toast.error(t('Only recruiters can unlock contacts'));
    setUnlocking(true);
    try {
      const { data } = await recruiterAPI.unlockContact(id);
      setContactUnlocked(true); setContactInfo(data.contact || data.contactInfo);
      toast.success(t('Contact unlocked!'));
    } catch (err) { toast.error(err.response?.data?.message || t('Failed to unlock')); }
    finally { setUnlocking(false); }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotes(prev => [...prev, { text: newNote.trim(), author: user?.name || 'You', time: `Today, ${timeStr}` }]);
    setNewNote(''); setAddingNote(false); toast.success('Note added!');
  };

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags(prev => [...prev, newTag.trim()]); setNewTag(''); setAddingTag(false);
  };

  const openGmail = (email, subject = '', body = '') => {
    if (!email) return toast.error('No email available');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleWhatsApp = (phone) => {
    if (!phone) return toast.error('No WhatsApp number');
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleScheduleInterview = () => {
    const email = contactInfo?.email || '';
    const name = candidate?.user?.name || candidate?.name || 'Candidate';
    if (email) {
      openGmail(email, 'Interview Invitation',
        `Hi ${name},\n\nWe would like to schedule an interview. Please share your availability.\n\nRegards,\n${user?.name || 'Recruiter'}`);
    } else {
      toast.success('Please unlock contact first to send interview invite.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <FiLoader className="w-8 h-8 text-indigo-600 animate-spin"/>
        <p className="text-sm font-medium text-gray-500">Loading candidate profile...</p>
      </div>
    </div>
  );

  if (!candidate) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
        <p className="text-sm font-medium text-gray-600">Candidate not found</p>
        <Link to="/recruiter/candidates" className="mt-4 inline-flex items-center gap-1 text-indigo-600 text-sm font-bold hover:underline">
          <FiArrowLeft className="w-4 h-4"/> Back to search
        </Link>
      </div>
    </div>
  );

  const u = candidate.user || {};
  const skills = Array.isArray(candidate.skills) ? candidate.skills : (candidate.skills ? [candidate.skills] : []);
  const prevExp = (Array.isArray(candidate.previousExperience) && candidate.previousExperience.length > 0)
    ? candidate.previousExperience : (Array.isArray(candidate.experienceDetails) ? candidate.experienceDetails : []);
  const education = Array.isArray(candidate.education) ? candidate.education : [];
  const projects = Array.isArray(candidate.projects) ? candidate.projects : [];

  const cData = {
    name: candidate.name || u.name || 'Candidate',
    designation: candidate.designation || candidate.title || candidate.category || skills[0] || 'Professional',
    company: candidate.company || prevExp[0]?.company || '',
    experience: candidate.experience || 'N/A',
    currentCtc: candidate.currentCtc || candidate.pricing || 'N/A',
    expectedCtc: candidate.expectedCtc || 'N/A',
    noticePeriod: candidate.noticePeriod || '30 Days',
    availability: candidate.availability || 'As per notice period',
    city: candidate.city || candidate.location || 'Not specified',
    state: candidate.state || '',
    relocation: candidate.relocationAvailable || false,
    resumeUrl: candidate.resumeUrl || '',
    hasResume: candidate.hasResume || false,
    desc: candidate.description || candidate.headline || candidate.highlight || '',
    photo: candidate.photo || candidate.profilePhoto || u.avatar || u.profilePhoto || '',
    languages: Array.isArray(candidate.languages) ? candidate.languages : [],
    age: candidate.age || null,
    tier: candidate.tier || candidate.skillLevel || '',
    isVerified: candidate.isVerified || false,
    matchScore: candidate.matchScore || null,
    jobType: Array.isArray(candidate.jobType) ? candidate.jobType : ['Full-time'],
  };

  const score = cData.matchScore || (cData.isVerified ? 85 : 72);
  const scoreColor = score >= 90 ? 'border-green-500 text-green-700 bg-green-50'
    : score >= 75 ? 'border-blue-500 text-blue-700 bg-blue-50'
    : 'border-orange-400 text-orange-700 bg-orange-50';
  const scoreLabelColor = score >= 90 ? 'text-green-700' : score >= 75 ? 'text-blue-700' : 'text-orange-700';
  const scoreLabel = score >= 90 ? 'Excellent Match' : score >= 75 ? 'Good Match' : 'Moderate Match';

  const strengths = [];
  if (skills.length > 2) strengths.push(`Strong skills: ${skills.slice(0,3).join(', ')}`);
  if (prevExp.length > 1) strengths.push('Experience across multiple companies');
  if (education.length > 0) strengths.push(`${education[0]?.degree || 'Degree'} – solid academic background`);
  if (cData.noticePeriod?.toLowerCase().includes('immediate') || cData.availability === 'Immediate') strengths.push('Immediate joiner');
  if (strengths.length === 0) { strengths.push('Professional background'); strengths.push('Relevant domain experience'); }

  const concerns = [];
  if (cData.expectedCtc && cData.expectedCtc !== 'N/A') concerns.push({ text: 'Salary expectation', sub: cData.expectedCtc });
  if (cData.noticePeriod && !cData.noticePeriod.toLowerCase().includes('immediate')) concerns.push({ text: 'Notice period required', sub: cData.noticePeriod });

  const StatChip = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">{label}</div>
      <div className="text-[13px] font-extrabold text-gray-900 whitespace-nowrap">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* MAIN */}
          <div className="xl:col-span-8 space-y-5">

            {/* Top Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link to="/recruiter/candidates" className="flex items-center gap-1.5 text-[13px] font-bold text-gray-600 hover:text-indigo-600 transition">
                <FiArrowLeft className="w-4 h-4"/> Back to search
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
                  <FiArrowLeft className="w-3.5 h-3.5"/> Previous
                </button>
                <button onClick={() => navigate(1)} className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
                  Next <FiArrowRight className="w-3.5 h-3.5"/>
                </button>
                <div className="relative" ref={moreActionsRef}>
                  <button onClick={() => setShowMoreActions(!showMoreActions)} className="flex items-center gap-1.5 text-[13px] font-bold text-indigo-700 bg-white border border-indigo-100 px-3.5 py-2 rounded-xl hover:bg-indigo-50 shadow-sm">
                    More Actions <FiChevronDown className="w-3.5 h-3.5"/>
                  </button>
                  {showMoreActions && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-30">
                      <button onClick={() => { toast.success('Moved to Talent Pool'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-left text-[12px] font-bold text-gray-700">
                        <FiInbox className="w-4 h-4 text-gray-400"/> Move to Talent Pool
                      </button>
                      <button onClick={() => { if (contactInfo?.email) openGmail(contactInfo.email); else toast.error('Unlock contact first'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-left text-[12px] font-bold text-gray-700">
                        <FiMessageSquare className="w-4 h-4 text-gray-400"/> Send Message
                      </button>
                      <button onClick={() => { setAddingNote(true); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-left text-[12px] font-bold text-gray-700">
                        <FiEdit2 className="w-4 h-4 text-gray-400"/> Add Note
                      </button>
                      <div className="my-1 h-px bg-gray-100"/>
                      <button onClick={() => { toast.error('Candidate rejected'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-red-50 rounded-lg text-left text-[12px] font-bold text-red-600">
                        <FiX className="w-4 h-4"/> Reject Candidate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              {/* Top row: photo + name info + save/share */}
              <div className="flex flex-col sm:flex-row gap-5">
                {cData.photo
                  ? <img src={toOptimizedMediaUrl(cData.photo,{width:96,height:96,crop:'fill'})} alt={cData.name} className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-gray-100 flex-shrink-0"/>
                  : <div className="w-24 h-24 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0"><span className="text-3xl text-indigo-600 font-extrabold">{cData.name.charAt(0)}</span></div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-[20px] font-extrabold text-gray-900">{cData.name}</h1>
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md whitespace-nowrap">{score}% Match</span>
                        {cData.isVerified && <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md whitespace-nowrap">Verified</span>}
                        {cData.tier && <span className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md capitalize whitespace-nowrap">{cData.tier}</span>}
                      </div>
                      <div className="text-[14px] font-semibold text-gray-700 mb-1">{cData.designation}{cData.company ? ` at ${cData.company}` : ''}</div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-4">
                        <HiOutlineLocationMarker className="w-3.5 h-3.5 text-gray-400"/>
                        {[cData.city, cData.state].filter(Boolean).join(', ')}
                      </div>
                      {/* Contact buttons — always in a horizontal row */}
                      <div className="flex flex-row items-center gap-2 flex-wrap">
                        {contactUnlocked && contactInfo ? (<>
                          <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-1.5 bg-white text-indigo-700 px-3.5 py-2 rounded-lg text-[13px] font-bold hover:bg-indigo-50 border border-indigo-100 shadow-sm transition">
                            <FiPhoneCall className="w-3.5 h-3.5"/> Contact
                          </a>
                          {contactInfo.whatsappNumber && <button onClick={() => handleWhatsApp(contactInfo.whatsappNumber)} className="p-2 text-green-600 bg-white hover:bg-green-50 rounded-lg border border-green-100 shadow-sm transition"><FaWhatsapp className="w-4 h-4"/></button>}
                          {contactInfo.email && <button onClick={() => openGmail(contactInfo.email)} className="p-2 text-blue-600 bg-white hover:bg-blue-50 rounded-lg border border-blue-100 shadow-sm transition"><FiMail className="w-4 h-4"/></button>}
                          <button onClick={() => { navigator.clipboard.writeText([contactInfo.phone,contactInfo.email].filter(Boolean).join(' | ')); toast.success('Copied!'); }} className="p-2 text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition"><FiMoreHorizontal className="w-4 h-4"/></button>
                        </>) : (<>
                          <button onClick={handleUnlock} disabled={unlocking} className="flex items-center gap-1.5 bg-white text-indigo-700 px-3.5 py-2 rounded-lg text-[13px] font-bold hover:bg-indigo-50 border border-indigo-100 shadow-sm disabled:opacity-60">
                            <FiPhoneCall className="w-3.5 h-3.5"/>{unlocking ? 'Unlocking...' : t('Contact')}
                          </button>
                          <button onClick={handleUnlock} className="p-2 text-green-600 bg-white hover:bg-green-50 rounded-lg border border-green-100 shadow-sm"><FaWhatsapp className="w-4 h-4"/></button>
                          <button onClick={handleUnlock} className="p-2 text-blue-600 bg-white hover:bg-blue-50 rounded-lg border border-blue-100 shadow-sm"><FiMail className="w-4 h-4"/></button>
                          <button className="p-2 text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm"><FiMoreHorizontal className="w-4 h-4"/></button>
                        </>)}
                      </div>
                    </div>
                    {/* Bookmark / Share — top right, in normal flow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toast.success('Saved!')} className="p-2 text-gray-400 hover:text-indigo-600 bg-white rounded-xl border border-gray-100 shadow-sm transition"><FiBookmark className="w-4 h-4"/></button>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="p-2 text-gray-400 hover:text-indigo-600 bg-white rounded-xl border border-gray-100 shadow-sm transition"><FiShare2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat chips — full-width strip below the photo+name block */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-x-8 gap-y-3">
                <StatChip label="Experience" value={cData.experience}/>
                <StatChip label="Current CTC" value={cData.currentCtc}/>
                <StatChip label="Expected CTC" value={cData.expectedCtc}/>
                <StatChip label="Notice Period" value={cData.noticePeriod}/>
                <StatChip label="Availability" value={cData.availability}/>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-5">
              <div className="2xl:col-span-2 space-y-5">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-3">About {cData.name.split(' ')[0]}</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-5 whitespace-pre-wrap">{cData.desc || 'No description provided.'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {cData.age && <div><div className="text-[10px] font-semibold text-gray-500 mb-1">Age</div><div className="text-[13px] font-bold text-gray-900">{cData.age} yrs</div></div>}
                    <div><div className="text-[10px] font-semibold text-gray-500 mb-1">Languages</div><div className="text-[13px] font-bold text-gray-900">{cData.languages.length > 0 ? cData.languages.join(', ') : 'English'}</div></div>
                    <div><div className="text-[10px] font-semibold text-gray-500 mb-1">Location</div><div className="text-[13px] font-bold text-gray-900">{cData.city}</div></div>
                    <div><div className="text-[10px] font-semibold text-gray-500 mb-1">Relocation</div><div className="text-[13px] font-bold text-gray-900">{cData.relocation ? 'Open to relocate' : 'No'}</div></div>
                    <div><div className="text-[10px] font-semibold text-gray-500 mb-1">Employment</div><div className="text-[13px] font-bold text-gray-900">{cData.jobType.join(', ')}</div></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-bold text-gray-900">Key Skills</h3>
                    <button onClick={() => toast.success('Edit coming soon')} className="flex items-center gap-1 text-[12px] font-bold text-indigo-600 hover:text-indigo-700"><FiEdit2 className="w-3.5 h-3.5"/> Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.length > 0 ? skills.map((s,i) => <span key={i} className="text-[12px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">{s}</span>) : <span className="text-[13px] text-gray-400 italic">No skills listed</span>}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-5">Experience Summary</h3>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-[140px] space-y-4 shrink-0">
                      <div><div className="text-[10px] font-semibold text-gray-500 mb-0.5">Total Experience</div><div className="text-[15px] font-extrabold text-gray-900">{cData.experience}</div></div>
                      <div><div className="text-[10px] font-semibold text-gray-500 mb-0.5">Relevant Experience</div><div className="text-[15px] font-extrabold text-gray-900">{cData.experience}</div></div>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gray-100"/>
                      <div className="space-y-5">
                        {prevExp.length > 0 ? prevExp.map((exp,idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-extrabold text-[13px] shrink-0 relative z-10 border-4 border-white">{(exp.company||'C').charAt(0).toUpperCase()}</div>
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-1 pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                              <div><h4 className="text-[13px] font-bold text-gray-900">{exp.company||'Company'}</h4><div className="text-[12px] text-gray-600">{exp.role||exp.designation||''}</div></div>
                              <div className="text-right shrink-0"><div className="text-[12px] font-semibold text-gray-700">{exp.duration||exp.startDate||''}</div>{exp.years&&<div className="text-[11px] text-gray-500">{exp.years}</div>}</div>
                            </div>
                          </div>
                        )) : <div className="text-[13px] text-gray-400 italic pl-12">No experience details provided</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-5">Education</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                    {education.length > 0 ? education.slice(0,2).map((edu,idx) => (
                      <div key={idx}><h4 className="text-[13px] font-bold text-gray-900 mb-0.5">{edu.degree||edu.degreeName||'Degree'}</h4><div className="text-[11px] font-semibold text-gray-500 mb-0.5">{edu.year||edu.passingYear||edu.endYear||''}</div><div className="text-[12px] text-gray-600">{edu.institution||edu.schoolName||edu.college||''}</div></div>
                    )) : <div className="text-[13px] text-gray-400 italic">No education details provided</div>}
                  </div>
                  {education.length > 2 && <button onClick={() => setActiveTab('Education')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View All Education <FiArrowRight className="w-3.5 h-3.5"/></button>}
                </div>

                {projects.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-[14px] font-bold text-gray-900 mb-5">Projects (Top 2)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {projects.slice(0,2).map((p,idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                          <h4 className="text-[13px] font-bold text-gray-900 mb-1">{p.title||p.name||'Project'}</h4>
                          <div className="text-[11px] text-gray-600 mb-3">{p.technologies||p.tech||(Array.isArray(p.skills)?p.skills.join(', '):'')}</div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700"><FiStar className="w-3 h-3 fill-current"/> Featured</div>
                        </div>
                      ))}
                    </div>
                    {projects.length > 2 && <button onClick={() => setActiveTab('Projects')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View All Projects <FiArrowRight className="w-3.5 h-3.5"/></button>}
                  </div>
                )}
              </div>

              <div className="2xl:col-span-1 space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2.5">
                    <button onClick={handleScheduleInterview} className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-sm">
                      <FiCalendar className="w-4 h-4"/> Schedule Interview
                    </button>
                    <button onClick={contactUnlocked ? () => contactInfo?.email && openGmail(contactInfo.email) : handleUnlock} disabled={unlocking} className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm disabled:opacity-60">
                      <FiPhoneCall className="w-4 h-4"/> {contactUnlocked ? 'Contact Candidate' : 'Unlock Contact'}
                    </button>
                    <button onClick={() => toast.success('Added to Shortlist!')} className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm">
                      <FiBookmark className="w-4 h-4"/> Add to Shortlist
                    </button>
                    <button onClick={() => setShowMoreActions(!showMoreActions)} className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm">
                      More Actions <FiChevronDown className="w-4 h-4"/>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-4">Candidate Fit</h3>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-[64px] h-[64px] rounded-full border-4 flex items-center justify-center text-[15px] font-extrabold shrink-0 ${scoreColor}`}>{score}%</div>
                    <div><div className={`text-[14px] font-bold mb-0.5 ${scoreLabelColor}`}>{scoreLabel}</div><div className="text-[11px] text-gray-500">Based on skills and experience</div></div>
                  </div>
                  <div className="text-[11px] font-bold text-gray-700 mb-2">Top Matching Skills</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                    {skills.slice(0,4).map((s,i) => <div key={i} className="flex items-center gap-1 text-[12px] font-semibold text-gray-700"><FiCheckCircle className="w-3.5 h-3.5 text-green-500"/> {s}</div>)}
                  </div>
                  <button onClick={() => toast.success('AI Match Breakdown coming soon')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">AI Match Breakdown <FiArrowRight className="w-3 h-3"/></button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-[12px] font-bold text-gray-900 mb-2">AI Recommended Next Step</h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed mb-4">
                    {cData.name.split(' ')[0]} is a {score >= 90 ? 'strong' : 'good'} match. We recommend {score >= 85 ? 'a technical interview' : 'a screening call first'}.
                  </p>
                  <button onClick={() => toast.success('Interview Kit generating...')} className="w-full bg-white border border-indigo-200 text-indigo-700 rounded-xl py-2.5 text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-50">
                    <HiSparkles className="w-4 h-4"/> Generate Interview Kit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="xl:col-span-4 sticky top-6 h-[calc(100vh-3rem)]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="flex border-b border-gray-100 shrink-0">
                {['AI Insights','Activity'].map(tab => (
                  <button key={tab} onClick={() => setActiveSidebarTab(tab)} className={`flex-1 py-3.5 text-[13px] font-bold border-b-2 -mb-px transition ${activeSidebarTab===tab ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>{tab}</button>
                ))}
              </div>

              {activeSidebarTab === 'AI Insights' && (
                <div className="p-5 space-y-5 flex-1 overflow-y-auto bg-gray-50/30">
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-900 mb-2.5 flex items-center gap-1.5"><HiSparkles className="w-3.5 h-3.5 text-indigo-500"/> AI Summary</h4>
                    <p className="text-[12px] text-gray-700 leading-relaxed mb-3">
                      {cData.name.split(' ')[0]} is a {cData.tier || 'professional'} with expertise in {skills.slice(0,2).join(' and ') || 'their domain'}. {prevExp.length > 0 ? `Has worked at ${prevExp.length} organisation${prevExp.length>1?'s':''}.` : ''} Shows {score>=85?'strong':'good'} profile alignment.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {score>=85 && <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">Strong Technical Fit</span>}
                      {score>=80 && <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">Good Culture Fit</span>}
                      {(cData.noticePeriod?.toLowerCase().includes('immediate')||cData.availability==='Immediate') && <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">Immediate Joiner</span>}
                    </div>
                  </div>
                  <div className="h-px bg-gray-100"/>
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-900 mb-3">Strengths</h4>
                    <div className="space-y-2">
                      {strengths.map((s,i) => <div key={i} className="flex items-start gap-2"><FiCheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5"/><span className="text-[12px] text-gray-700">{s}</span></div>)}
                    </div>
                  </div>
                  {concerns.length > 0 && (<>
                    <div className="h-px bg-gray-100"/>
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-900 mb-3">Potential Concerns</h4>
                      <div className="space-y-2">
                        {concerns.map((c,i) => <div key={i} className="flex items-start gap-2"><HiOutlineExclamationCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5"/><div><div className="text-[12px] text-gray-700">{c.text}</div>{c.sub&&<div className="text-[11px] text-gray-400">({c.sub})</div>}</div></div>)}
                      </div>
                    </div>
                  </>)}
                  <div className="h-px bg-gray-100"/>
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-900 mb-2.5">Resume</h4>
                    {cData.hasResume ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 shrink-0"><FiFileText className="w-4 h-4"/></div>
                          <div className="min-w-0"><div className="text-[12px] font-bold text-gray-900 truncate">{cData.name.replace(/s+/g,'_')}_Resume.pdf</div><div className="text-[10px] text-gray-500">Uploaded resume</div></div>
                        </div>
                        {contactUnlocked && cData.resumeUrl
                          ? <a href={cData.resumeUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-lg transition"><FiDownload className="w-3.5 h-3.5"/></a>
                          : <button onClick={handleUnlock} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-lg transition"><FiDownload className="w-3.5 h-3.5"/></button>
                        }
                      </div>
                    ) : <div className="text-[11px] text-gray-400 italic bg-white border border-gray-200 rounded-xl p-3">No resume uploaded</div>}
                  </div>
                  <div className="h-px bg-gray-100"/>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[12px] font-bold text-gray-900">Notes</h4>
                      <button onClick={() => setAddingNote(true)} className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"><FiPlus className="w-3 h-3"/> Add Note</button>
                    </div>
                    {addingNote && (
                      <div className="mb-3 space-y-2">
                        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Type your note..." rows={2} className="w-full text-[12px] border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-400 resize-none"/>
                        <div className="flex gap-2">
                          <button onClick={handleAddNote} className="flex-1 bg-indigo-600 text-white text-[12px] font-bold py-1.5 rounded-lg hover:bg-indigo-700">Save</button>
                          <button onClick={() => setAddingNote(false)} className="px-3 text-[12px] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {notes.map((n,i) => <div key={i} className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3"><p className="text-[12px] text-gray-700 leading-relaxed mb-1.5">{n.text}</p><div className="text-[10px] font-semibold text-gray-400">— {n.author} ({n.time})</div></div>)}
                      {notes.length===0&&!addingNote&&<div className="text-[11px] text-gray-400 italic">No notes yet</div>}
                    </div>
                  </div>
                  <div className="h-px bg-gray-100"/>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[12px] font-bold text-gray-900">Tags</h4>
                      <button onClick={() => setAddingTag(true)} className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"><FiPlus className="w-3 h-3"/> Add Tag</button>
                    </div>
                    {addingTag && (
                      <div className="mb-3 flex gap-2 items-center">
                        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleAddTag()} placeholder="e.g. React Developer" className="flex-1 text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"/>
                        <button onClick={handleAddTag} className="bg-indigo-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700">Add</button>
                        <button onClick={() => setAddingTag(false)} className="text-[12px] text-gray-500 hover:text-gray-700">✕</button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag,i) => (
                        <div key={i} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${TAG_COLORS[i%TAG_COLORS.length]}`}>
                          {tag}<button onClick={() => setTags(prev=>prev.filter((_,idx)=>idx!==i))} className="ml-0.5 hover:opacity-70"><FiX className="w-2.5 h-2.5"/></button>
                        </div>
                      ))}
                      {tags.length===0&&<div className="text-[11px] text-gray-400 italic">No tags yet</div>}
                    </div>
                  </div>
                  </div>
              )}

              {activeSidebarTab === 'Activity' && (
                <div className="p-5 flex-1 overflow-y-auto">
                  <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-4">Recent Activity</div>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((r,i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0">{(r.recruiter?.name||'R').charAt(0)}</div>
                          <div><div className="text-[12px] font-bold text-gray-800 mb-0.5">{r.recruiter?.name||'Recruiter'}</div><div className="text-[12px] text-gray-600">{r.comment||r.text||'Left a review'}</div><div className="text-[10px] text-gray-400 mt-1">{r.createdAt?new Date(r.createdAt).toLocaleDateString():''}</div></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiMessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2"/>
                      <p className="text-[12px] text-gray-400 font-medium">No activity yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;
