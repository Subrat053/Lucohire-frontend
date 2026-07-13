import React, { useState } from 'react';
import { HiDownload, HiUpload, HiUsers, HiDocumentText, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ImportRecruiters() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setLastResult(null);
      const { data } = await adminAPI.uploadRecruiters(formData);
      toast.success(data.message || 'Upload completed');
      
      setLastResult({
        success: true,
        message: data.message,
        errors: data.errors || []
      });
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Upload errors:', data.errors);
        toast.error(`Completed with ${data.errors.length} errors, see details below.`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to upload CSV';
      toast.error(errorMsg);
      setLastResult({
        success: false,
        message: errorMsg,
        errors: []
      });
    } finally {
      setLoading(false);
      e.target.value = null; // reset
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/50 min-h-screen space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] flex items-center gap-2">
            Import Recruiters
          </h1>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">
            Bulk import recruiters using a structured CSV file.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-white">
          <h3 className="text-sm font-bold text-gray-900">Upload Data</h3>
        </div>
        
        <div className="p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100">
            <HiDocumentText className="w-8 h-8 text-teal-600" />
          </div>
          
          <div className="max-w-md">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Import via CSV</h4>
            <p className="text-sm text-gray-500 mb-6">
              Download our template, fill in the recruiter data (Name, Email, Company, Phone), and upload it back here. The system will automatically create accounts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/seed_recruiters.csv" 
                download 
                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <HiDownload className="w-5 h-5 text-gray-400" /> 
                Download Template
              </a>
              
              <label className="cursor-pointer px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-teal-200 transition-all flex items-center gap-2 w-full sm:w-auto justify-center relative overflow-hidden">
                {loading ? (
                  <>
                    <LoadingSpinner /> Processing...
                  </>
                ) : (
                  <>
                    <HiUpload className="w-5 h-5" />
                    Upload CSV File
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      disabled={loading}
                    />
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {lastResult && (
        <div className={`bg-white rounded-xl shadow-sm border p-6 ${lastResult.errors?.length > 0 ? 'border-amber-200' : lastResult.success ? 'border-emerald-200' : 'border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            {lastResult.success && lastResult.errors?.length === 0 ? (
              <HiCheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <HiExclamationCircle className={`w-6 h-6 ${lastResult.success ? 'text-amber-500' : 'text-red-500'}`} />
            )}
            <h3 className="text-base font-bold text-gray-900">Import Results</h3>
          </div>
          
          <p className="text-sm font-medium text-gray-700 mb-4">{lastResult.message}</p>
          
          {lastResult.errors && lastResult.errors.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 max-h-64 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Error Log ({lastResult.errors.length})</h4>
              <ul className="space-y-1">
                {lastResult.errors.map((err, idx) => (
                  <li key={idx} className="text-sm text-amber-700">
                    <span className="font-bold mr-2">Row {err.row || idx + 1}:</span>
                    {err.error || err.message || JSON.stringify(err)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
