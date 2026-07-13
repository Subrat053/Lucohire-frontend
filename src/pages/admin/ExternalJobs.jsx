import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Briefcase, Download, Search, Filter, MapPin, Building, Globe, ExternalLink, RefreshCw, Trash2, ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert, FileSpreadsheet, Sparkles } from 'lucide-react';

const ExternalJobs = ({ defaultFilters = {} }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', source: '', isActive: 'true', page: 1, search: '', ...defaultFilters });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [uniqueCompaniesCount, setUniqueCompaniesCount] = useState(0);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
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
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ats_companies.csv');
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("CSV Downloaded Successfully!", { id: "csv" });
    } catch (err) {
      toast.error("Failed to download CSV", { id: "csv" });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[22px] font-black text-[#0F172A] tracking-tight">Synced Jobs Library</h1>
            <p className="text-[13px] font-medium text-gray-500 mt-0.5">
              Monitor and manage {pagination?.total?.toLocaleString() || 0} jobs mapped from external sources.
            </p>
          </div>
        </div>

        {/* Highlight Banner for CSV Export */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl p-[1px] shadow-sm">
          <div className="bg-white rounded-[15px] p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-50"></div>
            
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-black text-gray-900">Companies Network Export</h2>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" /> New
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500">
                  We are currently syncing jobs from <span className="font-black text-indigo-600">{uniqueCompaniesCount.toLocaleString()}</span> unique external companies. Download the complete master list to analyze sources, locations, and integrations.
                </p>
              </div>
            </div>
            <div className="shrink-0 z-10 w-full md:w-auto">
              <button
                onClick={handleDownloadCompaniesCsv}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Download Master CSV
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          
          {/* Horizontal Filters Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 pr-4 sm:border-r border-gray-100">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-black text-gray-900">Filters</span>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                  <select 
                    value={filters.isActive} 
                    onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value, page: 1 }))}
                    className="w-full text-xs font-bold text-gray-700 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                  >
                    <option value="true">Active Only</option>
                    <option value="false">Closed Only</option>
                    <option value="">All Statuses</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <select 
                    value={filters.source}
                    onChange={(e) => setFilters(f => ({ ...f, source: e.target.value, page: 1 }))}
                    className="w-full text-xs font-bold text-gray-700 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all capitalize"
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
                </div>
                <div className="w-full sm:w-auto">
                  <select 
                    value={filters.country}
                    onChange={(e) => setFilters(f => ({ ...f, country: e.target.value, page: 1 }))}
                    className="w-full text-xs font-bold text-gray-700 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                  >
                    <option value="">All Countries</option>
                    <option value="US">USA (US)</option>
                    <option value="IN">India (IN)</option>
                    <option value="GB">UK (GB)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="AU">Australia (AU)</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto sm:ml-auto">
                  <button 
                    onClick={() => setFilters({ country: '', source: '', isActive: 'true', page: 1, search: '' })}
                    className="w-full sm:w-auto text-[11px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2.5 rounded-lg"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            {/* Table Search & Stats Bar */}
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-50 bg-gray-50/50">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
                />
              </form>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-400" /> {pagination.total.toLocaleString()} Synced Jobs
                </span>
              </div>
            </div>

            {/* Table Data */}
            <div className="overflow-x-auto custom-scrollbar relative min-h-[400px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-white">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Job Position</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Location</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Salary Range</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Source</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
                              <Briefcase className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900 truncate max-w-[220px]" title={job.title}>{job.title}</div>
                              <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <Building className="w-3.5 h-3.5 text-gray-400" /> {job.companyName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="truncate max-w-[120px]">{job.city || 'Anywhere'}</span>
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-5 mt-1">
                            {job.countryCode || 'Global'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-black text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block">
                            {job.salaryMin ? `${job.currency || '$'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax ? job.salaryMax.toLocaleString() : 'N/A'}` : 'Not Specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg tracking-wider">
                            {job.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-max ${
                            job.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {job.isActive ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {job.isActive ? 'Active' : 'Closed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                            {job.sourceUrl && (
                              <a 
                                href={job.sourceUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
                                title="View Original Job"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button 
                              onClick={() => handleRefresh(job._id)}
                              disabled={refreshingId === job._id}
                              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50"
                              title="Refresh Status"
                            >
                              {refreshingId === job._id ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleDelete(job._id)}
                              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Search className="w-12 h-12 mb-4 text-gray-300" />
                            <p className="text-sm font-bold text-gray-900 mb-1">No jobs found</p>
                            <p className="text-xs font-medium">Try adjusting your filters or search query.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500">
                Showing <span className="font-bold text-gray-900">{jobs.length > 0 ? 1 : 0}</span> to <span className="font-bold text-gray-900">{jobs.length}</span> of {pagination.total.toLocaleString()} jobs
              </div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-4 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-black shadow-sm">
                  Page {pagination.page} of {pagination.pages}
                </button>
                <button 
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalJobs;
