import React, { useState, useEffect } from 'react';
import { HiPlus, HiPlay, HiDatabase, HiCog, HiSparkles, HiTerminal, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { ADMIN_API } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COUNTRY_OPTIONS = ['India', 'USA', 'UK', 'Canada', 'UAE'];
const SKILL_OPTIONS = [
  'UI Designer', 'UX Designer', 'React Developer', 'Java Developer', 
  'Python Developer', 'Nurse', 'Driver', 'Sales Executive', 
  'Customer Support', 'Accountant', 'Data Analyst', 'Digital Marketing', 
  'HR Recruiter', 'Other (Custom)'
];
const EXPERIENCE_OPTIONS = [
  'Fresher', '0–1 year', '1–3 years', '3–5 years', 
  '5–8 years', '8–12 years', '12+ years', 'Custom min/max'
];
const JOB_TYPE_OPTIONS = [
  'Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'On-site', 'Freelance', 'Internship'
];
const ACTIVE_FILTERS = [
  'Resume updated in last 7 days', 'Resume updated in last 15 days',
  'Resume updated in last 30 days', 'Recently active', 'Open to work',
  'Notice period available', 'Job type selected', 'Applied recently',
  'Resume uploaded', 'Claim link clicked', 'Profile verified',
  'Email verified', 'Phone verified', 'Consent accepted'
];

const DataPipeline = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('runner'); // 'runner' or 'configs'
  const [manageFilterCountry, setManageFilterCountry] = useState('All');

  // Wizard / Smart Command State
  const [formData, setFormData] = useState({
    country: 'India',
    configId: '',
    skill: 'React Developer',
    customSkill: '',
    location: '',
    experience: '3–5 years',
    jobType: 'Full-time',
    activeFilters: [],
    maxRecords: 10,
    maxSpend: 0,
    runMode: 'Preview',
    outreachChannels: ['Email']
  });

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // New Config State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [newConfig, setNewConfig] = useState({
    name: '',
    country: 'India',
    type: 'apify_actor',
    endpointOrActorId: '',
    aiPromptTemplate: 'Extract the following fields from the JSON: name, email, phone, jobTitle, skills(array). Return ONLY valid JSON array.'
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    maxRecordsPerDay: 3000,
    maxRecordsPerMonth: 90000,
    maxSpendPerDay: 5000,
    maxSpendPerMonth: 150000,
    autoStopOnQuota: true,
    pauseOnHighDuplicate: true,
    pauseOnError: true,
    pauseOnSourceFail: true
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await ADMIN_API.get('/admin/data-pipeline/configs');
      if (data.success) {
        setConfigs(data.configs);
        if (data.configs.length > 0 && !formData.configId) {
          setFormData(prev => ({ ...prev, configId: data.configs[0]._id }));
        }
      }
    } catch (err) {
      toast.error('Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await ADMIN_API.get('/admin/data-pipeline/settings');
      if (data.success && data.settings) {
        setGlobalSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load global settings', err);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const { data } = await ADMIN_API.put('/admin/data-pipeline/settings', globalSettings);
      if (data.success) {
        toast.success('Global safety limits updated');
        setShowSettingsModal(false);
      }
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchSettings();
  }, []);

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
        if (formData.configId === id) setFormData(prev => ({ ...prev, configId: '' }));
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
      apiKey: conf.apiKey || '',
      status: conf.status || 'Ready / Free',
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
      apiKey: '',
      status: 'Ready / Free',
      actorInputSchema: '',
      aiPromptTemplate: 'Extract the following fields from the JSON: name, email, phone, jobTitle, skills(array). Return ONLY valid JSON array.'
    });
    setShowAddModal(true);
  };

  // Smart Command Handlers
  const handleFilterToggle = (filter) => {
    setFormData(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.includes(filter)
        ? prev.activeFilters.filter(f => f !== filter)
        : [...prev.activeFilters, filter]
    }));
  };

  const handleChannelToggle = (channel) => {
    setFormData(prev => ({
      ...prev,
      outreachChannels: prev.outreachChannels.includes(channel)
        ? prev.outreachChannels.filter(c => c !== channel)
        : [...prev.outreachChannels, channel]
    }));
  };

  const estimatedCost = formData.maxRecords * 0.05; // Dummy estimate of $0.05 per record

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!formData.configId) return toast.error('Please select a source configuration');
    
    const actualSkill = formData.skill === 'Other (Custom)' ? formData.customSkill : formData.skill;
    
    const payload = {
      configId: formData.configId,
      keywords: actualSkill,
      location: formData.location,
      experience: formData.experience,
      jobType: formData.jobType,
      activeFiltersArray: formData.activeFilters,
      outreachChannels: formData.outreachChannels,
      limit: formData.maxRecords,
      isPreview: formData.runMode === 'Preview'
    };

    if (formData.runMode === 'Live Fetch') {
      // Trigger Pre-Flight Analysis Modal
      try {
        setPreviewLoading(true);
        setShowPreviewModal(true);
        const { data } = await ADMIN_API.post('/admin/data-pipeline/preview', payload);
        if (data.success) {
          setPreviewData(data.preview);
        } else {
          toast.error('Failed to load preview analysis');
          setShowPreviewModal(false);
        }
      } catch (err) {
        toast.error('Preview error: ' + (err.response?.data?.error || err.message));
        setShowPreviewModal(false);
      } finally {
        setPreviewLoading(false);
      }
      return; // Stop here, wait for modal confirmation
    }

    // Direct preview run
    executeTrigger(payload);
  };

  const handleConfirmRun = () => {
    setShowPreviewModal(false);
    const actualSkill = formData.skill === 'Other (Custom)' ? formData.customSkill : formData.skill;
    const payload = {
      configId: formData.configId,
      keywords: actualSkill,
      location: formData.location,
      experience: formData.experience,
      jobType: formData.jobType,
      activeFiltersArray: formData.activeFilters,
      outreachChannels: formData.outreachChannels,
      limit: formData.maxRecords,
      isPreview: false
    };
    executeTrigger(payload);
  };

  const executeTrigger = async (payload) => {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await ADMIN_API.post('/admin/data-pipeline/trigger', payload);
      if (data.success) {
        toast.success(data.message);
        setResult(data.candidates);
        fetchSettings(); // Refresh budget usage
      } else {
        toast.error(data.message || 'Execution failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiTerminal className="text-indigo-600" />
            Smart Run Command
          </h1>
          <p className="text-gray-500 mt-1">Execute precise, highly-structured data sourcing campaigns.</p>
        </div>
        <button 
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors shadow-sm"
        >
          <HiCog />
          Global Safety Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('runner')} 
          className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'runner' ? 'bg-white border-t border-l border-r border-gray-200 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2">
            <HiTerminal /> Run Command
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('configs')} 
          className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'configs' ? 'bg-white border-t border-l border-r border-gray-200 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2">
            <HiCog /> Manage Data Sources
          </div>
        </button>
      </div>

      {activeTab === 'runner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COMMAND PANEL */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleExecute} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">1. Country</label>
                  <select className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
                    {COUNTRY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">2. Platform/Source</label>
                  {loading ? (
                    <p className="text-sm mt-2 text-gray-500">Loading...</p>
                  ) : (
                    <select required className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.configId} onChange={e => setFormData({...formData, configId: e.target.value})}>
                      <option value="">-- Select Source --</option>
                      {configs.filter(c => c.country === formData.country).map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">3. Skill / Keyword</label>
                  <select className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})}>
                    {SKILL_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {formData.skill === 'Other (Custom)' && (
                    <input type="text" required placeholder="Type custom skill..." className="mt-2 w-full border-gray-300 rounded-lg p-2" value={formData.customSkill} onChange={e => setFormData({...formData, customSkill: e.target.value})} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">4. Location</label>
                  <input type="text" placeholder="e.g. Bangalore, Remote" className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">5. Experience Range</label>
                  <select className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})}>
                    {EXPERIENCE_OPTIONS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">6. Job Type</label>
                  <select className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.jobType} onChange={e => setFormData({...formData, jobType: e.target.value})}>
                    {JOB_TYPE_OPTIONS.map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">7. Active Candidate Filters</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ACTIVE_FILTERS.map(filter => (
                    <label key={filter} className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" 
                             checked={formData.activeFilters.includes(filter)} onChange={() => handleFilterToggle(filter)} />
                      <span>{filter}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700">8. Max Records</label>
                  <input type="number" min="1" className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.maxRecords} onChange={e => setFormData({...formData, maxRecords: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex justify-between">
                    <span>9. Max Spend ($)</span>
                    <span className="text-xs text-gray-500 font-normal">0 = No limit</span>
                  </label>
                  <input type="number" min="0" step="0.5" className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.maxSpend} onChange={e => setFormData({...formData, maxSpend: Number(e.target.value)})} />
                  {formData.maxSpend > 0 && estimatedCost > formData.maxSpend && (
                    <p className="text-xs text-red-600 flex items-center mt-1"><HiExclamationCircle className="mr-1"/> Estimated ${estimatedCost.toFixed(2)} exceeds limit!</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">10. Run Mode</label>
                  <select className="mt-1 w-full border-gray-300 rounded-lg p-2 bg-gray-50" value={formData.runMode} onChange={e => setFormData({...formData, runMode: e.target.value})}>
                    <option>Preview</option>
                    <option>Live Fetch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">11. Outreach Channel</label>
                  <div className="flex space-x-4 mt-2">
                    {['Email', 'WhatsApp', 'SMS'].map(channel => (
                      <label key={channel} className="flex items-center space-x-1 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={formData.outreachChannels.includes(channel)} onChange={() => handleChannelToggle(channel)} />
                        <span>{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={running} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2">
                  {running ? <LoadingSpinner /> : <><HiCog className="animate-spin-slow" /> Execute Smart Command</>}
                </button>
              </div>
            </form>
          </div>

          {/* RESULTS PANEL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiDatabase className="text-gray-500" />
              Execution Output
            </h2>
            
            <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {!result && !running && (
                <div className="text-center text-gray-500 mt-20">
                  <HiTerminal className="mx-auto text-4xl mb-2 text-gray-300" />
                  <p>Waiting for command execution...</p>
                </div>
              )}
              
              {running && (
                <div className="text-center text-blue-600 mt-20">
                  <LoadingSpinner className="mx-auto h-8 w-8 mb-2" />
                  <p>Running pipeline...</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                    <HiCheckCircle className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Command Successful</p>
                      <p>Processed {result.length} records in {formData.runMode} mode.</p>
                    </div>
                  </div>

                  {result.map((c, idx) => (
                    <div className="bg-white p-3 rounded border shadow-sm text-sm" key={idx}>
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-gray-500">{c.jobTitle} • Score: {c.activeScore}</p>
                      {formData.runMode === 'Live Fetch' && (
                         <p className="text-xs text-blue-600 mt-1">Staged for: {formData.outreachChannels.join(', ') || 'No Outreach'}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'configs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Configured Data Sources</h2>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="border-gray-300 rounded-lg text-sm p-1.5 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-auto"
                value={manageFilterCountry}
                onChange={(e) => setManageFilterCountry(e.target.value)}
              >
                <option value="All">All Countries</option>
                {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={openAddModal} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 whitespace-nowrap">
                <HiPlus /> Add Source
              </button>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            {loading ? <LoadingSpinner /> : configs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No configurations found. Add one to get started.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configs.filter(c => manageFilterCountry === 'All' || c.country === manageFilterCountry).map(c => (
                  <div key={c._id} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">{c.name}</h3>
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium">{c.country}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        Type: <span className="font-mono text-xs">{c.type}</span>
                        | Status: <span className={`text-xs font-bold ${c.status === 'Ready / Free' ? 'text-green-600' : 'text-yellow-600'}`}>{c.status || 'Ready / Free'}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        Endpoint: <span className="text-gray-900" title={c.endpointOrActorId}>{c.endpointOrActorId}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button onClick={() => openEditModal(c)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 bg-indigo-50 rounded">Edit</button>
                      <button onClick={() => handleDeleteConfig(c._id)} className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingConfigId ? 'Edit Data Source' : 'Add Dynamic Data Source'}</h2>
            <form onSubmit={handleCreateConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source Name</label>
                  <input type="text" required className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2" value={newConfig.name} onChange={e => setNewConfig({...newConfig, name: e.target.value})} placeholder="e.g. Apify Indeed USA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <select required className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2" value={newConfig.country} onChange={e => setNewConfig({...newConfig, country: e.target.value})}>
                    {COUNTRY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select required disabled={!!editingConfigId} className={`mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 ${editingConfigId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} value={newConfig.type} onChange={e => setNewConfig({...newConfig, type: e.target.value})}>
                    <option value="apify_actor">Apify Actor</option>
                    <option value="rest_api">REST API</option>
                    <option value="csv_upload">Webhook / CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <input type="text" required disabled={!!editingConfigId} className={`mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 ${editingConfigId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} value={newConfig.status} onChange={e => setNewConfig({...newConfig, status: e.target.value})} placeholder="e.g. Ready / Free, Paid" />
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

                    <div className="md:col-span-2">
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
                <div className="space-y-4 border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webhook / Upload Endpoint</label>
                    <input type="text" readOnly className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100 text-gray-600 font-mono text-xs cursor-text" value={editingConfigId ? `https://api.lucohire.com/webhook/import/${editingConfigId}` : "Auto-generated after saving"} />
                    <p className="text-xs text-gray-500 mt-1">Send a POST request to this URL with your CSV or JSON payload.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manual CSV Upload</label>
                    <input type="file" accept=".csv" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    <p className="text-xs text-gray-500 mt-1">Alternatively, upload a CSV file manually right now.</p>
                  </div>
                </div>
              )}

              {newConfig.type !== 'csv_upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {newConfig.name ? `${newConfig.name} API Key / Token` : 'Source Credential (API Key / Token)'}
                  </label>
                  <input type="password" className="mt-1 w-full border-gray-300 rounded-lg shadow-sm p-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm" value={newConfig.apiKey || ''} onChange={e => setNewConfig({...newConfig, apiKey: e.target.value})} placeholder={`Enter secret key/token for ${newConfig.name || 'this source'}...`} />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use global .env credentials (e.g. APIFY_API_TOKEN).</p>
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

      {/* Global Safety Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto m-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiCog className="text-gray-500" /> Global Budget & Quota
            </h2>
            <form onSubmit={saveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Records / Day</label>
                  <input type="number" className="mt-1 w-full border-gray-300 rounded-lg p-2" value={globalSettings.maxRecordsPerDay || 0} onChange={e => setGlobalSettings({...globalSettings, maxRecordsPerDay: Number(e.target.value)})} />
                  <p className="text-xs text-gray-500 mt-1">Used today: {globalSettings.dailyRecordsUsed || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Spend / Day ($)</label>
                  <input type="number" className="mt-1 w-full border-gray-300 rounded-lg p-2" value={globalSettings.maxSpendPerDay || 0} onChange={e => setGlobalSettings({...globalSettings, maxSpendPerDay: Number(e.target.value)})} />
                  <p className="text-xs text-gray-500 mt-1">Used today: ${globalSettings.dailySpendUsed || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Records / Month</label>
                  <input type="number" className="mt-1 w-full border-gray-300 rounded-lg p-2" value={globalSettings.maxRecordsPerMonth || 0} onChange={e => setGlobalSettings({...globalSettings, maxRecordsPerMonth: Number(e.target.value)})} />
                  <p className="text-xs text-gray-500 mt-1">Used month: {globalSettings.monthlyRecordsUsed || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Spend / Month ($)</label>
                  <input type="number" className="mt-1 w-full border-gray-300 rounded-lg p-2" value={globalSettings.maxSpendPerMonth || 0} onChange={e => setGlobalSettings({...globalSettings, maxSpendPerMonth: Number(e.target.value)})} />
                  <p className="text-xs text-gray-500 mt-1">Used month: ${globalSettings.monthlySpendUsed || 0}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Automated Safety Rules</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={globalSettings.autoStopOnQuota} onChange={e => setGlobalSettings({...globalSettings, autoStopOnQuota: e.target.checked})} />
                    <span className="text-sm text-gray-700 font-medium">Stop automatically after quota hit</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={globalSettings.pauseOnHighDuplicate} onChange={e => setGlobalSettings({...globalSettings, pauseOnHighDuplicate: e.target.checked})} />
                    <span className="text-sm text-gray-700 font-medium">Pause if duplicate rate is high</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={globalSettings.pauseOnError} onChange={e => setGlobalSettings({...globalSettings, pauseOnError: e.target.checked})} />
                    <span className="text-sm text-gray-700 font-medium">Pause if error rate is high</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={globalSettings.pauseOnSourceFail} onChange={e => setGlobalSettings({...globalSettings, pauseOnSourceFail: e.target.checked})} />
                    <span className="text-sm text-gray-700 font-medium">Pause if source API fails repeatedly</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Flight Analysis Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <HiTerminal className="text-indigo-600" /> Pre-Flight Analysis
                </h2>
                <p className="text-sm text-gray-500 mt-1">Review pipeline execution details before starting the run.</p>
              </div>
              {previewData?.riskLevel === 'High' && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <HiExclamationCircle /> High Risk
                </span>
              )}
              {previewData?.riskLevel === 'Medium' && (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <HiExclamationCircle /> Medium Risk
                </span>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {previewLoading ? (
                <div className="py-20 text-center"><LoadingSpinner className="mx-auto" /><p className="mt-4 text-gray-500">Analyzing pipeline config...</p></div>
              ) : previewData ? (
                <>
                  {previewData.warningMessage && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <HiExclamationCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700 font-medium">{previewData.warningMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Execution Parameters */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Parameters</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Source:</span>
                          <span className="font-medium text-gray-900 truncate max-w-[150px]">{previewData.sourceName}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Keyword:</span>
                          <span className="font-medium text-gray-900">{previewData.keyword}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.location || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${candidate.leadStatus === 'Verified Active Candidate' ? 'bg-green-100 text-green-800' :
                                candidate.leadStatus === 'Active Signal Lead' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {candidate.leadStatus || 'Raw Lead'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{candidate.activeScore}</td>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Active Filters:</span>
                          <span className="font-medium text-gray-900">{previewData.activeFilters}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Source Status:</span>
                          <span className={`font-medium ${previewData.sourceStatus === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
                            {previewData.sourceStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Projections */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Projections</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Expected Records:</span>
                          <span className="font-bold text-indigo-600">{previewData.expectedRecords}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Est. Duplicates:</span>
                          <span className="font-medium text-amber-600">{previewData.duplicateEstimate}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Net New Records:</span>
                          <span className="font-bold text-green-600">{previewData.newRecordsEstimate}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Signal Leads Est:</span>
                          <span className="font-bold text-indigo-600">{previewData.activeSignalLeadEstimate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Estimated Cost:</span>
                          <span className="font-bold text-gray-900">${previewData.estimatedCost}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-900 font-medium">Daily Quota Remaining: <span className="font-bold">{previewData.dailyQuotaRemaining}</span> records</p>
                      <p className="text-xs text-indigo-700 mt-1">Monthly Budget Remaining: <span className="font-bold">${previewData.monthlyBudgetRemaining}</span></p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-red-500">Failed to load preview.</p>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setShowPreviewModal(false)} 
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel Run
              </button>
              <button 
                type="button" 
                onClick={handleConfirmRun} 
                disabled={previewLoading || !previewData || previewData.riskLevel === 'High'}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Approve & Execute Final Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPipeline;
