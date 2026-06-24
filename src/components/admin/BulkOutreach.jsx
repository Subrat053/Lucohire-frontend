import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, Users, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BulkOutreach() {
  const [audience, setAudience] = useState('Providers');
  const [channel, setChannel] = useState('Email');
  const [subject, setSubject] = useState('Top companies are looking for your skills on Lucohire');
  const [template, setTemplate] = useState('Hi {{firstName}},\n\nTop companies on Lucohire are looking to hire a professional with your exact skills.\n\nWe have pre-built a private profile for you to start matching with jobs instantly.\n\nClaim your profile now to get started.');
  
  const [isDispatching, setIsDispatching] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);

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
    
    // Safety confirm for bulk dispatch
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
        body: JSON.stringify({ audience, channel, subject, template })
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Send className="w-6 h-6 text-indigo-600" />
          Bulk Outreach Engine
        </h2>
        <p className="text-gray-500 mt-1">
          Dispatch throttled background campaigns with 30-120s humanized randomized delays to prevent spam bans.
        </p>
      </div>

      {/* Queue Status Monitor */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium mb-1">
            Waiting
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queueStatus?.waiting || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium mb-1">
            Delayed
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queueStatus?.delayed || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium mb-1">
            Active
            <RefreshCw className="w-4 h-4 text-orange-500 animate-spin-slow" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queueStatus?.active || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium mb-1">
            Completed
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queueStatus?.completed || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium mb-1">
            Failed
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queueStatus?.failed || 0}</div>
        </div>
      </div>

      {/* Campaign Configuration */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Campaign Configuration</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
              <select 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow"
              >
                <option value="Providers">Staging Candidates (Providers)</option>
                <option value="Users">Employers (Recruiters)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Channel</label>
              <select 
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow"
              >
                <option value="Email">Email (via Resend)</option>
                <option value="WhatsApp">WhatsApp (via Meta API)</option>
              </select>
            </div>
          </div>

          {channel === 'Email' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Line</label>
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message Template <span className="text-gray-400 font-normal">(Use {'{{firstName}}'} for dynamic names)</span>
            </label>
            <textarea 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none resize-y"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              <AlertCircle className="w-4 h-4" />
              Campaign will queue instantly, but sending is randomly delayed to protect reputation.
            </div>
            <button 
              onClick={handleDispatch}
              disabled={isDispatching}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
