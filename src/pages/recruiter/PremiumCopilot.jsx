import React, { useState } from 'react';
import { 
  Search, Wand2, Briefcase, Zap, TrendingUp, AlertTriangle, 
  Users, CheckCircle, Clock, ShieldAlert, Award, FileText, ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';
import recruiterAPI from '../../services/api';

const PremiumCopilot = () => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'jd'
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  
  // Tab 2: JD Generator
  const [jdPrompt, setJdPrompt] = useState('');
  const [generatedJd, setGeneratedJd] = useState('');
  const [jdLoading, setJdLoading] = useState(false);

  // Candidate Expanded State
  const [expandedId, setExpandedId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const handleCopilotSearch = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    setLoading(true);
    try {
      // Create a mock API call for the copilot search if recruiterAPI doesn't have it yet
      // Fallback using fetch if API client isn't updated
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruiter-copilot/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ command })
      });
      const data = await response.json();
      if (data.success) {
        setCandidates(data.data);
        toast.success(data.message || 'Copilot search executed successfully');
      } else {
        toast.error(data.message || 'Search failed');
      }
    } catch (err) {
      toast.error('Error executing Copilot Command');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateJD = async (e) => {
    e.preventDefault();
    if (!jdPrompt.trim()) return;
    
    setJdLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruiter-copilot/generate-jd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: jdPrompt })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedJd(data.data.jobDescription);
        toast.success('Job Description Generated!');
      } else {
        toast.error(data.message || 'Generation failed');
      }
    } catch (err) {
      toast.error('Error generating JD');
    } finally {
      setJdLoading(false);
    }
  };

  const loadCandidateAnalytics = async (candidateId) => {
    if (expandedId === candidateId) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(candidateId);
    if (analyticsData[candidateId]) return; // Already loaded

    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruiter-copilot/analytics/${candidateId}?querySkills=${command}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(prev => ({ ...prev, [candidateId]: data.data }));
      }
    } catch (err) {
      toast.error('Failed to load candidate analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleBulkUnlock = async () => {
    toast.success('Bulk Unlock Feature is ready for integration');
  };

  const handleSimilarCandidates = async (e, candidateId) => {
    e.stopPropagation(); // prevent opening drawer
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruiter-copilot/similar/${candidateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCandidates(data.data);
        toast.success(`Found ${data.data.length} similar candidates!`);
      } else {
        toast.error(data.message || 'Failed to find similar candidates');
      }
    } catch (err) {
      toast.error('Error finding similar candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandSearch = async () => {
    const querySkills = command ? command.split(' ') : ['Developer'];
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruiter-copilot/expand-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ querySkills })
      });
      const data = await response.json();
      if (data.success) {
        setCandidates(data.data);
        toast.success(`Search expanded! Found ${data.data.length} hidden talents.`);
      } else {
        toast.error(data.message || 'Failed to expand search');
      }
    } catch (err) {
      toast.error('Error expanding search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-indigo-600" />
          AI Recruiter Command Center
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          The Copilot Upgrade: Use natural language commands to search, filter, rank, and predict candidate success instantly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('search')}
          className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'search' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Copilot Search & Analytics
        </button>
        <button
          onClick={() => setActiveTab('jd')}
          className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'jd' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          AI Job Description Generator
        </button>
      </div>

      {/* TAB 1: SEARCH & ANALYTICS */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          
          {/* Copilot Search Bar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={handleCopilotSearch} className="flex gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                  placeholder='Try: "Need 5 React Developers in Bangalore under 18 LPA with 30 days notice"'
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-4 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Execute Command'}
                {!loading && <Zap className="ml-2 w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Quick Filters (Smart Recruitment Filters) */}
          <div className="flex gap-3 flex-wrap">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
              <Clock className="w-3 h-3 mr-1" /> Notice &lt; 30 Days
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-pointer hover:bg-green-200">
              <Briefcase className="w-3 h-3 mr-1" /> Exp Salary &lt; 15 LPA
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200">
              Remote Only
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 cursor-pointer hover:bg-orange-200">
              Immediate Joiner
            </span>
          </div>

          {/* Results Area */}
          {candidates.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-lg font-medium text-gray-900">Found {candidates.length} Candidate Matches</h3>
                <button onClick={handleBulkUnlock} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Bulk Unlock Contacts
                </button>
              </div>

              {candidates.map((candidate) => (
                <div key={candidate._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Candidate Row */}
                  <div className="p-6 flex items-start gap-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => loadCandidateAnalytics(candidate.user?._id)}>
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-lg shrink-0">
                      #{candidate.rankMarker}
                    </div>
                    
                    {/* Profile Photo */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {candidate.user?.profilePicture ? (
                        <img src={candidate.user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-gray-100">
                          {candidate.user?.firstName?.charAt(0) || ''}{candidate.user?.lastName?.charAt(0) || ''}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-gray-900">
                          {candidate.user?.firstName} {candidate.user?.lastName}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleSimilarCandidates(e, candidate.user?._id)}
                            className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 font-medium mr-2 border border-indigo-200 transition-colors"
                          >
                            Find Similar
                          </button>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {candidate.aiMatchScore}% Match
                          </span>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === candidate.user?._id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-500">
                        {candidate.city || 'Location N/A'} • {candidate.experience || 'Experience N/A'}
                      </div>
                      <div className="mt-1 text-xs flex items-center gap-3">
                        {(() => {
                          const email = candidate.user?.email || candidate.email || '';
                          const phone = candidate.user?.phone || candidate.phone || '';
                          const isEmailLocked = email.includes('*');
                          const isPhoneLocked = phone.includes('*');
                          return (
                            <>
                              <span className={`flex items-center gap-1 ${isEmailLocked ? 'text-indigo-400 blur-[0.5px] select-none' : 'text-gray-500'}`}>
                                {email || 'Email hidden'} {isEmailLocked && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded">🔒</span>}
                              </span>
                              <span className={`flex items-center gap-1 ${isPhoneLocked ? 'text-indigo-400 blur-[0.5px] select-none' : 'text-gray-500'}`}>
                                {phone || 'Phone hidden'} {isPhoneLocked && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded">🔒</span>}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* Missing Skills Warning */}
                        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Missing: {candidate.missingSkills.join(', ')}
                          </span>
                        )}
                        {/* Available Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            Skills: {candidate.skills.slice(0, 5).join(', ')}{candidate.skills.length > 5 ? '...' : ''}
                          </span>
                        )}
                        {/* Availability Meter Status */}
                        {candidate.jobSearchStatus && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                            {candidate.jobSearchStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Analytics Drawer */}
                  {expandedId === candidate.user?._id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-6">
                      {analyticsLoading ? (
                        <div className="animate-pulse flex space-x-4">
                          <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                          </div>
                        </div>
                      ) : analyticsData[candidate.user?._id] ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Col 1: Hiring Success Score */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h5 className="font-semibold text-gray-900 flex items-center text-sm mb-4">
                              <Award className="w-4 h-4 mr-2 text-indigo-500" />
                              Hiring Success Score
                            </h5>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-3xl font-black text-indigo-600">{analyticsData[candidate.user._id].hiringSuccessScore.total}%</span>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Probability</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs"><span className="text-gray-500">Skill Match</span><span className="font-medium">{analyticsData[candidate.user._id].hiringSuccessScore.skillMatch}%</span></div>
                              <div className="flex justify-between text-xs"><span className="text-gray-500">Joining Prob</span><span className="font-medium">{analyticsData[candidate.user._id].hiringSuccessScore.joiningProb}%</span></div>
                              <div className="flex justify-between text-xs"><span className="text-gray-500">Response Prob</span><span className="font-medium">{analyticsData[candidate.user._id].hiringSuccessScore.responseProb}%</span></div>
                              <div className="flex justify-between text-xs"><span className="text-gray-500">Retention Prob</span><span className="font-medium">{analyticsData[candidate.user._id].hiringSuccessScore.retentionProb}%</span></div>
                            </div>
                          </div>

                          {/* Col 2: Hiring Risk Dashboard */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h5 className="font-semibold text-gray-900 flex items-center text-sm mb-4">
                              <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
                              Hiring Risk Dashboard
                            </h5>
                            <div className="space-y-4 mt-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Counter Offer Risk</span>
                                  <span className={`font-bold ${analyticsData[candidate.user._id].hiringRisk.counterOfferRisk === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                                    {analyticsData[candidate.user._id].hiringRisk.counterOfferRisk}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1"><div className={`h-1.5 rounded-full ${analyticsData[candidate.user._id].hiringRisk.counterOfferRisk === 'High' ? 'bg-red-500 w-4/5' : 'bg-green-500 w-1/5'}`}></div></div>
                                {candidate.counterOfferReason && (
                                  <p className="text-[10px] text-gray-500 italic mt-1 leading-tight">{candidate.counterOfferReason}</p>
                                )}
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Early Exit Risk</span>
                                  <span className={`font-bold ${analyticsData[candidate.user._id].hiringRisk.earlyExitRisk === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                                    {analyticsData[candidate.user._id].hiringRisk.earlyExitRisk}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1"><div className={`h-1.5 rounded-full ${analyticsData[candidate.user._id].hiringRisk.earlyExitRisk === 'High' ? 'bg-red-500 w-4/5' : 'bg-green-500 w-1/5'}`}></div></div>
                                {candidate.earlyExitReason && (
                                  <p className="text-[10px] text-gray-500 italic mt-1 leading-tight">{candidate.earlyExitReason}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Team Fit Predictor */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h5 className="font-semibold text-gray-900 flex items-center text-sm mb-4">
                              <Users className="w-4 h-4 mr-2 text-blue-500" />
                              Team Fit Predictor
                            </h5>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Collaboration Index</span>
                                <span className="text-xs font-bold text-gray-900">{analyticsData[candidate.user._id].teamFitPredictor.collaborationIndex}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Communication Fit</span>
                                <span className="text-xs font-bold text-gray-900">{analyticsData[candidate.user._id].teamFitPredictor.communicationFit}/100</span>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h5 className="text-xs font-semibold text-gray-500 mb-1">AI Salary Prediction</h5>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Est. Asking:</span>
                                <span className="font-bold">₹{(analyticsData[candidate.user._id].salaryPrediction.candidateAsking / 100000).toFixed(1)} LPA</span>
                              </div>
                            </div>
                            {analyticsData[candidate.user._id].reputation && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h5 className="text-xs font-semibold text-gray-500 mb-2">Candidate Reputation</h5>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {analyticsData[candidate.user._id].reputation.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">
                                  {analyticsData[candidate.user._id].reputation.notes}
                                </p>
                              </div>
                            )}
                          </div>

                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Expand Search Button */}
              <div className="flex justify-center mt-6">
                <button 
                  onClick={handleExpandSearch}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-indigo-200 text-sm font-medium rounded-lg shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Too few results? Expand Search using AI
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: JD GENERATOR */}
      {activeTab === 'jd' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Generate Professional Job Description in Seconds
            </h2>
            <form onSubmit={handleGenerateJD} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Briefly describe the role</label>
                <textarea
                  value={jdPrompt}
                  onChange={(e) => setJdPrompt(e.target.value)}
                  rows="3"
                  className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="E.g., We need a Senior Frontend Developer with 5 years experience in React and Node.js. They will lead a team of 3 and work on our core trading platform..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={jdLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {jdLoading ? 'Generating via OpenAI...' : 'Generate Job Description'}
              </button>
            </form>
          </div>

          {generatedJd && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 prose max-w-none">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedJd);
                    toast.success('Copied to clipboard!');
                  }}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
                >
                  Copy Markdown
                </button>
              </div>
              <div dangerouslySetInnerHTML={{ __html: generatedJd.replace(/\n/g, '<br/>') }} />
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PremiumCopilot;
