import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect } from 'react';
import { FiSend, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Outreach = () => {
  const {
    t
  } = useTranslation();

  const [jobs, setJobs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runningCampaign, setRunningCampaign] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, campaignsRes] = await Promise.all([
        recruiterAPI.getJobs(),
        recruiterAPI.getOutreachCampaigns()
      ]);
      setJobs(jobsRes.data || []);
      setCampaigns(campaignsRes.data || []);
    } catch (err) {
      toast.error('Failed to load outreach data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCampaign = async () => {
    if (!selectedJob) return;
    try {
      setRunningCampaign(true);
      const res = await recruiterAPI.runOutreachCampaign(selectedJob._id, { messageTemplate });
      toast.success('Campaign started successfully!');
      
      // Update UI
      setCampaigns([res.data.campaign, ...campaigns]);
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to start campaign');
    } finally {
      setRunningCampaign(false);
    }
  };

  const openModal = async (job) => {
    setSelectedJob(job);
    setPreviewData(null);
    setMessageTemplate(`Hi [Candidate Name],\n\nWe saw your profile on Lucohire and noticed you have great experience with ${job.skill || 'these skills'}. We are currently hiring for a ${job.title} and think you'd be a great fit.\n\nTake a look at the job post below and let us know if you're interested!\n\nBest,\n[Recruiter Name]`);
    setIsModalOpen(true);
    
    try {
      setLoadingPreview(true);
      const res = await recruiterAPI.getOutreachPreview(job._id);
      setPreviewData(res.data);
    } catch (error) {
      toast.error('Failed to load candidate preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const getJobCampaignCount = (jobId) => {
    return campaigns.filter(c => c.jobId?._id === jobId || c.jobId === jobId).length;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t("Outreach Engine")}</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl">{t(
          "Automate candidate sourcing. Run targeted email campaigns to matching candidates for your active job postings."
        )}</p>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* LEFT: JOB LIST */}
            <div className="xl:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiUsers className="text-indigo-600" />{t("Active Job Campaigns")}</h2>
              
              {jobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                  <FiClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-bold mb-1">{t("No Active Jobs")}</h3>
                  <p className="text-gray-500 text-sm">{t("Post a job to start running outreach campaigns.")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map(job => (
                    <div key={job._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                          <p className="text-xs font-medium text-gray-500 mt-1">{typeof job.location === 'object' ? (job.location?.city || job.location?.name || job.location?.formattedAddress) : job.location} • {job.workMode}</p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          {job.skill ? 1 : 0}{t("Skill")}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-6">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{t("Matches found")}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="text-xs font-semibold text-gray-500">
                          {getJobCampaignCount(job._id)}{t("runs")}</div>
                        <button 
                          onClick={() => openModal(job)}
                          className="bg-gray-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 group-hover:scale-105"
                        >
                          <FiSend className="w-4 h-4" />{t("Run Campaign")}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: HISTORY */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiClock className="text-indigo-600" />{t("Campaign History")}</h2>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {campaigns.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm font-medium">{t("No campaigns run yet.")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {campaigns.map(camp => (
                      <div key={camp._id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900 text-sm">{camp.jobTitle || camp.jobId?.title || 'Unknown Job'}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {camp.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1 font-medium">
                            <FiUsers className="w-3.5 h-3.5" /> {camp.candidatesContacted}{t("contacted")}</span>
                          <span>{new Date(camp.runDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* CONFIRMATION MODAL */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden transform transition-all animate-fade-in-up">
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <HiSparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t("Outreach Campaign")}</h2>
                  <p className="text-indigo-100 text-xs">{t("For:")}{selectedJob.title}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Side: Preview */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">{t("Candidate Matches")}{previewData && (
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">
                      {previewData.totalMatchCount}{t("Found")}</span>
                  )}
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 h-64 overflow-y-auto custom-scrollbar">
                  {loadingPreview ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : previewData?.previewCandidates?.length > 0 ? (
                    <div className="space-y-3">
                      {previewData.previewCandidates.map(c => (
                        <div key={c._id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <img src={c.avatar || `https://ui-avatars.com/api/?name=${c.name}&background=e0e7ff&color=4f46e5`} alt={c.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{c.name}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{c.role}</p>
                          </div>
                        </div>
                      ))}
                      {previewData.totalMatchCount > 5 && (
                        <div className="text-center pt-2">
                          <p className="text-xs font-medium text-gray-500">{t("And")}{previewData.totalMatchCount - 5}{t("more candidates...")}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-full text-center">
                      <FiUsers className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">{t("No candidates match the required skill for this job.")}</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                   <span className="font-semibold text-gray-700">{t("Required Skill:")}</span>
                   {selectedJob.skill && (
                     <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">{selectedJob.skill}</span>
                   )}
                </div>
              </div>

              {/* Right Side: Message Editor */}
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-3">{t("Email Template")}</h3>
                <textarea
                  className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none custom-scrollbar"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder={t("Type your outreach message here...")}
                />
                <p className="text-[10px] text-gray-400 mt-2 leading-tight">{t("Variables like")}<code className="bg-gray-100 px-1 py-0.5 rounded">{t("[Candidate Name]")}</code>{t("and")}<code className="bg-gray-100 px-1 py-0.5 rounded">{t("[Recruiter Name]")}</code>{t("will be auto-filled by the engine.")}</p>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={runningCampaign}
                className="px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >{t("Cancel")}</button>
              <button 
                onClick={handleRunCampaign}
                disabled={runningCampaign || loadingPreview || !previewData?.totalMatchCount}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningCampaign ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <><FiSend className="w-4 h-4" />{t("Start Campaign")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outreach;
