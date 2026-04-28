import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiArrowLeft, HiDocumentText, HiCheckCircle, HiClock,
  HiX, HiEye, HiPhone, HiCheck, HiExclamation,
} from 'react-icons/hi';
import { recruiterAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:     { bg: 'bg-yellow-50',    border: 'border-yellow-200',    text: 'text-yellow-700',    icon: HiClock, label: 'Pending' },
  reviewed:    { bg: 'bg-blue-50',     border: 'border-blue-200',     text: 'text-blue-700',     icon: HiEye, label: 'Reviewed' },
  contacted:   { bg: 'bg-purple-50',   border: 'border-purple-200',   text: 'text-purple-700',   icon: HiPhone, label: 'Contacted' },
  shortlisted:{ bg: 'bg-indigo-50',    border: 'border-indigo-200',   text: 'text-indigo-700',   icon: HiCheck, label: 'Shortlisted' },
  rejected:    { bg: 'bg-red-50',      border: 'border-red-200',      text: 'text-red-700',      icon: HiX, label: 'Rejected' },
  hired:       { bg: 'bg-green-50',    border: 'border-green-200',    text: 'text-green-700',    icon: HiCheckCircle, label: 'Hired' },
};

const ApplicationCard = ({ application, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  const provider = application.provider;
  const job = application.jobPost;
  const currentStatus = application.status;
  const statusInfo = STATUS_COLORS[currentStatus] || STATUS_COLORS.pending;
  const StatusIcon = statusInfo.icon;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await recruiterAPI.updateApplicationStatus(application._id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      onStatusChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-5 ${statusInfo.bg} ${statusInfo.border}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{provider?.name || 'Provider'}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}>
              <StatusIcon className="w-3 h-3" /> {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Job:</span> {job?.title || 'Unknown Job'}
          </p>
          {application.coverLetter && (
            <p className="text-sm text-gray-600 bg-white/50 rounded-lg px-3 py-2 border border-gray-200/50">
              "{application.coverLetter}"
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Applied {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status transition buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-current/10">
        {['reviewed', 'contacted', 'shortlisted', 'rejected', 'hired'].map(status => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={updating || currentStatus === status}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentStatus === status
                ? 'bg-white/50 text-gray-500 cursor-default'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            } disabled:opacity-50`}
          >
            {statusInfo.label === STATUS_COLORS[status]?.label ? '✓' : '→'} {STATUS_COLORS[status]?.label || status}
          </button>
        ))}
      </div>
    </div>
  );
};

const RecruiterApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const jobsRes = await recruiterAPI.getJobs();
      setJobs(jobsRes.data || []);
      if (jobsRes.data?.length > 0) {
        setSelectedJob(jobsRes.data[0]._id);
        fetchApplications(jobsRes.data[0]._id);
      }
    } catch {
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    setLoading(true);
    try {
      const res = await recruiterAPI.getJobApplications(jobId);
      setApplications(res.data || []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleJobChange = (jobId) => {
    setSelectedJob(jobId);
    fetchApplications(jobId);
  };

  const filteredApplications = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  const statsCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    contacted: applications.filter(a => a.status === 'contacted').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    hired: applications.filter(a => a.status === 'hired').length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#f8f9ff 60%,#fafafa 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
            <p className="text-sm text-gray-500">Review and manage applications for your posted jobs</p>
          </div>
        </div>

        {/* Job Selector */}
        {jobs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select a Job</label>
            <select
              value={selectedJob || ''}
              onChange={(e) => handleJobChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white"
            >
              {jobs.map(job => (
                <option key={job._id} value={job._id}>
                  {job.title} ({job.skill}) - {job.city}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-6">
            <HiDocumentText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No jobs posted yet. Post a job to receive applications.</p>
            <button
              onClick={() => navigate('/recruiter/post-job')}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Post a Job
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        {applications.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-6 flex flex-wrap gap-2">
            {['all', 'pending', 'reviewed', 'contacted', 'shortlisted', 'rejected', 'hired'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All' : STATUS_COLORS[status]?.label || status}
                {status !== 'all' && <span className="ml-1 font-bold">({statsCounts[status]})</span>}
              </button>
            ))}
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <HiDocumentText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {applications.length === 0
                ? 'No applications yet for this job'
                : `No applications with status "${STATUS_COLORS[filterStatus]?.label || filterStatus}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <ApplicationCard
                key={app._id}
                application={app}
                onStatusChange={() => fetchApplications(selectedJob)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterApplications;
