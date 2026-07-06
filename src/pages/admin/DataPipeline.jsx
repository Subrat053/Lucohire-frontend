import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiDatabase, HiLink, HiBriefcase, HiClipboardList, HiShieldExclamation } from 'react-icons/hi';
import JobSources from './JobSources';
import ExternalJobs from './ExternalJobs';
import SyncReports from './SyncReports';
import SyncErrors from './SyncErrors';

const DataPipeline = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await adminAPI.triggerDailySync();
      toast.success('Manual sync triggered successfully! Check logs for progress.');
    } catch (err) {
      toast.error('Failed to trigger sync. Make sure sources are active.');
    } finally {
      setIsSyncing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Runner', icon: HiDatabase },
    { id: 'global-sources', label: 'Global Sources', icon: HiDatabase },
    { id: 'synced-jobs', label: 'Synced Jobs Library', icon: HiBriefcase },
    { id: 'sync-reports', label: 'Sync Reports', icon: HiClipboardList },
    { id: 'sync-errors', label: 'Sync Errors', icon: HiShieldExclamation },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Data Pipeline & Sync Hub</h1>
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900">Pipeline Overview</h2>
              <button 
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSyncing ? 'Triggering...' : 'Trigger Manual Sync Now'}
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Welcome to the unified Data Pipeline Hub. From here, you can manage global job sources (like RemoteOK and The Muse), 
              connect ATS platforms (Greenhouse, Lever, etc.), and monitor your sync health all in one place.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <div className="text-indigo-900 font-bold text-2xl">Connect Sources</div>
                <p className="text-indigo-700 text-sm mt-2">Activate APIs to start fetching jobs automatically.</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <div className="text-green-900 font-bold text-2xl">Daily Syncs</div>
                <p className="text-green-700 text-sm mt-2">The system runs every 24 hours to update jobs.</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
                <div className="text-rose-900 font-bold text-2xl">Error Tracking</div>
                <p className="text-rose-700 text-sm mt-2">Monitor failing companies or broken API keys.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* We wrap the child components in a div to override their own max-w wrappers if needed */}
        <div className="pipeline-child-wrapper">
          {activeTab === 'global-sources' && <JobSources />}
          {activeTab === 'synced-jobs' && <ExternalJobs />}
          {activeTab === 'sync-reports' && <SyncReports />}
          {activeTab === 'sync-errors' && <SyncErrors />}
        </div>
      </div>
    </div>
  );
};

export default DataPipeline;
