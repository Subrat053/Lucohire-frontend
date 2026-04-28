import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBriefcase, HiLocationMarker, HiCurrencyRupee, HiSearch, HiFilter,
  HiCheckCircle, HiClock, HiOfficeBuilding, HiChevronLeft, HiChevronRight,
  HiX, HiDocumentText, HiExclamationCircle, HiSparkles,
} from 'react-icons/hi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { jobsAPI, subscriptionAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LocationSearch from '../../components/LocationSearch';

const BUDGET_LABELS = { fixed: 'Fixed', hourly: '/hr', monthly: '/mo', negotiable: 'Negotiable' };
const STATUS_COLORS = {
  pending:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewed:    'bg-blue-50 text-blue-700 border-blue-200',
  shortlisted: 'bg-purple-50 text-purple-700 border-purple-200',
  rejected:    'bg-red-50 text-red-700 border-red-200',
  hired:       'bg-green-50 text-green-700 border-green-200',
};

/* ── Apply Modal ─────────────────────────────────────────────────────── */
const ApplyModal = ({ job, onClose, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await jobsAPI.applyToJob(job._id, { coverLetter });
      toast.success('Application submitted!');
      onSuccess(job._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Apply for: {job.title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-gray-800">Recruiter:</span> {job.recruiter?.name || 'Company'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">Skill needed:</span> {job.skill} · {job.city}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              maxLength={1000}
              placeholder="Briefly introduce yourself, your experience, and why you're a great fit..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-0.5">{coverLetter.length}/1000</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Job Card ────────────────────────────────────────────────────────── */
const JobCard = ({ job, onApply }) => {
  const budgetText = job.budgetType === 'negotiable'
    ? 'Negotiable'
    : `₹${job.budgetMin?.toLocaleString()} – ₹${job.budgetMax?.toLocaleString()} ${BUDGET_LABELS[job.budgetType] || ''}`.trim();

  const postedAgo = (() => {
    const d = Math.floor((Date.now() - new Date(job.createdAt)) / 86400000);
    return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`;
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base truncate">{job.title}</h3>
            {job.hasApplied && (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                <HiCheckCircle className="w-3.5 h-3.5" /> Applied
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1"><HiOfficeBuilding className="w-3.5 h-3.5" />{job.recruiter?.name || 'Company'}</span>
            <span className="flex items-center gap-1"><HiLocationMarker className="w-3.5 h-3.5" />{job.city}</span>
            <span className="flex items-center gap-1"><HiClock className="w-3.5 h-3.5" />{postedAgo}</span>
          </div>
          <span className="inline-block text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium border border-indigo-100">
            {job.skill}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-gray-900 flex items-center gap-0.5 justify-end">
            <FaRupeeSign className="w-3 h-3 text-gray-500" />
            {job.budgetType === 'negotiable' ? 'Negotiable' : `${job.budgetMin?.toLocaleString()}+`}
          </p>
          <p className="text-xs text-gray-400">{BUDGET_LABELS[job.budgetType]}</p>
        </div>
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{job.description}</p>
      )}

      {job.requirements?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.requirements.slice(0, 3).map((r, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md border border-gray-100">{r}</span>
          ))}
          {job.requirements.length > 3 && (
            <span className="text-xs text-gray-400">+{job.requirements.length - 3} more</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <HiDocumentText className="w-3.5 h-3.5" />
          {job.applicants?.length || 0} applicant{job.applicants?.length !== 1 ? 's' : ''}
        </p>
        {job.hasApplied ? (
          <span className="text-xs font-medium text-green-600">Application submitted</span>
        ) : (
          <button
            onClick={() => onApply(job)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Applications Tab ────────────────────────────────────────────────── */
const ApplicationsTab = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsAPI.getMyApplications()
      .then(r => setApps(r.data.applications || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!apps.length) return (
    <div className="text-center py-16 text-gray-400">
      <HiDocumentText className="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p className="font-medium">No applications yet</p>
      <p className="text-sm mt-1">Browse jobs and apply to get started</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {apps.map(app => (
        <div key={app._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-gray-900">{app.jobPost?.title || 'Job'}</h4>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><HiOfficeBuilding className="w-3.5 h-3.5" />{app.jobPost?.recruiter?.name || 'Recruiter'}</span>
                <span className="flex items-center gap-1"><HiLocationMarker className="w-3.5 h-3.5" />{app.jobPost?.city}</span>
                <span className="flex items-center gap-1"><HiClock className="w-3.5 h-3.5" />Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[app.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {app.status}
            </span>
          </div>
          {app.coverLetter && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2 bg-gray-50 rounded-xl px-3 py-2">{app.coverLetter}</p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────── */
const ProviderJobs = () => {
  const [tab, setTab] = useState('browse'); // 'browse' | 'applications'
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [filters, setFilters] = useState({ skill: '', city: '' });
  const [search, setSearch] = useState({ skill: '', city: '' });
  const [applyTarget, setApplyTarget] = useState(null);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search.skill) params.skill = search.skill;
      if (search.city) params.city = search.city;
      const { data } = await jobsAPI.getAvailableJobs(params);
      setJobs(data.jobs || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  useEffect(() => {
    subscriptionAPI.getMySubscription()
      .then(r => setSubscription(r.data))
      .catch(() => {});
  }, []);

  const handleApplySuccess = (jobId) => {
    setApplyTarget(null);
    setJobs(prev => prev.map(j => j._id === jobId ? { ...j, hasApplied: true } : j));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ skill: filters.skill, city: filters.city });
  };

  const clearFilters = () => {
    setFilters({ skill: '', city: '' });
    setSearch({ skill: '', city: '' });
  };

  const planName = subscription?.plan?.name;
  const applyLimit = subscription?.plan?.jobApplyLimit;
  const remainingApply = subscription?.remainingApplyLimit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-700 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-extrabold text-white mb-1">Find Recruiters</h1>
          <p className="text-indigo-100 text-sm">Browse job openings from recruiters looking for your skills</p>
          {planName && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-medium">
              <HiSparkles className="w-3.5 h-3.5" />
              {planName} Plan
              {applyLimit !== -1 && remainingApply !== undefined && (
                <span className="text-indigo-100">· {remainingApply} applications remaining</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
          {[['browse', 'Browse Jobs'], ['applications', 'My Applications']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-500 font-medium mb-1">Skill / Job Title</label>
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Plumber, Designer…"
                    value={filters.skill}
                    onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-500 font-medium mb-1">City / Location</label>
                <LocationSearch
                  value={filters.city}
                  onChange={(value) => setFilters(f => ({ ...f, city: value }))}
                  onSelect={(item) => setFilters(f => ({ ...f, city: item?.name || f.city }))}
                  placeholder="e.g. Mumbai, Delhi…"
                  className="focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-2">
                {(search.skill || search.city) && (
                  <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                    Clear
                  </button>
                )}
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                  <HiFilter className="w-4 h-4" /> Search
                </button>
              </div>
            </form>

            {/* Results */}
            {loading ? (
              <div className="flex justify-center py-16"><LoadingSpinner /></div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <HiBriefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-gray-600">No jobs found</p>
                {(search.skill || search.city) && (
                  <p className="text-sm mt-1">Try different keywords or <button onClick={clearFilters} className="text-indigo-600 font-medium">clear filters</button></p>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">{pagination.total} job{pagination.total !== 1 ? 's' : ''} found</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {jobs.map(job => (
                    <JobCard key={job._id} job={job} onApply={setApplyTarget} />
                  ))}
                </div>
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchJobs(pagination.page - 1)}
                      className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <HiChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">Page {pagination.page} of {pagination.pages}</span>
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchJobs(pagination.page + 1)}
                      className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <HiChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'applications' && <ApplicationsTab />}
      </div>

      {/* Apply Modal */}
      {applyTarget && (
        <ApplyModal
          job={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
};

export default ProviderJobs;
