import React, { useState } from 'react';
import { HiOutlineSearchCircle, HiOutlineClock, HiOutlineBriefcase, HiOutlineShieldCheck, HiOutlineDatabase } from 'react-icons/hi';
import QueryManager from './QueryManager';
import ScanHistory from './ScanHistory';
import NeedsReviewQueue from './NeedsReviewQueue';
import MasterDataManagement from './MasterDataManagement';
import FinalJobs from './FinalJobs';

const PipelineAdmin = () => {
  const [activeTab, setActiveTab] = useState('queries');

  const tabs = [
    { id: 'queries', label: 'Manage Queries', icon: <HiOutlineSearchCircle className="w-5 h-5 mr-2" />, component: <QueryManager /> },
    { id: 'scans', label: 'Scan Status & Logs', icon: <HiOutlineClock className="w-5 h-5 mr-2" />, component: <ScanHistory /> },
    { id: 'jobs', label: 'Jobs Received', icon: <HiOutlineBriefcase className="w-5 h-5 mr-2" />, component: <FinalJobs /> },
    { id: 'review', label: 'Needs Review', icon: <HiOutlineShieldCheck className="w-5 h-5 mr-2" />, component: <NeedsReviewQueue /> },
    { id: 'master', label: 'Master Data', icon: <HiOutlineDatabase className="w-5 h-5 mr-2" />, component: <MasterDataManagement /> }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Automated Job Pipeline</h1>
        <p className="text-gray-500 mt-2">Manage your automated scraping engine, monitor scan statuses, and review imported jobs.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tabs.find(t => t.id === activeTab)?.component}
        </div>
      </div>
    </div>
  );
};

export default PipelineAdmin;
