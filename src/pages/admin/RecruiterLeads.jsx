import { useState, useEffect } from 'react';
import { HiDownload, HiTrash, HiMail, HiOutlineClipboardList, HiUpload, HiX } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const RecruiterLeads = () => {
  const [leads, setLeads] = useState([]);
  const [manualLeads, setManualLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('automatic'); // 'automatic' | 'manual'
  const [filters, setFilters] = useState({ country: '', status: '', hiringLevel: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  
  // CSV Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recruiterTemplate, setRecruiterTemplate] = useState(
    'Hi {{name}},\n\nI noticed {{company}} is growing! We at Lucohire are a premium matching platform connecting top companies with pre-vetted professionals.\n\nHere is your exclusive profile link to manage candidates and start hiring instantly:\n{{profile_link}}\n\nWe streamline your hiring process. If you want to be removed from our outreach, click here:\n{{delete_link}}'
  );
  const [providerTemplate, setProviderTemplate] = useState(
    'Hi {{name}},\n\nWe noticed your impressive background! Lucohire is an exclusive platform where top companies actively seek out talented professionals like you.\n\nHere is your exclusive profile link to view your matched opportunities and start connecting with recruiters:\n{{profile_link}}\n\nTake control of your career journey. If you want to be removed from our outreach, click here:\n{{delete_link}}'
  );

  const fetchLeads = async () => {
    try {
      setLoading(true);
      if (activeTab === 'automatic') {
        const { data } = await adminAPI.getRecruiterLeads(filters);
        setLeads(data.leads || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      } else {
        const { data } = await adminAPI.getManualOutreachLeads();
        setManualLeads(data || []);
      }
    } catch (err) {
      toast.error('Failed to load recruiter leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters, activeTab]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateRecruiterLead(id, { status: newStatus });
      toast.success('Lead status updated');
      fetchLeads();
    } catch (err) {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recruiter lead?')) return;
    try {
      await adminAPI.deleteRecruiterLead(id);
      toast.success('Recruiter lead deleted');
      fetchLeads();
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  const handleExportCSV = () => {
    const query = new URLSearchParams({
      country: filters.country,
      status: filters.status
    }).toString();
    const API_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || '/api/v1';
    window.open(`${API_URL}/admin/recruiter-leads/export/csv?${query}`, '_blank');
    toast.success('CSV export started');
  };

  const handleDownloadSample = () => {
    const csv = 'name,companyName,contactDetails,role\nJohn Doe,Tech Corp,john@techcorp.com,recruiter\nJane Smith,Startup Inc,+1234567890,provider\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
  };

  const handleUploadCSV = async () => {
    if (!csvFile) return toast.error('Please select a CSV file');
    if (!recruiterTemplate || !providerTemplate) return toast.error('Email templates cannot be empty');

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('recruiterTemplate', recruiterTemplate);
    formData.append('providerTemplate', providerTemplate);

    try {
      setUploading(true);
      // We will need to make sure adminAPI has this method
      const { data } = await adminAPI.uploadRecruiterLeadsCsv(formData);
      toast.success(data.message || 'Upload successful');
      setShowUploadModal(false);
      setCsvFile(null);
      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter B2B Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor high-hiring companies, public careers contacts, and business development leads.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-medium text-sm shadow-sm"
          >
            <HiUpload className="w-5 h-5" /> Import B2B Leads (CSV)
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 transition font-medium text-sm"
          >
            <HiDownload className="w-5 h-5" /> Export B2B Leads
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('automatic')}
          className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'automatic' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          System-Found Leads
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'manual' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Uploaded Leads (CSV)
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Upload Contacts from CSV</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-blue-900 mb-2">How this works</h3>
                <p className="text-xs text-blue-700 mb-3">
                  When you upload a CSV, we automatically create a private profile for each person and send them a personalized email or WhatsApp message with a magic link to claim it.
                </p>
                <button 
                  onClick={handleDownloadSample}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Download Sample CSV Template
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">1. Upload CSV File</label>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">2. Message for Recruiters / Companies</label>
                  <p className="text-xs text-gray-500 mb-2">Sent when Company Name is present. Tags: {'{{name}}'}, {'{{company}}'}, {'{{profile_link}}'}, {'{{delete_link}}'}</p>
                  <textarea
                    value={recruiterTemplate}
                    onChange={(e) => setRecruiterTemplate(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">3. Message for Candidates / Providers</label>
                  <p className="text-xs text-gray-500 mb-2">Sent when Company Name is empty or N/A. Tags: {'{{name}}'}, {'{{profile_link}}'}, {'{{delete_link}}'}</p>
                  <textarea
                    value={providerTemplate}
                    onChange={(e) => setProviderTemplate(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadCSV}
                disabled={uploading || !csvFile}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <LoadingSpinner size="sm" /> : <HiUpload className="w-5 h-5" />}
                {uploading ? 'Processing...' : 'Start Outreach Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 mb-6 text-sm">
        <input
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search by company or HR email..."
          className="flex-1 min-w-[200px] px-3.5 py-2 border border-gray-200 rounded-xl outline-none"
        />
        <select
          value={filters.country}
          onChange={(e) => setFilters(f => ({ ...f, country: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="">All Countries</option>
          <option value="US">USA (US)</option>
          <option value="IN">India (IN)</option>
          <option value="GB">UK (GB)</option>
          <option value="CA">Canada (CA)</option>
          <option value="AE">UAE (AE)</option>
          <option value="AU">Australia (AU)</option>
        </select>
        <select
          value={filters.hiringLevel}
          onChange={(e) => setFilters(f => ({ ...f, hiringLevel: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="">All Hiring Levels</option>
          <option value="priority">Priority Hiring</option>
          <option value="very_high">Very High Hiring</option>
          <option value="high">High Hiring</option>
          <option value="normal">Normal Hiring</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="interested">Interested</option>
          <option value="not_interested">Not Interested</option>
        </select>
      </div>

      {/* Listing Cards for Automatic/System-Found Leads */}
      {activeTab === 'automatic' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {leads.length === 0 ? (
            <div className="col-span-full p-10 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
              No recruiter leads discovered yet. Sync external sources to find high-hiring leads.
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{lead.companyName}</h3>
                    <span className="text-xs font-mono text-gray-500">{lead.companyDomain}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(lead._id)}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                    title="Delete"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-6 flex-grow">
                  <div className="flex flex-col gap-2 text-sm">
                    {lead.careersEmail && (
                      <span className="flex items-center gap-2 text-blue-600 font-medium">
                        <HiMail className="w-4 h-4" /> {lead.careersEmail}
                      </span>
                    )}
                    {lead.publicHrEmail && (
                      <span className="flex items-center gap-2 text-purple-600 font-medium">
                        <HiMail className="w-4 h-4" /> {lead.publicHrEmail}
                      </span>
                    )}
                    {lead.contactPageUrl && (
                      <a href={lead.contactPageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-500 underline hover:text-gray-800 font-medium">
                        <HiOutlineClipboardList className="w-4 h-4" /> Contact Page
                      </a>
                    )}
                    {!lead.careersEmail && !lead.publicHrEmail && !lead.contactPageUrl && (
                      <span className="text-gray-400 italic">No contacts found</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="block text-gray-500 mb-1 font-medium">ATS Used</span>
                      <span className="font-bold text-gray-800 capitalize">{lead.atsUsed || 'Unknown'}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="block text-gray-500 mb-1 font-medium">Active Jobs</span>
                      <span className="font-bold text-gray-800">{lead.activeJobCount || 0}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="block text-gray-500 mb-1 font-medium">Country</span>
                      <span className="font-bold text-blue-600">{lead.countryCode}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="block text-gray-500 mb-1 font-medium">Hiring Level</span>
                      <span className={`font-bold capitalize ${
                        lead.hiringLevel === 'priority' ? 'text-red-600' : 
                        lead.hiringLevel === 'very_high' ? 'text-orange-600' : 
                        lead.hiringLevel === 'high' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{lead.hiringLevel || 'normal'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-4 mt-4">
                    <span className="text-gray-500 font-medium">Outreach Status:</span>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg outline-none bg-white text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {manualLeads.length === 0 ? (
            <div className="col-span-full p-10 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
              No manual outreach leads found. Upload a CSV to get started!
            </div>
          ) : (
            manualLeads.map((lead) => (
              <div key={lead._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{lead.companyName}</h3>
                    <span className="text-xs font-mono text-gray-500">{lead.companyDomain}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(lead._id)}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                    title="Delete"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-6 flex-grow">
                  <div className="flex items-center gap-2 text-sm">
                    <HiMail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{lead.careersEmail || 'No Email Provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-3">
                    <span className="text-gray-500 font-medium">Outreach Status:</span>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg outline-none bg-white text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Profile Claim</span>
                    {lead.claimStatus === 'Claimed' ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        Came to Platform
                      </span>
                    ) : lead.claimStatus === 'Pending' ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Pending Claim
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
                        Unknown
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterLeads;
