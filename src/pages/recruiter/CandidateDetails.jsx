import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiChevronDown, FiBookmark, FiShare2,
  FiPhone, FiMessageCircle, FiMail, FiMoreHorizontal, FiEdit2, FiArrowUpRight,
  FiCalendar, FiPhoneCall, FiStar, FiFileText, FiDownload, FiCheckCircle, FiPlus
} from 'react-icons/fi';
import { HiSparkles, HiOutlineLocationMarker, HiOutlineUser, HiOutlineGlobeAlt, HiOutlineBriefcase, HiOutlineExclamationCircle } from 'react-icons/hi';

const CandidateDetails = () => {
  const {
    t
  } = useTranslation();

  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSidebarTab, setActiveSidebarTab] = useState('AI Insights');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      recruiterAPI.getProviderProfile(id)
        .then(res => {
          setCandidate(res.data.profile || res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to fetch candidate details");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

  const tabs = ['Overview', 'Experience', 'Skills', 'Resume', 'Education', 'Projects', 'Screening', 'Notes & Feedback', 'Activity'];

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center">{t("Loading...")}</div>;
  }

  // Fallback to mock data if no candidate is found
  const cData = candidate || {
     profileName: "Ankit Singh",
     designation: "Senior React Developer",
     company: "Swiggy",
     experience: "5.2 yrs",
     city: "Bangalore",
     state: "Karnataka",
     previousExperience: [
       { company: 'Swiggy', role: 'Senior React Developer', duration: 'Jan 2022 - Present', description: '2.5 yrs' },
       { company: 'Razorpay', role: 'React Developer', duration: 'Jul 2020 - Dec 2021', description: '1.5 yrs' }
     ],
     education: [
       { institution: 'IIT Delhi', degree: 'B.Tech Computer Science', year: '2015 - 2019' }
     ],
     skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Node.js', 'Tailwind CSS', 'JavaScript', 'HTML'],
     jobType: ['Full-time'],
     workMode: 'Hybrid',
     relocationAvailable: true,
     noticePeriod: '30 Days',
     resumeUrl: '',
     contactVisibility: 'both'
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* MAIN CONTENT AREA */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Top Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link to="/recruiter/candidates" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition">
            <FiArrowLeft />{t("Back to search")}</Link>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <FiChevronLeft />{t("Previous")}</button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">{t("Next")}<FiChevronRight />
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 hover:bg-gray-50 transition ml-2">{t("More Actions")}<FiChevronDown />
            </button>
          </div>
        </div>

        {/* Profile Header Box */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">

          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex items-start gap-6">
              <img src="https://i.pravatar.cc/150?u=1" alt="Ankit Singh" className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-gray-100" />
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl font-extrabold text-gray-900">{cData.profileName || cData.user?.name || "Ankit Singh"}</h1>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t("95% Match")}</span>
                  <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{cData.tier || 'Premium'}</span>
                  
                  {/* Bookmark & Share Buttons */}
                  <div className="flex items-center gap-2 lg:ml-4">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition"><FiBookmark className="w-5 h-5" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition"><FiShare2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">{cData.designation || "Senior React Developer"} {cData.company ? `at ${cData.company}` : ""}</div>
                <div className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-4">
                  <HiOutlineLocationMarker className="w-4 h-4" /> {cData.city || "Bangalore"}, {cData.state || "Karnataka"}{t(", India")}</div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition">
                    <FiPhoneCall className="w-3.5 h-3.5" />{t("Contact")}</button>
                  <button className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition">
                    <FiMessageCircle className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                    <FiMail className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                    <FiMoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            


            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 lg:border-l border-gray-100 lg:pl-8">
              <div>
                <div className="text-[10px] font-bold text-gray-400 mb-1">{t("Experience")}</div>
                <div className="text-sm font-extrabold text-gray-900">{cData.experience || "5.2 yrs"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 mb-1">{t("Current CTC")}</div>
                <div className="text-sm font-extrabold text-gray-900">{cData.pricing ? `₹${cData.pricing}` : '₹18 LPA'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 mb-1">{t("Contact Visibility")}</div>
                <div className="text-sm font-extrabold text-gray-900">{cData.contactVisibility === 'none' ? 'Hidden' : 'Visible'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 mb-1">{t("Notice Period")}</div>
                <div className="text-sm font-extrabold text-gray-900">{cData.noticePeriod || "30 Days"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 mb-1">{t("Availability")}</div>
                <div className="text-sm font-extrabold text-gray-900">{t("Immediate")}</div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-6 mt-8 border-b border-gray-100 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold whitespace-nowrap transition border-b-2 ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
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
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t("About")}{cData.profileName?.split(' ')[0] || "Candidate"}</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                {cData.description || "Experienced React Developer with a strong background in building scalable web applications and excellent problem-solving skills. Passionate about creating user-friendly interfaces and optimizing performance."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1"><HiOutlineUser />{t("Age")}</div>
                  <div className="text-xs font-bold text-gray-900">{t("29 yrs")}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1"><HiOutlineGlobeAlt />{t("Languages")}</div>
                  <div className="text-xs font-bold text-gray-900">{cData.languages?.length > 0 ? cData.languages.join(', ') : "English, Hindi"}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1"><HiOutlineLocationMarker />{t("Current Location")}</div>
                  <div className="text-xs font-bold text-gray-900">{cData.city || "Bangalore"}{t(", India")}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1"><FiArrowUpRight />{t("Relocation")}</div>
                  <div className="text-xs font-bold text-gray-900">{cData.relocationAvailable ? "Open to relocate" : "No"}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1"><HiOutlineBriefcase />{t("Employment Type")}</div>
                  <div className="text-xs font-bold text-gray-900">{cData.jobType?.length > 0 ? cData.jobType.join(', ') : "Full-time"} ({cData.workMode || "Hybrid"})</div>
                </div>
              </div>
            </div>

            {/* Key Skills */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">{t("Key Skills")}</h3>
                <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline">
                  <FiEdit2 className="w-3.5 h-3.5" />{t("Edit")}</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(cData.skills?.length > 0 ? cData.skills : ['React', 'TypeScript', 'Next.js', 'Redux', 'Node.js', 'Tailwind CSS', 'JavaScript', 'HTML']).slice(0, 8).map(skill => (
                  <span key={skill} className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                    {skill}
                  </span>
                ))}
                {cData.skills?.length > 8 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">
                    +{cData.skills.length - 8}
                  </span>
                )}
              </div>
            </div>

            {/* Experience Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-6">{t("Experience Summary")}</h3>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="sm:w-1/3 space-y-6">
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">{t("Total Experience")}</div>
                    <div className="text-sm font-extrabold text-gray-900">{t("5.2 Years")}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">{t("Relevant Experience")}</div>
                    <div className="text-sm font-extrabold text-gray-900">{t("4.6 Years")}</div>
                  </div>
                </div>
                
                <div className="sm:w-2/3 space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {cData.previousExperience?.map((exp, idx) => {
                    const colors = [
                      { bg: 'bg-orange-100', text: 'text-orange-600' },
                      { bg: 'bg-blue-100', text: 'text-blue-600' },
                      { bg: 'bg-red-100', text: 'text-red-600' },
                      { bg: 'bg-emerald-100', text: 'text-emerald-600' }
                    ];
                    const color = colors[idx % colors.length];
                    const initial = exp.company ? exp.company.charAt(0).toUpperCase() : 'C';

                    return (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${color.bg} ${color.text} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm font-bold text-xl z-10`}>
                          {initial}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 shadow-sm bg-white">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                            <div className="font-bold text-gray-900 text-sm">{exp.company}</div>
                            <div className="text-[10px] font-bold text-gray-400">{exp.duration}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600">{exp.role}</div>
                            <div className="text-[10px] font-bold text-gray-400">{exp.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="text-center pt-2">
                    <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto">{t("View Full Experience")}<FiArrowUpRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Education & Projects Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-4">{t("Education")}</h3>
                <div className="space-y-4 mb-4">
                  {cData.education?.length > 0 ? cData.education.map((edu, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-bold text-gray-900 mb-0.5">{edu.degree}</div>
                      <div className="text-[10px] font-semibold text-gray-400 mb-1">{edu.year || 'N/A'}</div>
                      <div className="text-[11px] text-gray-600">{edu.institution}</div>
                    </div>
                  )) : (
                    <div className="text-[11px] text-gray-500 italic">{t("No education details provided")}</div>
                  )}
                </div>
                <div className="mt-auto text-center pt-4 border-t border-gray-50">
                  <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto">{t("View All Education")}<FiArrowUpRight />
                  </button>
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-4">{t("Projects (Top 2)")}</h3>
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-bold text-gray-900 mb-1">{t("Swiggy Food Order Platform")}</div>
                    <div className="text-[10px] text-gray-500 mb-2">{t("React, Redux, Node.js")}</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <FiStar className="w-3 h-3 fill-emerald-600" />{t("Featured")}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-bold text-gray-900 mb-1">{t("Swiggy Instamart Redesign")}</div>
                    <div className="text-[10px] text-gray-500 mb-2">{t("Next.js, Tailwind CSS")}</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <FiStar className="w-3 h-3 fill-emerald-600" />{t("Featured")}</div>
                  </div>
                </div>
                <div className="mt-auto text-center pt-4 border-t border-gray-50">
                  <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto">{t("View All Projects")}<FiArrowUpRight />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* MIDDLE COLUMN (Actions & Fit) */}
          <div className="2xl:col-span-1 space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{t("Quick Actions")}</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                  <FiCalendar />{t("Schedule Interview")}</button>
                <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                  <FiPhoneCall />{t("Contact Candidate")}</button>
                <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                  <FiStar />{t("Add to Shortlist")}</button>
                
                {/* Mock Dropdown */}
                <div className="pt-2 relative">
                  <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition">{t("More Actions")}<FiChevronDown />
                  </button>
                  {/* Overlay mock
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg p-2 z-10">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"><FiShare2 /> Move to Talent Pool</button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"><FiMessageCircle /> Send Message</button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"><FiFileText /> Add Note</button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"><FiX /> Reject Candidate</button>
                  </div>
                  */}
                </div>
              </div>
            </div>

            {/* Candidate Fit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900">{t("Candidate Fit")}</h3>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-400 flex items-center justify-center text-lg font-extrabold text-emerald-600">
                  95%
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-600 mb-1">{t("Excellent Match")}</div>
                  <div className="text-[10px] text-gray-500">{t("High match with your job requirements.")}</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-900 mb-3">{t("Top Matching Skills")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold"><FiCheckCircle className="text-emerald-500 w-3 h-3" />{t("React")}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold"><FiCheckCircle className="text-emerald-500 w-3 h-3" />{t("TypeScript")}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold"><FiCheckCircle className="text-emerald-500 w-3 h-3" />{t("Next.js")}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold"><FiCheckCircle className="text-emerald-500 w-3 h-3" />{t("JavaScript")}</div>
                </div>
              </div>

              <button className="w-full text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1">{t("AI Match Breakdown")}<FiArrowUpRight />
              </button>
            </div>

            {/* AI Recommended Next Step */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <HiSparkles className="text-indigo-600" />{t("AI Recommended Next Step")}</h3>
              <p className="text-xs text-indigo-800/80 leading-relaxed mb-4">{t(
                "Ankit is a strong match for Senior React Developer roles. We recommend scheduling a technical interview."
              )}</p>
              <button className="w-full bg-white text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-indigo-200 shadow-sm hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                <HiSparkles />{t("Generate Interview Kit")}</button>
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
                  className={`flex-1 py-4 text-xs font-bold transition border-b-2 ${activeSidebarTab === 'AI Insights' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                >{t("AI Insights")}</button>
                <button 
                  onClick={() => setActiveSidebarTab('Activity')}
                  className={`flex-1 py-4 text-xs font-bold transition border-b-2 ${activeSidebarTab === 'Activity' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                >{t("Activity")}</button>
              </div>

              {activeSidebarTab === 'AI Insights' && (
                <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                  
                  {/* AI Summary */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2"><HiSparkles className="text-indigo-600" />{t("AI Summary")}</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-4">{t(
                      "Ankit is a strong frontend engineer with expertise in modern React ecosystem. He has worked on high-scale products and shows consistent growth."
                    )}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">{t("Strong Technical Fit")}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">{t("Good Culture Fit")}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">{t("Immediate Joiner")}</span>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-3">{t("Strengths")}</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-[11px] text-gray-700"><FiCheckCircle className="text-emerald-500 w-3.5 h-3.5 shrink-0 mt-0.5" />{t("Strong in React ecosystem")}</li>
                      <li className="flex items-start gap-2 text-[11px] text-gray-700"><FiCheckCircle className="text-emerald-500 w-3.5 h-3.5 shrink-0 mt-0.5" />{t("Experience in scalable applications")}</li>
                      <li className="flex items-start gap-2 text-[11px] text-gray-700"><FiCheckCircle className="text-emerald-500 w-3.5 h-3.5 shrink-0 mt-0.5" />{t("Quick learner and problem solver")}</li>
                    </ul>
                  </div>

                  {/* Potential Concerns */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-900">{t("Potential Concerns")}</h4>
                      <FiChevronDown className="text-gray-400" />
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-gray-700">
                      <HiOutlineExclamationCircle className="text-orange-500 w-4 h-4 shrink-0" /> 
                      <div>{t("Higher salary expectation")}<br/>
                        <span className="text-gray-500">{t("(₹24 - 26 LPA)")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resume */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-3">{t("Resume")}</h4>
                    {cData.resumeUrl ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                            <FiFileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{(cData.profileName?.replace(/\s+/g, '_') || "Candidate") + "_Resume"}</div>
                            <div className="text-[9px] text-gray-500">{t("Available")}</div>
                          </div>
                        </div>
                        <a href={cData.resumeUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600">
                          <FiDownload className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 italic">{t("No resume uploaded")}</div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-900">{t("Notes")}</h4>
                      <button className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"><FiPlus />{t("Add Note")}</button>
                    </div>
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <p className="text-[11px] text-gray-700 leading-relaxed mb-2">{t("Good communication in initial call. Available for interview this week.")}</p>
                      <div className="text-[9px] font-semibold text-gray-400">{t("- Rahul Verma (Today, 10:30 AM)")}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-900">{t("Tags")}</h4>
                      <button className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"><FiPlus />{t("Add Tag")}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{t("React Developer")}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{t("Immediate Joiner")}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{t("High Potential")}</span>
                    </div>
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

export default CandidateDetails;
