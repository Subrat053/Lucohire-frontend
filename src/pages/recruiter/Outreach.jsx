import React, { useState, useEffect } from 'react';
import { FiSend, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Outreach = () => {
  const [jobs, setJobs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runningCampaign, setRunningCampaign] = useState(false);

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
      setJobs(jobsRes.data?.data || []); // Accessing data array from standard response
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
      const res = await recruiterAPI.runOutreachCampaign(selectedJob._id);
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

  const openModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const getJobCampaignCount = (jobId) => {
    return campaigns.filter(c => c.jobId?._id === jobId || c.jobId === jobId).length;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Outreach Engine</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl">
          Automate candidate sourcing. Run targeted email campaigns to matching candidates for your active job postings.
        </p>
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
                <FiUsers className="text-indigo-600" /> Active Job Campaigns
              </h2>
              
              {jobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                  <FiClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-bold mb-1">No Active Jobs</h3>
                  <p className="text-gray-500 text-sm">Post a job to start running outreach campaigns.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map(job => (
                    <div key={job._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                          <p className="text-xs font-medium text-gray-500 mt-1">{job.location} • {job.workMode}</p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          {job.skills?.length || 0} Skills
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-6">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Matches found</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="text-xs font-semibold text-gray-500">
                          {getJobCampaignCount(job._id)} runs
                        </div>
                        <button 
                          onClick={() => openModal(job)}
                          className="bg-gray-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 group-hover:scale-105"
                        >
                          <FiSend className="w-4 h-4" /> Run Campaign
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: HISTORY */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiClock className="text-indigo-600" /> Campaign History
              </h2>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {campaigns.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm font-medium">No campaigns run yet.</p>
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
                            <FiUsers className="w-3.5 h-3.5" /> {camp.candidatesContacted} contacted
                          </span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
            <div className="bg-indigo-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiSparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold">Run Outreach Campaign</h2>
              <p className="text-indigo-100 text-sm mt-1">For: {selectedJob.title}</p>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
                We will identify all candidates whose skills match the requirements for this job and send them a highly personalized email inviting them to view the job post and apply.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-gray-700">Required Skills</span>
                  <span className="font-bold text-indigo-600">{selectedJob.skills?.length || 0}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedJob.skills?.slice(0, 4).map(s => (
                    <span key={s} className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">{s}</span>
                  ))}
                  {selectedJob.skills?.length > 4 && (
                    <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">+{selectedJob.skills.length - 4} more</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={runningCampaign}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRunCampaign}
                  disabled={runningCampaign}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {runningCampaign ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <><FiSend className="w-4 h-4" /> Start Campaign</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outreach;
