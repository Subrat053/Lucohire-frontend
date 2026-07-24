import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Globe, Clock, ExternalLink, ChevronLeft, ChevronRight, Pause, Play, Square, RefreshCw } from 'lucide-react';
import { ADMIN_API, adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const BulkCrawlerPanel = () => {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Controller reference to cancel SSE stream
  const readerRef = useRef(null);
  const isPausedRef = useRef(false);

  const fetchHistory = async (pageNum = 1) => {
    try {
      setHistoryLoading(true);
      const res = await ADMIN_API.get(`/admin/crawlers/mapped-companies?page=${pageNum}&limit=10`);
      setHistory(res.data.companies || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setPage(res.data.pagination?.page || 1);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  // ──────────────── Global Control Actions ────────────────

  const processCompanies = async () => {
    if (!inputText.trim()) {
      setError("Please enter or upload companies first.");
      return;
    }

    setIsUploading(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setError(null);
    setResult([]); // Reset live stream result list

    const lines = inputText.split('\n').filter(line => line.trim());
    const companies = lines.map(line => line.split(',')[0].replace(/"/g, '').trim()).filter(Boolean);

    try {
      const url = `${import.meta.env.VITE_ADMIN_API_BASE_URL || import.meta.env.VITE_ADMIN_API_URL || '/api/v1'}/admin/crawlers/bulk-stream`;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companies })
      });

      if (!response.ok) {
        throw new Error('Failed to start bulk stream');
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      while (true) {
        // Handle Global Pause loop
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const chunks = buffer.split('\n');
        buffer = chunks.pop();

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          try {
            const data = JSON.parse(chunk);
            if (data.type === 'progress') {
              setResult(prev => [...prev, { company: data.company, status: 'crawling', jobsFound: 0 }]);
            } else if (data.type === 'result') {
              setResult(prev => prev.map(item => 
                item.company === data.company 
                  ? { ...item, status: data.status, jobsFound: data.jobsFound || 0, careerUrl: data.careerUrl, error: data.error }
                  : item
              ));
            }
          } catch (e) {
            console.error('Error parsing chunk', e);
          }
        }
      }
      setIsUploading(false);
      fetchHistory(1);
    } catch (err) {
      if (err.name === 'AbortError') {
        toast.success('Bulk crawling stream stopped by admin.');
      } else {
        console.error(err);
        setError(err.message || 'Failed to trigger bulk upload.');
      }
      setIsUploading(false);
      fetchHistory(1);
    } finally {
      readerRef.current = null;
    }
  };

  const handleGlobalPause = () => {
    isPausedRef.current = true;
    setIsPaused(true);
    toast.success('Global bulk crawling paused.');
  };

  const handleGlobalResume = () => {
    isPausedRef.current = false;
    setIsPaused(false);
    toast.success('Resuming bulk crawling...');
  };

  const handleGlobalEnd = () => {
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch (e) {}
      readerRef.current = null;
    }
    isPausedRef.current = false;
    setIsPaused(false);
    setIsUploading(false);
    toast.success('Bulk crawling session ended.');
    fetchHistory(1);
  };

  // ──────────────── Individual Item Actions ────────────────

  const handleItemPause = (companyName) => {
    setResult(prev => prev.map(item => 
      item.company === companyName ? { ...item, status: 'paused' } : item
    ));
    toast.success(`Paused crawl for ${companyName}`);
  };

  const handleItemRestart = async (companyName, careerUrl) => {
    setResult(prev => prev.map(item => 
      item.company === companyName ? { ...item, status: 'crawling', error: null } : item
    ));
    try {
      const payload = careerUrl ? { url: careerUrl, companyName } : { companyName };
      const { data } = await adminAPI.liveTestCrawler(payload);
      setResult(prev => prev.map(item => 
        item.company === companyName 
          ? { ...item, status: data.success ? 'success' : 'failed', jobsFound: data.jobs?.length || 0, careerUrl: data.careerUrl || careerUrl }
          : item
      ));
      toast.success(`Re-scraped ${companyName} successfully!`);
    } catch (err) {
      setResult(prev => prev.map(item => 
        item.company === companyName ? { ...item, status: 'failed', error: err.message } : item
      ));
      toast.error(`Failed to re-scrape ${companyName}`);
    }
  };

  const handleItemEnd = (companyName) => {
    setResult(prev => prev.map(item => 
      item.company === companyName ? { ...item, status: 'failed', error: 'Stopped by admin' } : item
    ));
    toast.success(`Stopped crawl for ${companyName}`);
  };

  const handleToggleHistoryStatus = async (item) => {
    try {
      const newStatus = item.status === 'active' ? 'paused' : 'active';
      await ADMIN_API.put(`/admin/crawlers/mapped-companies/${item._id}/status`, { status: newStatus });
      toast.success(`${item.companyName} set to ${newStatus}`);
      fetchHistory(page);
    } catch (err) {
      toast.error('Failed to update company status');
    }
  };

  const handleHistoryRescrape = async (item) => {
    try {
      toast.loading(`Re-scraping ${item.companyName}...`, { id: `rescrape-${item._id}` });
      const res = await ADMIN_API.post(`/admin/crawlers/mapped-companies/${item._id}/rescrape`);
      toast.success(res.data.message || `Re-scrape completed for ${item.companyName}`, { id: `rescrape-${item._id}` });
      fetchHistory(page);
    } catch (err) {
      toast.error('Failed to re-scrape company', { id: `rescrape-${item._id}` });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" />
            Bulk Career Page Mapping & Crawler Control
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Upload a CSV or list of company names. Full execution control with Global & Individual Pause, Resume, and Stop functionality.
          </p>
        </div>

        {/* Global Action Bar */}
        {isUploading && (
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-inner">
            <span className="text-xs font-bold text-gray-600 px-2">Global Crawl:</span>
            {!isPaused ? (
              <button
                onClick={handleGlobalPause}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-amber-200 transition"
              >
                <Pause className="w-3.5 h-3.5" /> Pause All
              </button>
            ) : (
              <button
                onClick={handleGlobalResume}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-emerald-200 transition"
              >
                <Play className="w-3.5 h-3.5" /> Resume All
              </button>
            )}
            <button
              onClick={handleGlobalEnd}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-red-200 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop All
            </button>
          </div>
        )}
      </div>

      {/* Verified Data Sources */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" /> Verified Data Sources
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition">
            <div className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/in.png" width="20" alt="India" /> India
            </div>
            <div className="space-y-1.5 flex flex-col">
              <a href="https://www.mca.gov.in" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">MCA Registry</a>
              <a href="https://www.zaubacorp.com" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">Zauba Corp</a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition">
            <div className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/us.png" width="20" alt="USA" /> USA
            </div>
            <div className="space-y-1.5 flex flex-col">
              <a href="https://www.sec.gov/files/company_tickers.json" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">SEC Tickers</a>
              <a href="https://www.sec.gov/edgar" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">EDGAR API</a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition">
            <div className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/gb.png" width="20" alt="UK" /> UK
            </div>
            <div className="space-y-1.5 flex flex-col">
              <a href="https://download.companieshouse.gov.uk/en_output.html" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">Companies House</a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition">
            <div className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/ca.png" width="20" alt="Canada" /> Canada
            </div>
            <div className="space-y-1.5 flex flex-col">
              <a href="https://open.canada.ca/data/en/dataset/0032ce54-c5dd-4b66-99a0-320a7b5e99f2" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">Corporations CAN</a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition">
            <div className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/au.png" width="20" alt="Australia" /> Australia
            </div>
            <div className="space-y-1.5 flex flex-col">
              <a href="https://abr.business.gov.au/Tools/BulkExtract" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">ABN Extract</a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition">
            <div className="font-bold text-xs text-gray-900 mb-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w20/de.png" width="20" alt="Germany" /> Germany
            </div>
            <div className="space-y-1.5 flex flex-col">
              <a href="https://www.handelsregister.de" target="_blank" rel="noreferrer" className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold text-center border border-indigo-100/50">Handelsregister</a>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50/40 transition relative">
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Click or Drag CSV File</h3>
            <p className="text-xs text-gray-500">First column containing Company Name will be parsed.</p>
          </div>

          {/* Text Area */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 mb-2">Or paste Company Names (one per line)</label>
            <textarea
              className="w-full h-full min-h-[160px] p-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"
              placeholder="Stripe&#10;Google&#10;Microsoft&#10;Airbnb"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-700">{error}</p>
          </div>
        )}

        {/* Live Crawl Stream Status List */}
        {Array.isArray(result) && result.length > 0 && (
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white mt-6 shadow-sm">
            <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Live Crawl Processing ({result.length})</h3>
              {isPaused && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Global Stream Paused
                </span>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {result.map((item, idx) => (
                <li key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    {item.status === 'crawling' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {item.status === 'paused' && <Pause className="w-4 h-4 text-amber-500" />}
                    {(item.status === 'failed' || item.status === 'error') && <AlertCircle className="w-4 h-4 text-red-500" />}
                    
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.company}</p>
                      {item.careerUrl && (
                        <a href={item.careerUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:underline">
                          {item.careerUrl}
                        </a>
                      )}
                      {item.error && <p className="text-[11px] text-red-500 mt-0.5">{item.error}</p>}
                    </div>
                  </div>
                  
                  {/* Individual Control Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {item.status === 'crawling' && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">Scraping...</span>
                      )}
                      {item.status === 'paused' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">Paused</span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                          {item.jobsFound} Jobs Found
                        </span>
                      )}
                      {(item.status === 'failed' || item.status === 'error') && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">Failed / No URL</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                      {item.status === 'crawling' && (
                        <button
                          onClick={() => handleItemPause(item.company)}
                          title="Pause individual crawl"
                          className="p-1 hover:bg-amber-100 rounded-md text-amber-600 transition"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleItemRestart(item.company, item.careerUrl)}
                        title="Re-run / Restart crawl for this company"
                        className="p-1 hover:bg-indigo-100 rounded-md text-indigo-600 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleItemEnd(item.company)}
                        title="Stop / Abort crawl for this company"
                        className="p-1 hover:bg-red-100 rounded-md text-red-600 transition"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={processCompanies}
            disabled={isUploading || !inputText.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Engine Active...' : 'Start Bulk Mapping Engine'}
          </button>
        </div>
      </div>

      {/* Crawling History & Saved Companies Table */}
      <div className="border-t border-gray-200 bg-gray-50/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Saved Career Page Companies
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Companies mapped from bulk uploads. Control individual active/paused status for nightly crawler executions.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Career URL</th>
                  <th className="py-3 px-4">Nightly Scraper Status</th>
                  <th className="py-3 px-4">Jobs Found</th>
                  <th className="py-3 px-4">Last Scraped</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading mapped companies...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">
                      No mapped company history found. Upload a batch above to map career portals.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{item.companyName}</td>
                      <td className="py-3.5 px-4">
                        {item.careerUrl ? (
                          <a href={item.careerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold">
                            {item.careerUrl} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase border ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-bold">
                        {item.successCount || 0} Jobs
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleString() : 'Pending Next Schedule'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleHistoryStatus(item)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                              item.status === 'active' 
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleHistoryRescrape(item)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition border border-indigo-200 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Re-scrape
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
              <span className="text-xs font-bold text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default BulkCrawlerPanel;
