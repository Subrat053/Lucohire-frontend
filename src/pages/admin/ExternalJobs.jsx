import { useState, useEffect } from 'react';
import { HiTrash, HiRefresh, HiExternalLink } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ExternalJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', source: '', isActive: 'true', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const { data } = await adminAPI.getExternalJobs(filters);
      setJobs(data.jobs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to load external jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this synced job posting?')) return;
    try {
      await adminAPI.deleteExternalJob(id);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const handleRefresh = async (id) => {
    setRefreshingId(id);
    try {
      await adminAPI.refreshExternalJob(id);
      toast.success('Job status refreshed');
      fetchJobs();
    } catch (err) {
      toast.error('Failed to refresh job');
    } finally {
      setRefreshingId(null);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Synced Job Postings</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all jobs fetched from external sources and synced ATS platforms.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 mb-6 text-sm">
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
          value={filters.source}
          onChange={(e) => setFilters(f => ({ ...f, source: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold capitalize"
        >
          <option value="">All Sources</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="smartrecruiters">SmartRecruiters</option>
          <option value="workable">Workable</option>
          <option value="adzuna">Adzuna</option>
          <option value="jooble">Jooble</option>
          <option value="usajobs">USAJobs</option>
          <option value="themuse">The Muse</option>
          <option value="arbeitnow">Arbeitnow</option>
          <option value="remoteok">RemoteOK</option>
          <option value="remotive">Remotive</option>
        </select>
        <select
          value={filters.isActive}
          onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
          <option value="">All Statuses</option>
        </select>
      </div>

      {/* Ingested jobs table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {jobs.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No synced jobs found matching the active filters. Run ingestion sync to fetch jobs.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Salary Period</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Apply Link</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-600">{job.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{job.city}, {job.countryCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-700 font-mono text-xs">{job.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-semibold">
                      {job.salaryMin ? `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax ? job.salaryMax.toLocaleString() : 'N/A'}` : 'Not Specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 hover:underline">
                      <a href={job.applyUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold">
                        View URL <HiExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        job.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {job.isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRefresh(job._id)}
                          disabled={refreshingId === job._id}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Force Refresh"
                        >
                          <HiRefresh className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Delete"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination bar */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-semibold"
          >
            Previous
          </button>
          <span className="font-semibold text-gray-600">Page {filters.page} of {pagination.pages}</span>
          <button
            disabled={filters.page === pagination.pages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-semibold"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExternalJobs;
