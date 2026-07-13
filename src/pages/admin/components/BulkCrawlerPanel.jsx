import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { adminAPI } from '../../../services/api';

const BulkCrawlerPanel = () => {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  const processCompanies = async () => {
    if (!inputText.trim()) {
      setError("Please enter or upload companies first.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult([]); // We'll use result as an array of progress objects

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
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const chunks = buffer.split('\n');
        // Keep the last partial chunk in the buffer
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
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to trigger bulk upload.');
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-500" />
          Bulk Career Page Mapping
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV or paste a list of company names. The system will automatically find their career pages, store them, and perform an initial job scrape.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors relative">
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Click to upload CSV</h3>
            <p className="text-xs text-gray-500">Only the first column (Company Name) will be used.</p>
          </div>

          {/* Text Area */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Or paste company names (one per line)</label>
            <textarea
              className="w-full h-full min-h-[160px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="Stripe&#10;Google&#10;Microsoft"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {Array.isArray(result) && result.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Live Crawl Status</h3>
            </div>
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {result.map((item, idx) => (
                <li key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {item.status === 'crawling' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {item.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-700" />}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.company}</p>
                      {item.careerUrl && (
                        <a href={item.careerUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">
                          {item.careerUrl}
                        </a>
                      )}
                      {item.error && <p className="text-xs text-red-500 mt-0.5">{item.error}</p>}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {item.status === 'crawling' && (
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Scraping...</span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {item.jobsFound} Jobs Found
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">No URL Found</span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">Failed</span>
                    )}
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
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isUploading ? 'Processing...' : 'Start Mapping Engine'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkCrawlerPanel;
