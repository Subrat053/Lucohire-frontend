import { useState, useEffect } from 'react';
import { HiTrash, HiRefresh, HiExternalLink, HiDownload } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ExternalJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', source: '', isActive: 'true', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [uniqueCompaniesCount, setUniqueCompaniesCount] = useState(0);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const { data } = await adminAPI.getExternalJobs(filters);
      setJobs(data.jobs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      setUniqueCompaniesCount(data.uniqueCompaniesCount || 0);
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

  const handleDownloadCompaniesCsv = async () => {
    try {
      toast.loading("Generating CSV...", { id: "csv" });
      const response = await adminAPI.exportExternalCompaniesCsv();
      
      // Create a blob URL for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ats_companies.csv');
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("CSV Downloaded Successfully!", { id: "csv" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to download CSV", { id: "csv" });
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
          <h1 className="text-2xl font-bold text-gray-900">Synced Job Postings</h1>
          <p className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2 items-center">
            Monitor and manage all jobs fetched from external sources and synced ATS platforms. 
            {pagination?.total !== undefined && (
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Total Scraped: {pagination.total.toLocaleString()}
              </span>
            )}
            {uniqueCompaniesCount > 0 && (
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Unique Companies: {uniqueCompaniesCount.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleDownloadCompaniesCsv}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 text-sm"
        >
          <HiDownload className="w-5 h-5" />
          Download Companies (CSV)
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50/50">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={job.title}>{job.title}</h3>
                    <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-1">
                      {job.companyName}
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      {job.city}, {job.countryCode}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    job.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {job.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">ATS Source</span>
                    <span className="font-mono text-xs font-bold capitalize text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                      {job.source}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Salary</span>
                    <span className="font-semibold text-gray-800">
                      {job.salaryMin ? `${job.currency || '$'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax ? job.salaryMax.toLocaleString() : 'N/A'}` : 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-auto">
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition font-semibold text-sm"
                  >
                    View Source <HiExternalLink className="w-4 h-4" />
                  </a>
                  
                  <button
                    onClick={() => handleRefresh(job._id)}
                    disabled={refreshingId === job._id}
                    className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-xl transition border border-gray-200"
                    title="Force Refresh"
                  >
                    {refreshingId === job._id ? <LoadingSpinner size="sm" /> : <HiRefresh className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="p-2 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition border border-gray-200"
                    title="Delete"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
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
