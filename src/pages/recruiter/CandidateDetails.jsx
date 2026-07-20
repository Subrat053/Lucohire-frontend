import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiArrowRight, FiChevronLeft, FiChevronRight, FiChevronDown, FiBookmark, FiShare2,
  FiPhone, FiMessageCircle, FiMail, FiMoreHorizontal, FiEdit2, FiArrowUpRight,
  FiCalendar, FiPhoneCall, FiStar, FiFileText, FiDownload, FiCheckCircle, FiPlus,
  FiInbox, FiMessageSquare, FiX, FiCheck
} from 'react-icons/fi';
import { HiSparkles, HiOutlineLocationMarker, HiOutlineUser, HiOutlineGlobeAlt, HiOutlineBriefcase, HiOutlineExclamationCircle } from 'react-icons/hi';
import { toOptimizedMediaUrl } from '../../utils/media';
import { useAuth } from '../../context/AuthContext';

const CandidateDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSidebarTab, setActiveSidebarTab] = useState('AI Insights');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoreActions, setShowMoreActions] = useState(false);
  
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (id) {
      recruiterAPI.viewProvider(id)
        .then(res => {
          setCandidate(res.data.provider || res.data.profile || res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to fetch candidate details");
          setLoading(false);
        });
        
      if (isAuthenticated && (user?.activeRole || user?.role) === 'recruiter') {
        recruiterAPI.checkUnlockStatus(id).then(({ data }) => {
          if (data.isUnlocked) {
            setContactUnlocked(true);
            setContactInfo(data.contactInfo || null);
          }
        }).catch(() => {});
      }
    } else {
      setLoading(false);
    }
  }, [id, isAuthenticated, user?._id]);
  
  const handleUnlock = async () => {
    if (!isAuthenticated) return toast.error(t('Please login first'));
    if ((user?.activeRole || user?.role) !== 'recruiter') return toast.error(t('Only recruiters can unlock contacts'));
    setUnlocking(true);
    try {
      const { data } = await recruiterAPI.unlockContact(id);
      setContactUnlocked(true);
      setContactInfo(data.contact || data.contactInfo);
      toast.success(t('Contact unlocked!'));
    } catch (err) {
      const msg = err.response?.data?.message || t('Failed to unlock');
      toast.error(msg);
    } finally {
      setUnlocking(false);
    }
  };

  const tabs = ['Overview', 'Experience', 'Skills', 'Resume', 'Education', 'Projects', 'Screening', 'Notes & Feedback', 'Activity'];

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">{t("Loading...")}</div>;
  }

  if (!candidate) {
     return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">{t("Candidate not found")}</div>;
  }

  const u = candidate.user || {};
  const cData = {
     profileName: candidate.name || u.name || "Candidate",
     designation: candidate.designation || candidate.title || candidate.category || (candidate.skills && candidate.skills[0]) || "Professional",
     company: candidate.company || "",
     experience: candidate.experience || "N/A",
     currentCtc: candidate.currentCtc || candidate.pricing || "N/A",
     expectedCtc: candidate.expectedCtc || "N/A",
     noticePeriod: candidate.noticePeriod || "30 Days",
     availability: candidate.availability || "Immediate",
     city: candidate.city || candidate.location || "Location not specified",
     state: candidate.state || "",
     previousExperience: Array.isArray(candidate.previousExperience) && candidate.previousExperience.length > 0 
        ? candidate.previousExperience 
        : (Array.isArray(candidate.experienceDetails) ? candidate.experienceDetails : []),
     education: Array.isArray(candidate.education) ? candidate.education : [],
     projects: Array.isArray(candidate.projects) ? candidate.projects : [],
     skills: Array.isArray(candidate.skills) ? candidate.skills : [],
     jobType: Array.isArray(candidate.jobType) ? candidate.jobType : ['Full-time'],
     workMode: candidate.workMode || 'Hybrid',
     relocationAvailable: candidate.relocationAvailable || false,
     resumeUrl: candidate.resumeUrl || '',
     description: candidate.description || candidate.headline || "",
     photo: candidate.photo || candidate.profilePhoto || u.avatar || "",
     languages: candidate.languages || [],
     tier: candidate.tier || ''
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* MAIN CONTENT AREA */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Top Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link to="/recruiter/candidates" className="flex items-center gap-2 text-[14px] font-bold text-gray-600 hover:text-gray-900 transition">
                <FiArrowLeft className="w-4 h-4" /> {t("Back to search")}
              </Link>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
                  <FiArrowLeft className="w-4 h-4" /> {t("Previous")}
                </button>
                <button className="flex items-center gap-2 text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
                  {t("Next")} <FiArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 text-[13px] font-bold text-indigo-700 bg-white border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-50 transition shadow-sm">
                  {t("More Actions")} <FiChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Header Box */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
              <div className="flex flex-col lg:flex-row gap-6">
                {cData.photo ? (
                  <img src={toOptimizedMediaUrl(cData.photo, { width: 96, height: 96, crop: 'fill' })} alt={cData.profileName} className="w-[104px] h-[104px] rounded-2xl object-cover shadow-sm border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-[104px] h-[104px] rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                    <span className="text-3xl text-gray-400 font-bold">{cData.profileName.charAt(0)}</span>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <h1 className="text-[22px] font-extrabold text-gray-900">{cData.profileName}</h1>
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          95% Match
                        </span>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                          Premium
                        </span>
                      </div>
                      <div className="text-[15px] font-medium text-gray-700 mb-1">{cData.designation} {cData.company ? `at ${cData.company}` : ""}</div>
                      <div className="text-[13px] font-medium text-gray-500 flex items-center gap-1.5 mb-4">
                        <HiOutlineLocationMarker className="w-4 h-4 text-gray-400" /> {cData.city}{cData.state ? `, ${cData.state}` : ''}
                      </div>
                      
                      {/* Contact Actions */}
                      <div className="flex items-center gap-2">
                        {contactUnlocked && contactInfo ? (
                          <>
                            <a href={`tel:${contactInfo.phone || contactInfo.whatsappNumber}`} className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-indigo-50 transition border border-indigo-100 shadow-sm">
                              <FiPhoneCall className="w-3.5 h-3.5" />{t('Contact')}
                            </a>
                            <a href={`https://wa.me/${contactInfo.whatsappNumber || contactInfo.phone}`} target="_blank" rel="noreferrer" className="p-2 text-green-600 bg-white hover:bg-green-50 rounded-lg transition border border-green-100 shadow-sm" title="WhatsApp">
                              <MessageCircleIcon className="w-4 h-4" /> 
                            </a>
                            {contactInfo.email && (
                              <a href={`mailto:${contactInfo.email}`} className="p-2 text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition border border-blue-100 shadow-sm" title="Email">
                                <FiMail className="w-4 h-4" />
                              </a>
                            )}
                            <button className="p-2 text-gray-600 bg-white hover:bg-gray-50 rounded-lg transition border border-gray-200 shadow-sm">
                              <FiMoreHorizontal className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={handleUnlock} disabled={unlocking} className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-indigo-50 transition border border-indigo-100 shadow-sm">
                              <FiPhoneCall className="w-3.5 h-3.5" />{unlocking ? 'Unlocking...' : t('Contact')}
                            </button>
                            <button onClick={handleUnlock} className="p-2 text-green-600 bg-white hover:bg-green-50 rounded-lg transition border border-green-100 shadow-sm">
                              <MessageCircleIcon className="w-4 h-4" /> 
                            </button>
                            <button onClick={handleUnlock} className="p-2 text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition border border-blue-100 shadow-sm">
                              <FiMail className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 bg-white hover:bg-gray-50 rounded-lg transition border border-gray-200 shadow-sm">
                              <FiMoreHorizontal className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-8 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-semibold text-gray-500">{t("Experience")}</div>
                        <div className="text-[14px] font-extrabold text-gray-900">{cData.experience}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-semibold text-gray-500">{t("Current CTC")}</div>
                        <div className="text-[14px] font-extrabold text-gray-900">{cData.currentCtc}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-semibold text-gray-500">{t("Expected CTC")}</div>
                        <div className="text-[14px] font-extrabold text-gray-900">{cData.expectedCtc}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-semibold text-gray-500">{t("Notice Period")}</div>
                        <div className="text-[14px] font-extrabold text-gray-900">{cData.noticePeriod}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-semibold text-gray-500">{t("Availability")}</div>
                        <div className="text-[14px] font-extrabold text-gray-900">{cData.availability}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center gap-8 mt-8 border-b border-gray-100 overflow-x-auto custom-scrollbar">
                {tabs.map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[14px] font-bold whitespace-nowrap transition border-b-[3px] ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN (Wide) */}
              <div className="2xl:col-span-2 space-y-6">
                
                {/* About */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-[15px] font-bold text-gray-900 mb-3">{t("About")} {cData.profileName.split(' ')[0]}</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
                    {cData.description || "No description provided."}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5"><HiOutlineUser className="w-3.5 h-3.5"/>{t("Age")}</div>
                      <div className="text-[13px] font-bold text-gray-900">29 yrs</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5"><HiOutlineGlobeAlt className="w-3.5 h-3.5"/>{t("Languages")}</div>
                      <div className="text-[13px] font-bold text-gray-900">{cData.languages?.length > 0 ? cData.languages.join(', ') : "English, Hindi"}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5"><HiOutlineLocationMarker className="w-3.5 h-3.5"/>{t("Current Location")}</div>
                      <div className="text-[13px] font-bold text-gray-900">{cData.city}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5"><FiArrowUpRight className="w-3.5 h-3.5"/>{t("Relocation")}</div>
                      <div className="text-[13px] font-bold text-gray-900">{cData.relocationAvailable ? "Open to relocate" : "No"}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5"><HiOutlineBriefcase className="w-3.5 h-3.5"/>{t("Employment Type")}</div>
                      <div className="text-[13px] font-bold text-gray-900">{cData.jobType?.length > 0 ? cData.jobType.join(', ') : "Full-time"}</div>
                    </div>
                  </div>
                </div>

                {/* Key Skills */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[15px] font-bold text-gray-900">{t("Key Skills")}</h3>
                    <button onClick={() => toast.success('Edit feature coming soon')} className="flex items-center gap-1 text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition">
                      <FiEdit2 className="w-3.5 h-3.5"/> Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {cData.skills?.length > 0 ? cData.skills.map(skill => (
                      <span key={skill} className="text-[12px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                        {skill}
                      </span>
                    )) : (
                      <span className="text-[13px] text-gray-500 italic">No skills listed</span>
                    )}
                    {cData.skills?.length > 5 && (
                      <span className="text-[12px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
                        +{cData.skills.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Experience Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-[15px] font-bold text-gray-900 mb-6">{t("Experience Summary")}</h3>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/3 space-y-5">
                      <div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">{t("Total Experience")}</div>
                        <div className="text-[15px] font-extrabold text-gray-900">{cData.experience}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">{t("Relevant Experience")}</div>
                        <div className="text-[15px] font-extrabold text-gray-900">{cData.experience}</div>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gray-200"></div>
                      <div className="space-y-6">
                        {cData.previousExperience?.length > 0 ? cData.previousExperience.map((exp, idx) => (
                          <div key={idx} className="flex gap-4 relative">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 relative z-10 border-4 border-white">
                              {exp.company?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                              <div>
                                <h4 className="text-[14px] font-bold text-gray-900">{exp.company}</h4>
                                <div className="text-[13px] font-medium text-gray-600">{exp.role || exp.designation || "Role"}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[13px] font-medium text-gray-800">{exp.duration || "Jan 2022 - Present"}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">2.5 yrs</div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-[13px] text-gray-500 italic pl-12">{t("No experience details provided")}</div>
                        )}
                      </div>
                      <button onClick={() => toast.success('View Experience feature coming soon')} className="mt-6 text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
                        View Full Experience <FiArrowRight className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <h3 className="text-[15px] font-bold text-gray-900 mb-6">{t("Education")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {cData.education?.length > 0 ? cData.education.slice(0, 2).map((edu, idx) => (
                      <div key={idx}>
                        <h4 className="text-[13px] font-bold text-gray-900 mb-1">{edu.degree || edu.degreeName}</h4>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">{edu.year || edu.passingYear || 'N/A'}</div>
                        <div className="text-[12px] text-gray-700">{edu.institution || edu.schoolName}</div>
                      </div>
                    )) : (
                      <div className="text-[13px] text-gray-500 italic">{t("No education details provided")}</div>
                    )}
                  </div>
                  {cData.education?.length > 0 && (
                    <button onClick={() => toast.success('View Education feature coming soon')} className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
                      View All Education <FiArrowRight className="w-3.5 h-3.5"/>
                    </button>
                  )}
                </div>
                
                {/* Projects */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <h3 className="text-[15px] font-bold text-gray-900 mb-6">{t("Projects (Top 2)")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {cData.projects?.length > 0 ? cData.projects.slice(0, 2).map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <h4 className="text-[13px] font-bold text-gray-900 mb-1">{proj.title || "Project Name"}</h4>
                        <div className="text-[11px] text-gray-600 mb-3">{proj.technologies || "React, Redux, Node.js"}</div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-700">
                          <FiStar className="w-3.5 h-3.5 fill-current" /> Featured
                        </div>
                      </div>
                    )) : (
                      <>
                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                          <h4 className="text-[13px] font-bold text-gray-900 mb-1">Food Order Platform</h4>
                          <div className="text-[11px] text-gray-600 mb-3">React, Redux, Node.js</div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-700">
                            <FiStar className="w-3.5 h-3.5 fill-current" /> Featured
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                          <h4 className="text-[13px] font-bold text-gray-900 mb-1">Instamart Redesign</h4>
                          <div className="text-[11px] text-gray-600 mb-3">Next.js, Tailwind CSS</div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-700">
                            <FiStar className="w-3.5 h-3.5 fill-current" /> Featured
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => toast.success('View Projects feature coming soon')} className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
                    View All Projects <FiArrowRight className="w-3.5 h-3.5"/>
                  </button>
                </div>

              </div>

              {/* MIDDLE COLUMN (Actions & Fit) */}
              <div className="2xl:col-span-1 space-y-6">
                
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-5">{t("Quick Actions")}</h3>
                  <div className="space-y-3">
                    <button onClick={() => toast.success('Interview scheduled successfully')} className="w-full bg-indigo-600 text-white rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200">
                      <FiCalendar className="w-4 h-4" /> Schedule Interview
                    </button>
                    <button onClick={handleUnlock} disabled={unlocking || contactUnlocked} className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
                      <FiPhoneCall className="w-4 h-4" /> {contactUnlocked ? t("Contact Info Unlocked") : t("Contact Candidate")}
                    </button>
                    <button onClick={() => toast.success('Added to Shortlist!')} className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
                      <FiBookmark className="w-4 h-4" /> Add to Shortlist
                    </button>
                    
                    <div className="relative">
                      <button onClick={() => setShowMoreActions(!showMoreActions)} className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
                        More Actions <FiChevronDown className="w-4 h-4" />
                      </button>
                      {showMoreActions && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20 animate-fade-in-up">
                          <button onClick={() => { toast.success('Moved to Talent Pool'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-left text-[12px] font-bold text-gray-700 transition">
                            <FiInbox className="w-4 h-4 text-gray-400" /> Move to Talent Pool
                          </button>
                          <button onClick={() => { toast.success('Message feature coming soon'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-left text-[12px] font-bold text-gray-700 transition">
                            <FiMessageSquare className="w-4 h-4 text-gray-400" /> Send Message
                          </button>
                          <button onClick={() => { toast.success('Add Note feature coming soon'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-left text-[12px] font-bold text-gray-700 transition">
                            <FiEdit2 className="w-4 h-4 text-gray-400" /> Add Note
                          </button>
                          <button onClick={() => { toast.error('Candidate Rejected'); setShowMoreActions(false); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-red-50 rounded-lg text-left text-[12px] font-bold text-red-600 transition mt-1">
                            <FiX className="w-4 h-4" /> Reject Candidate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Candidate Fit */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[14px] font-bold text-gray-900">{t("Candidate Fit")}</h3>
                  </div>
                  
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-[68px] h-[68px] rounded-full border-[5px] border-green-500 flex items-center justify-center text-[16px] font-extrabold text-green-700 bg-green-50 shrink-0">
                      95%
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-green-700 mb-1">{t("Excellent Match")}</div>
                      <div className="text-[11px] text-gray-600 leading-relaxed">{t("High match with your job requirements.")}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[11px] font-bold text-gray-900 mb-3">Top Matching Skills</div>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700"><FiCheckCircle className="w-3.5 h-3.5 text-green-500" /> React</div>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700"><FiCheckCircle className="w-3.5 h-3.5 text-green-500" /> TypeScript</div>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700"><FiCheckCircle className="w-3.5 h-3.5 text-green-500" /> JavaScript</div>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700"><FiCheckCircle className="w-3.5 h-3.5 text-green-500" /> Next.js</div>
                    </div>
                    <button onClick={() => toast.success('Match Breakdown coming soon')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
                      AI Match Breakdown <FiArrowRight className="w-3 h-3"/>
                    </button>
                  </div>
                </div>

                {/* AI Recommended Next Step */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-[12px] font-bold text-gray-900 mb-2">AI Recommended Next Step</h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed mb-5">
                    {cData.profileName.split(' ')[0]} is a strong match for Senior React Developer roles. We recommend scheduling a technical interview.
                  </p>
                  <button onClick={() => toast.success('Interview Kit generating...')} className="w-full bg-white border border-indigo-200 text-indigo-700 rounded-xl py-2.5 text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                    <HiSparkles className="w-4 h-4" /> Generate Interview Kit
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (AI Insights Sidebar) */}
          <div className="xl:col-span-4 sticky top-6 h-[calc(100vh-3rem)]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
                <div className="flex border-b border-gray-100">
                  <button 
                    onClick={() => setActiveSidebarTab('AI Insights')}
                    className={`flex-1 py-4 text-[13px] font-bold transition border-b-[3px] ${activeSidebarTab === 'AI Insights' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                  >{t("AI Insights")}</button>
                  <button 
                    onClick={() => setActiveSidebarTab('Activity')}
                    className={`flex-1 py-4 text-[13px] font-bold transition border-b-[3px] ${activeSidebarTab === 'Activity' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                  >{t("Activity")}</button>
                </div>

                {activeSidebarTab === 'AI Insights' && (
                  <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    
                    {/* AI Summary */}
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <HiSparkles className="w-4 h-4 text-indigo-500" /> AI Summary
                      </h4>
                      <p className="text-[12px] text-gray-700 leading-relaxed mb-4">
                        {cData.profileName.split(' ')[0]} is a strong frontend engineer with expertise in modern React ecosystem. He has worked on high-scale products and shows consistent growth.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">Strong Technical Fit</span>
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">Good Culture Fit</span>
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">Immediate Joiner</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* Strengths */}
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-900 mb-4">Strengths</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <FiCheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-[12px] text-gray-700 font-medium">Strong in React ecosystem</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <FiCheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-[12px] text-gray-700 font-medium">Experience in scalable applications</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <FiCheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-[12px] text-gray-700 font-medium">Quick learner and problem solver</span>
                        </div>
                      </div>
                    </div>

                    {/* Potential Concerns */}
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-900 mb-4 flex items-center justify-between">
                        Potential Concerns <FiChevronDown className="w-4 h-4 text-gray-400" />
                      </h4>
                      <div className="flex items-start gap-2.5">
                        <HiOutlineExclamationCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[12px] text-gray-700 font-medium">Higher salary expectation</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">(24 - 26 LPA)</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full h-px bg-gray-100"></div>

                    {/* Resume */}
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-900 mb-3">Resume</h4>
                      {cData.resumeUrl ? (
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                              <FiFileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[12px] font-bold text-gray-900">{(cData.profileName?.replace(/\s+/g, '_') || "Candidate") + "_Resume.pdf"}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">Last updated 2 days ago</div>
                            </div>
                          </div>
                          {contactUnlocked ? (
                            <a href={cData.resumeUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600 transition p-2 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-lg">
                              <FiDownload className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button onClick={handleUnlock} className="text-gray-400 hover:text-indigo-600 transition p-2 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-lg">
                              <FiDownload className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-500 italic bg-white border border-gray-200 rounded-xl p-4">{t("No resume uploaded")}</div>
                      )}
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>
                    
                    {/* Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[12px] font-bold text-gray-900">Notes</h4>
                        <button onClick={() => toast.success('Add Note coming soon')} className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"><FiPlus /> Add Note</button>
                      </div>
                      <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3 shadow-sm">
                        <p className="text-[12px] text-gray-700 leading-relaxed mb-2 font-medium">
                          Good communication in initial call. Available for interview this week.
                        </p>
                        <div className="text-[10px] font-semibold text-gray-500">
                          - Rahul Verma (Today, 10:30 AM)
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[12px] font-bold text-gray-900">Tags</h4>
                        <button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"><FiPlus /> Add Tag</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-md">React Developer</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">Immediate Joiner</span>
                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">High Potential</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 pb-6 flex justify-end">
                      <button className="bg-indigo-600 text-white rounded-full px-4 py-2 text-[12px] font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2">
                        Ask Luco AI <HiSparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// SVG Icon Components
const MessageCircleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default CandidateDetails;
