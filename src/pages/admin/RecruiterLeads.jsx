import { useState, useEffect } from 'react';
import { HiDownload, HiTrash, HiMail, HiOutlineClipboardList } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const RecruiterLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', status: '', hiringLevel: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      const { data } = await adminAPI.getRecruiterLeads(filters);
      setLeads(data.leads || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to load recruiter leads');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter B2B Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor high-hiring companies, public careers contacts, and business development leads.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 transition font-medium text-sm"
        >
          <HiDownload className="w-5 h-5" /> Export B2B Leads (CSV)
        </button>
      </div>

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

      {/* Listing Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {leads.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No recruiter leads discovered yet. Sync external sources to find high-hiring leads.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Public Contacts</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ATS Used</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Active Jobs</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hiring Tier</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lead Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      {lead.companyName}
                      <span className="block text-xs font-semibold text-gray-400 font-mono">{lead.companyDomain}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-xs font-medium">
                        {lead.careersEmail && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <HiMail className="w-3.5 h-3.5" /> {lead.careersEmail}
                          </span>
                        )}
                        {lead.publicHrEmail && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <HiMail className="w-3.5 h-3.5" /> {lead.publicHrEmail}
                          </span>
                        )}
                        {lead.contactPageUrl && (
                          <a href={lead.contactPageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-gray-500 underline hover:text-gray-800">
                            <HiOutlineClipboardList className="w-3.5 h-3.5" /> Contact Page
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">{lead.countryCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-500 font-mono text-xs">{lead.atsUsed || 'unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{lead.activeJobCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        lead.hiringLevel === 'priority' 
                          ? 'bg-red-50 text-red-700' 
                          : lead.hiringLevel === 'very_high' 
                            ? 'bg-orange-50 text-orange-700' 
                            : lead.hiringLevel === 'high' 
                              ? 'bg-yellow-50 text-yellow-700' 
                              : 'bg-green-50 text-green-700'
                      }`}>
                        {lead.hiringLevel || 'normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none bg-white text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(lead._id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterLeads;
