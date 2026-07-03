import React, { useState, useEffect } from 'react';
import { HiPlus, HiPlay, HiDatabase, HiCog, HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { adminAPI, ADMIN_API } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DataPipeline = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('runner');

  // Wizard Trigger State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [jobType, setJobType] = useState('Full-Time');
  const [activeFilters, setActiveFilters] = useState(false);
  const [limit, setLimit] = useState(10);
  const [running, setRunning] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [ingestionResult, setIngestionResult] = useState(null);

  // New Config State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    country: 'India',
    type: 'apify_actor',
    endpointOrActorId: '',
    aiPromptTemplate: 'Extract the following fields from the JSON: name, email, phone, jobTitle, skills(array). Return ONLY valid JSON array.'
  });

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await ADMIN_API.get('/admin/data-pipeline/configs');
      if (data.success) {
        setConfigs(data.configs);
        if (data.configs.length > 0) setSelectedConfig(data.configs[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const [editingConfigId, setEditingConfigId] = useState(null);

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      if (editingConfigId) {
        const { data } = await ADMIN_API.put(`/admin/data-pipeline/configs/${editingConfigId}`, newConfig);
        if (data.success) {
          toast.success('Source updated successfully');
          setShowAddModal(false);
          setEditingConfigId(null);
          fetchConfigs();
        } else {
          toast.error(data.error || 'Failed to update source');
        }
      } else {
        const { data } = await ADMIN_API.post('/admin/data-pipeline/configs', newConfig);
        if (data.success) {
          toast.success('Source added successfully');
          setShowAddModal(false);
          fetchConfigs();
        } else {
          toast.error(data.error || 'Failed to add source');
        }
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    try {
      const { data } = await ADMIN_API.delete(`/admin/data-pipeline/configs/${id}`);
      if (data.success) {
        toast.success('Configuration deleted');
        if (selectedConfig === id) setSelectedConfig('');
        fetchConfigs();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error while deleting');
    }
  };

  const openEditModal = (conf) => {
    setEditingConfigId(conf._id);
    setNewConfig({
      name: conf.name,
      country: conf.country,
      type: conf.type,
      endpointOrActorId: conf.endpointOrActorId,
      apiMethod: conf.apiMethod || 'GET',
      apiHeaders: conf.apiHeaders || '',
      actorInputSchema: conf.actorInputSchema || '',
      aiPromptTemplate: conf.aiPromptTemplate
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingConfigId(null);
    setNewConfig({
      name: '',
      country: 'India',
      type: 'apify_actor',
      endpointOrActorId: '',
      apiMethod: 'GET',
      apiHeaders: '',
      actorInputSchema: '',
      aiPromptTemplate: 'Extract the following fields from the JSON: name, email, phone, jobTitle, skills(array). Return ONLY valid JSON array.'
    });
    setShowAddModal(true);
  };

  const handleRunIngestion = async (e, isPreview = false) => {
    if (e) e.preventDefault();
    if (!selectedConfig) return toast.error('Please select a source configuration');
    
    setRunning(true);
    if (!isPreview) setIngestionResult(null);
    else setPreviewResult(null);

    try {
      const payload = { 
        configId: selectedConfig, 
        keywords, 
        location,
        experience,
        jobType,
        activeFilters,
        limit,
        isPreview
      };

      const { data } = await ADMIN_API.post('/admin/data-pipeline/trigger', payload);
      
      if (data.success) {
        toast.success(data.message);
        if (isPreview) {
          setPreviewResult(data.candidates);
        } else {
          setIngestionResult(data.candidates);
          setCurrentStep(7); // Final step
        }
      } else {
        toast.error(data.message || data.error || 'Ingestion failed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Pipeline Execution Error';
      console.error('Pipeline Execution Error:', err.response?.data || err);
      toast.error(errMsg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiSparkles className="text-indigo-600" />
            AI Data Ingestion Pipeline
          </h1>
          <p className="text-gray-500 mt-1">Dynamically fetch, normalize, and queue external candidates.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <HiPlus /> Add Dynamic Source
        </button>
      </div>

      {/* WIZARD START */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Progress Bar Header */}
        <div className="bg-gray-50 border-b p-4 md:p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HiPlay className="text-emerald-500" />
              Ingestion CRM Wizard
            </h2>
            <span className="text-sm font-medium text-gray-500">Step {currentStep} of 7</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(currentStep / 7) * 100}%` }}></div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800 text-lg">Select Target Country</h3>
              <select className="w-full border-gray-300 rounded-lg p-3 text-gray-700 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
                <option value="UAE">UAE</option>
              </select>
              <button onClick={() => setCurrentStep(2)} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium mt-4">Next Step →</button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800 text-lg">Select Platform/Source for {selectedCountry}</h3>
              <select className="w-full border-gray-300 rounded-lg p-3 text-gray-700 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" value={selectedConfig} onChange={e => setSelectedConfig(e.target.value)}>
                <option value="">-- Select Source --</option>
                {configs.filter(c => c.country === selectedCountry).map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.type})</option>
                ))}
              </select>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCurrentStep(1)} className="flex-1 md:flex-none bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium">Back</button>
                <button onClick={() => { if(selectedConfig) setCurrentStep(3); else toast.error('Select a source'); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium">Next Step →</button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800 text-lg">Define Target Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Skills / Keywords</label>
                  <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 bg-gray-50" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="e.g. React Developer" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location Specific</label>
                  <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 bg-gray-50" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Remote, New York" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Experience Required</label>
                  <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 bg-gray-50" value={experience} onChange={e=>setExperience(e.target.value)} placeholder="e.g. 5+ years" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Job Type</label>
                  <select className="w-full border-gray-300 rounded-lg p-2.5 bg-gray-50" value={jobType} onChange={e=>setJobType(e.target.value)}>
                    <option>Full-Time</option>
                    <option>Contract</option>
                    <option>Part-Time</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setCurrentStep(2)} className="flex-1 md:flex-none bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium">Back</button>
                <button onClick={() => setCurrentStep(4)} className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium">Next Step →</button>
              </div>
            </div>
          )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 text-lg">Active Candidate Filters</h3>
            <label className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={activeFilters} onChange={e=>setActiveFilters(e.target.checked)} className="mt-1 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
              <div>
                <p className="font-medium text-gray-900">Filter for highly active candidates only</p>
                <p className="text-sm text-gray-500 mt-1">Excludes outdated profiles and ensures higher response rates.</p>
              </div>
            </label>
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <button onClick={() => setCurrentStep(3)} className="w-full md:w-auto bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium">Back</button>
              <button onClick={() => setCurrentStep(5)} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium">Next Step →</button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 text-lg">Set Budget / Fetch Quota</h3>
            <input type="number" className="w-full border-gray-300 rounded-lg p-3 text-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" value={limit} onChange={e=>setLimit(e.target.value)} min="1" max="5000" />
            <p className="text-sm text-gray-500">Max number of profiles to import in this run.</p>
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <button onClick={() => setCurrentStep(4)} className="w-full md:w-auto bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium">Back</button>
              <button onClick={() => setCurrentStep(6)} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium">Next Step →</button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 text-lg">Generate Preview & Confirm</h3>
            <p className="text-sm text-gray-600">Please fetch a small preview to verify data accuracy before running the full ingestion.</p>
            
            {previewResult && (
              <div className="bg-emerald-50 p-4 md:p-6 rounded-lg border border-emerald-100 text-sm mt-4 shadow-inner">
                <p className="font-bold text-emerald-800 mb-3 text-base">Preview Success ({previewResult.length} profiles sampled)</p>
                <div className="space-y-2">
                  {previewResult.map((c, i) => (
                    <div key={i} className="pb-3 border-b border-emerald-200/50 last:border-0 last:pb-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                      <span className="font-medium text-gray-900">{c.name}</span>
                      <span className="hidden md:inline text-gray-400">•</span>
                      <span className="text-gray-700">{c.jobTitle}</span>
                      <span className="hidden md:inline text-gray-400">•</span>
                      <span className="text-gray-500">{c.email || c.phone || 'No Contact Info'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setCurrentStep(5)} className="w-full md:w-auto bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium">Back</button>
              <button onClick={(e) => handleRunIngestion(e, true)} disabled={running} className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors">
                {running ? <LoadingSpinner /> : 'Generate Preview Sample'}
              </button>
              <button onClick={(e) => handleRunIngestion(e, false)} disabled={running || !previewResult} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm">
                Final Approve & Fetch
              </button>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4 text-center py-8 md:py-12">
            <div className="mx-auto bg-green-100 w-20 h-20 flex items-center justify-center rounded-full mb-6 shadow-sm">
              <HiDatabase className="text-green-600 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Ingestion Complete!</h3>
            <p className="text-gray-600 max-w-md mx-auto">The candidates have been saved to the Staging Table, scored, and deduplicated.</p>
            <p className="text-gray-600 max-w-md mx-auto">Verification Emails & WhatsApp links are being sent out automatically.</p>
            <button onClick={() => { setCurrentStep(1); setIngestionResult(null); setPreviewResult(null); }} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium mt-8 shadow-sm">Start New Ingestion</button>
          </div>
        )}
        </div>
      </div>
      {/* WIZARD END */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiCog className="text-gray-500" />
          Manage Data Sources
        </h2>
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint / Actor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 text-sm">No dynamic sources configured yet.</td>
                  </tr>
                ) : (
                  configs.map(conf => (
                    <tr key={conf._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conf.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{conf.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={conf.endpointOrActorId}>{conf.endpointOrActorId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(conf)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                        <button onClick={() => handleDeleteConfig(conf._id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ingestionResult && (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiDatabase className="text-emerald-500" />
            Ingestion Results (Sent to Staging)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingestionResult.map((c, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.email}<br/>{c.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.jobTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 flex flex-wrap gap-1">
                      {c.skills?.map(s => (
                        <span key={s} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">{s}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Dynamic Data Source</h2>
            <form onSubmit={handleCreateConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source Name</label>
                  <input type="text" required className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2" value={newConfig.name} onChange={e => setNewConfig({...newConfig, name: e.target.value})} placeholder="e.g. Apify Indeed USA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select required className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2" value={newConfig.type} onChange={e => setNewConfig({...newConfig, type: e.target.value})}>
                    <option value="apify_actor">Apify Actor</option>
                    <option value="rest_api">REST API</option>
                    <option value="csv_upload">Webhook / CSV</option>
                  </select>
                </div>
              </div>
              
              {newConfig.type === 'apify_actor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apify Actor ID</label>
                  <input type="text" required className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" value={newConfig.endpointOrActorId} onChange={e => setNewConfig({...newConfig, endpointOrActorId: e.target.value})} placeholder="e.g. muhammetakkurtt/naukri-job-scraper" />
                  <p className="text-xs text-gray-500 mt-1">The Apify Actor ID. Ensure your APIFY_API_TOKEN is set in your backend .env file.</p>
                </div>
              )}

              {newConfig.type === 'rest_api' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">REST API Endpoint URL</label>
                    <input type="url" required className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" value={newConfig.endpointOrActorId} onChange={e => setNewConfig({...newConfig, endpointOrActorId: e.target.value})} placeholder="e.g. https://api.example.com/v1/jobs" />
                    <p className="text-xs text-gray-500 mt-1">Must include https://</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">HTTP Method</label>
                      <select className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" value={newConfig.apiMethod || 'GET'} onChange={e => setNewConfig({...newConfig, apiMethod: e.target.value})}>
                        <option>GET</option>
                        <option>POST</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API Headers (JSON)</label>
                      <input type="text" className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm" value={newConfig.apiHeaders || ''} onChange={e => setNewConfig({...newConfig, apiHeaders: e.target.value})} placeholder='{"Authorization": "Bearer ..."}' />
                    </div>
                  </div>
                  {newConfig.apiMethod === 'POST' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API Body JSON (Optional)</label>
                      <textarea rows="3" className="mt-1 w-full border-gray-300 rounded-lg shadow-sm text-sm font-mono p-2" value={newConfig.actorInputSchema || ''} onChange={e => setNewConfig({...newConfig, actorInputSchema: e.target.value})} placeholder='{ "query": "{{keywords}}", "limit": {{limit}} }'></textarea>
                      <p className="text-xs text-gray-500 mt-1">The JSON payload to send in the POST request. Use <b>{`{{keywords}}`}</b> and <b>{`{{limit}}`}</b> as dynamic variables.</p>
                    </div>
                  )}
                  {(!newConfig.apiMethod || newConfig.apiMethod === 'GET') && (
                    <p className="text-xs text-blue-600 mt-1">Note: For GET requests, "?q=keywords&limit=X" will be automatically appended to the URL.</p>
                  )}
                </>
              )}

              {newConfig.type === 'csv_upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Webhook / Upload Endpoint</label>
                  <input type="text" readOnly className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-50 cursor-not-allowed" value="Auto-generated after saving" />
                  <p className="text-xs text-gray-500 mt-1">You will receive a unique Webhook URL to POST data to after this configuration is saved.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">AI Normalization Prompt Template</label>
                <textarea required rows="3" className="mt-1 w-full border-gray-300 rounded-lg shadow-sm text-sm font-mono p-2" value={newConfig.aiPromptTemplate} onChange={e => setNewConfig({...newConfig, aiPromptTemplate: e.target.value})}></textarea>
                <p className="text-xs text-gray-500 mt-1">This prompt tells Gemini how to read the messy {newConfig.type === 'apify_actor' ? 'Apify payload' : 'API/Webhook response'} and map it to our DB schema.</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPipeline;
