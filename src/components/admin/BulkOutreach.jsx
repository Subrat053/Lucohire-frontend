import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BulkOutreach() {
  const [audience, setAudience] = useState('Candidate');
  const [channel, setChannel] = useState('Email');
  const [subject, setSubject] = useState('Top companies are looking for your skills on Lucohire');
  const [template, setTemplate] = useState('Hi {{firstName}},\n\nTop companies on Lucohire are looking to hire a professional with your exact skills.\n\nWe have pre-built a private profile for you to start matching with jobs instantly.\n\nClaim your profile now to get started.');
  
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  
  const [isDispatching, setIsDispatching] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);

  const handleAudienceChange = (type) => {
    setAudience(type);
    if (type === 'Candidate') {
      setSubject('Top companies are looking for your skills on Lucohire');
      setTemplate('Hi {{firstName}},\n\nTop companies on Lucohire are looking to hire a professional with your exact skills.\n\nWe have pre-built a private profile for you to start matching with jobs instantly.\n\nClaim your profile now to get started.');
    } else {
      setSubject('Top candidates available for your open roles on Lucohire');
      setTemplate('Hi {{firstName}},\n\nWe have verified professionals on Lucohire that perfectly match your job requirements.\n\nSign in to review their profiles and start hiring instantly.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const parsedData = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const email = parts[1].trim();
          
          if (i === 0 && name.toLowerCase().includes('name') && email.toLowerCase().includes('email')) {
            continue; 
          }
          parsedData.push({ name, email });
        }
      }
      setCsvData(parsedData);
      toast.success(`Loaded ${parsedData.length} contacts from CSV`);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_outreach_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/admin/outreach/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setQueueStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch queue status:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async () => {
    if (!template) return toast.error('Template cannot be empty');
    if (!window.confirm(`Are you sure you want to dispatch to all ${audience} via ${channel}?`)) return;

    setIsDispatching(true);
    const loadingToast = toast.loading('Building throttle queue...');

    try {
      const res = await fetch('/api/v1/admin/outreach/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ audience, channel, subject, template, csvData })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(`Success! Campaign will complete in ~${data.estimatedCompletionTimeMinutes} mins`, { id: loadingToast });
        fetchStatus();
      } else {
        toast.error(data.message || 'Dispatch failed', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Network error during dispatch', { id: loadingToast });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/50 min-h-screen space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] flex items-center gap-2">
            Bulk Outreach Engine
          </h1>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">
            Dispatch throttled background campaigns with 30-120s humanized randomized delays to prevent spam bans.
          </p>
        </div>
      </div>

      {/* Queue Status Monitor */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Waiting
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-gray-900">{queueStatus?.waiting || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Delayed
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-extrabold text-gray-900">{queueStatus?.delayed || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Active
            <RefreshCw className="w-4 h-4 text-orange-500 animate-spin-slow" />
          </div>
          <div className="text-xl font-extrabold text-gray-900">{queueStatus?.active || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Completed
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-xl font-extrabold text-gray-900">{queueStatus?.completed || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Failed
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-extrabold text-gray-900">{queueStatus?.failed || 0}</div>
        </div>
      </div>

      {/* Campaign Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-white">
          <h3 className="text-sm font-bold text-gray-900">Campaign Configuration</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Target Audience</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleAudienceChange('Candidate')}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                    audience === 'Candidate'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => handleAudienceChange('Company')}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                    audience === 'Company'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Company
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Upload CSV (Name, Email)</label>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
                >
                  Download Sample CSV
                </button>
              </div>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2.5 rounded-lg font-bold transition-all w-full text-center">
                  <span>{fileName || 'Choose CSV File...'}</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
              {csvData.length > 0 && (
                <p className="text-[11px] text-emerald-600 mt-2 font-bold">Ready to dispatch to {csvData.length} recipients</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Channel</label>
              <select 
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white text-gray-700"
              >
                <option value="Email">Email (via Resend)</option>
                <option value="WhatsApp">WhatsApp (via Meta API)</option>
              </select>
            </div>
          </div>

          {channel === 'Email' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subject Line</label>
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Message Template <span className="text-gray-400 font-medium normal-case">(Use {'{{firstName}}'} for dynamic names)</span>
            </label>
            <textarea 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="w-full text-sm font-medium px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y bg-white text-gray-900"
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              Campaign will queue instantly, but sending is randomly delayed to protect reputation.
            </div>
            <button 
              onClick={handleDispatch}
              disabled={isDispatching}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isDispatching ? 'Building Queue...' : 'Dispatch Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
