import React, { useState, useEffect } from 'react';
import { FiUsers, FiAward, FiChevronDown, FiChevronUp, FiLoader } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TalentPool = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [runningAI, setRunningAI] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await recruiterAPI.getTalentPoolJobs();
      setJobs(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setExpandedJobId(res.data.data[0]._id); // Expand first job by default
      }
    } catch (err) {
      toast.error('Failed to load talent pool data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAI = async (jobId, e) => {
    e.stopPropagation();
    try {
      setRunningAI(jobId);
      await recruiterAPI.runAIEvaluation(jobId);
      toast.success('AI Analysis complete!');
      await fetchData(); // Refresh data to show new scores
    } catch (err) {
      toast.error('Failed to run AI analysis');
    } finally {
      setRunningAI(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            AI Talent Pool <HiSparkles className="text-indigo-600 w-8 h-8" />
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Automatically rank and evaluate the top candidates for every job you post using Lucohire's AI Matching Engine.
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">No Jobs Found</h3>
            <p className="text-gray-500 text-sm">Post a job to start building your AI-ranked talent pool.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => {
              const isExpanded = expandedJobId === job._id;
              const hasCandidates = job.candidates && job.candidates.length > 0;
              const topCandidates = job.aiTopCandidates || [];
              const hasEvaluations = topCandidates.length > 0;

              return (
                <div key={job._id} className={`bg-white rounded-2xl border ${isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-gray-200 shadow-sm'} transition-all overflow-hidden`}>
                  
                  {/* ACCORDION HEADER */}
                  <div 
                    onClick={() => setExpandedJobId(isExpanded ? null : job._id)}
                    className="p-6 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">{job.location || 'Remote'}</span>
                        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {job.candidates?.length || 0} Total Applicants
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {hasCandidates && !hasEvaluations && (
                        <button 
                          onClick={(e) => handleRunAI(job._id, e)}
                          disabled={runningAI === job._id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2"
                        >
                          {runningAI === job._id ? (
                            <><FiLoader className="w-4 h-4 animate-spin" /> Analyzing...</>
                          ) : (
                            <><HiSparkles className="w-4 h-4" /> Run AI Analysis</>
                          )}
                        </button>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CONTENT - AI TOP 5 */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                      
                      {!hasCandidates ? (
                        <div className="text-center py-8 text-gray-500 text-sm font-medium">
                          No candidates have applied for this job yet.
                        </div>
                      ) : !hasEvaluations ? (
                        <div className="text-center py-8 text-gray-500 text-sm font-medium">
                          Click "Run AI Analysis" to evaluate and rank these applicants.
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-6">
                            <FiAward className="text-amber-500 w-5 h-5" /> Top {topCandidates.length} Candidates
                          </h3>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {topCandidates.map((evaluation, index) => {
                              const candidate = evaluation.candidateId?.user;
                              if (!candidate) return null;

                              return (
                                <div key={evaluation._id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition">
                                  
                                  {/* Left: Candidate Info & Score */}
                                  <div className="flex flex-col md:w-1/4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6 shrink-0">
                                    <div className="flex items-center gap-4 mb-4">
                                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                                        {candidate.name?.charAt(0) || '?'}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-gray-900">{candidate.name || 'Candidate'}</h4>
                                        <span className="text-xs text-gray-500">Rank #{index + 1}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-auto">
                                      <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">AI Match Score</div>
                                      <div className="flex items-end gap-1">
                                        <span className="text-3xl font-black text-emerald-600 leading-none">{evaluation.score}</span>
                                        <span className="text-sm font-bold text-gray-400 mb-1">/100</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: AI Reasoning */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <HiSparkles className="text-indigo-500 w-4 h-4" />
                                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">AI Reasoning</span>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {evaluation.reasoning}
                                    </p>
                                    
                                    <div className="mt-4 flex gap-3">
                                      <button className="text-indigo-600 text-xs font-bold hover:underline">View Full Profile</button>
                                      <button className="text-gray-500 text-xs font-bold hover:underline">Download Resume</button>
                                    </div>
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentPool;
