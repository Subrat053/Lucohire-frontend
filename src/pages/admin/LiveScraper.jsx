import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiSearch, HiLightningBolt, HiOutlineBriefcase, HiOutlineMail, HiUpload, HiDocumentText } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LiveScraper = () => {
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'
  
  // Single mode state
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Bulk mode state
  const [bulkCompanies, setBulkCompanies] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await adminAPI.liveTestCrawler({ companyName });
      if (data.success) {
        setResult(data);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Scrape failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error running live scraper');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const names = text.split('\n').map(l => l.trim()).filter(l => l);
      if (names.length === 0) {
        toast.error('No companies found in file');
        return;
      }
      setBulkCompanies(names);
      setBulkResults([]);
      setBulkProgress({ current: 0, total: names.length });
      e.target.value = null; // Reset input
    };
    reader.readAsText(file);
  };

  const handleBulkScrape = async () => {
    if (bulkCompanies.length === 0) return;
    setBulkProcessing(true);
    setBulkResults([]);
    
    let currentResults = [];
    for (let i = 0; i < bulkCompanies.length; i++) {
      const cName = bulkCompanies[i];
      setBulkProgress({ current: i + 1, total: bulkCompanies.length });
      try {
        const { data } = await adminAPI.liveTestCrawler({ companyName: cName });
        const resObj = {
          companyName: cName,
          success: data.success,
          careerUrl: data.careerUrl,
          jobsCount: data.jobs?.length || 0,
          emailsCount: data.emails?.length || 0,
          message: data.message
        };
        currentResults = [...currentResults, resObj];
        setBulkResults(currentResults);
      } catch (err) {
        const resObj = {
          companyName: cName,
          success: false,
          careerUrl: null,
          jobsCount: 0,
          emailsCount: 0,
          message: 'Error'
        };
        currentResults = [...currentResults, resObj];
        setBulkResults(currentResults);
      }
    }
    setBulkProcessing(false);
    toast.success('Bulk scrape completed!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HiLightningBolt className="w-5 h-5 text-amber-500" />
            Live Generic Crawler Tester
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Instantly test the custom DuckDuckGo & Schema.org hybrid crawler.
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'single' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Single Company
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'bulk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Bulk CSV Upload
          </button>
        </div>
      </div>

      {activeTab === 'single' && (
        <>
          <form onSubmit={handleScrape} className="flex gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <HiSearch className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Airbnb, Zomato"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm transition-colors hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 min-w-[120px]"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Scrape Now'}
            </button>
          </form>

          {result && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <h3 className="font-semibold text-indigo-900">Results for: {companyName}</h3>
                <p className="text-sm text-indigo-700 mt-1">
                  <strong>Career URL Found:</strong> {result.careerUrl ? (
                    <a href={result.careerUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-900">{result.careerUrl}</a>
                  ) : 'None'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 font-semibold text-gray-700 flex items-center gap-2">
                    <HiOutlineBriefcase className="w-5 h-5" />
                    Jobs Extracted ({result.jobs?.length || 0})
                  </div>
                  <div className="p-0 max-h-96 overflow-y-auto">
                    {result.jobs && result.jobs.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {result.jobs.map((job, idx) => (
                          <li key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="font-medium text-gray-900">{job.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{job.locationText || 'No location'}</div>
                            <a href={job.applyUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">View Job &rarr;</a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">No standard JobPosting schemas found.</div>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 font-semibold text-gray-700 flex items-center gap-2">
                    <HiOutlineMail className="w-5 h-5" />
                    Emails Extracted ({result.emails?.length || 0})
                  </div>
                  <div className="p-0 max-h-96 overflow-y-auto">
                    {result.emails && result.emails.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {result.emails.map((email, idx) => (
                          <li key={idx} className="p-4 hover:bg-gray-50 transition-colors text-sm text-gray-800">
                            {email}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">No valid emails found on page.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex-1 flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <HiUpload className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Upload CSV (Names Only)</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} disabled={bulkProcessing} />
              </label>
              
              <button 
                onClick={() => {
                  const content = "Stripe\nAirbnb\nCoinbase\nNotion\nFigma\nVercel\nOpenAI\nAnthropic\nZomato\nSwiggy";
                  const blob = new Blob([content], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sample_companies.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Download Sample CSV
              </button>
            </div>
            
            {bulkCompanies.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <HiDocumentText className="w-4 h-4" /> 
                  <strong>{bulkCompanies.length}</strong> companies loaded
                </div>
                <button
                  onClick={handleBulkScrape}
                  disabled={bulkProcessing || bulkProgress.current === bulkCompanies.length}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {bulkProcessing ? (
                    <><LoadingSpinner size="sm" /> Processing ({bulkProgress.current}/{bulkProgress.total})</>
                  ) : bulkProgress.current === bulkCompanies.length ? (
                    'Completed'
                  ) : (
                    'Run Bulk Scraper'
                  )}
                </button>
              </div>
            )}
          </div>

          {bulkResults.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 font-semibold text-gray-700">
                Bulk Extraction Results
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Company Name</th>
                      <th className="px-4 py-3 font-medium">Career URL</th>
                      <th className="px-4 py-3 font-medium text-center">Jobs</th>
                      <th className="px-4 py-3 font-medium text-center">Emails</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {bulkResults.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.companyName}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                          {r.careerUrl ? (
                            <a href={r.careerUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{r.careerUrl}</a>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center min-w-8 px-1.5 py-0.5 rounded-full text-xs font-medium ${r.jobsCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {r.jobsCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center min-w-8 px-1.5 py-0.5 rounded-full text-xs font-medium ${r.emailsCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                            {r.emailsCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.success ? (
                            <span className="text-green-600 font-medium">Success</span>
                          ) : (
                            <span className="text-red-500 font-medium">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bulkProcessing && (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <LoadingSpinner size="md" />
                            <p className="text-sm">Scraping <strong>{bulkCompanies[bulkProgress.current]}</strong>... ({bulkProgress.current + 1}/{bulkProgress.total})</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveScraper;
