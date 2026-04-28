import { useState, useEffect } from 'react';
import {
  HiPhone, HiMail, HiLocationMarker, HiStar,
  HiCheckCircle, HiEye, HiArrowRight, HiDocumentText,
} from 'react-icons/hi';
import { jobsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';

const STATUS_BADGES = {
  pending:     { bg: 'bg-yellow-50',    text: 'text-yellow-700',    label: 'Pending Review' },
  reviewed:    { bg: 'bg-blue-50',     text: 'text-blue-700',     label: 'Reviewed' },
  contacted:   { bg: 'bg-purple-50',   text: 'text-purple-700',   label: '✓ Contacted You!' },
  shortlisted:{ bg: 'bg-indigo-50',    text: 'text-indigo-700',   label: 'Shortlisted' },
  rejected:    { bg: 'bg-red-50',      text: 'text-red-700',      label: 'Not Selected' },
  hired:       { bg: 'bg-green-50',    text: 'text-green-700',    label: '✓✓ Hired!' },
};

const ContactedCard = ({ application }) => {
  const { formatPrice } = useLocale();
  const recruiter = application.jobPost?.recruiter;
  const job = application.jobPost;
  const badge = STATUS_BADGES[application.status] || STATUS_BADGES.pending;
  const isContacted = application.status === 'contacted' || application.status === 'hired' || application.status === 'shortlisted';

  return (
    <div className={`relative rounded-2xl border-2 overflow-hidden transition ${
      isContacted
        ? 'bg-purple-50/50 border-purple-300 shadow-lg shadow-purple-100'
        : 'bg-white border-gray-100 hover:shadow-md'
    }`}>
      {isContacted && (
        <div className="absolute top-0 right-0 bg-linear-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-bl-xl text-xs font-bold">
          💬 CONTACTED
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Recruiter Info */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{recruiter?.name || 'Recruiter'}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {job?.title}{job?.city && ` • ${job.city}`}
            </p>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        {/* Job Details */}
        <div className="bg-white/50 rounded-xl p-4 space-y-2 border border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <HiDocumentText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700"><span className="font-medium">Skill:</span> {job?.skill}</span>
          </div>
          {job?.budgetMin && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-bold">{formatPrice(job.budgetMin)}</span>
              {job?.budgetMax && <span className="text-gray-500">– {formatPrice(job.budgetMax)}</span>}
            </div>
          )}
          {job?.description && (
            <p className="text-sm text-gray-600 mt-2">{job.description}</p>
          )}
        </div>

        {/* Contact & Timeline */}
        <div className="grid sm:grid-cols-2 gap-3">
          {recruiter?.email && (
            <a href={`mailto:${recruiter.email}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
            >
              <HiMail className="w-4 h-4" /> Email
            </a>
          )}
          {recruiter?.phone && (
            <a href={`tel:${recruiter.phone}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition text-sm font-medium border border-green-200"
            >
              <HiPhone className="w-4 h-4" /> Call
            </a>
          )}
        </div>

        {/* Timeline */}
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
          Applied {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
          {isContacted && (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
              <span className="text-purple-600 font-medium">Contacted recently</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ProviderContacted = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'contacted', 'accepted'

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await jobsAPI.getMyApplications();
      setApplications(data?.applications || []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const contactedApps = applications.filter(a => a.status === 'contacted' || a.status === 'shortlisted' || a.status === 'hired');
  const acceptedApps = applications.filter(a => a.status === 'hired');

  const filteredApps = filterType === 'all'
    ? applications
    : filterType === 'contacted'
    ? contactedApps
    : acceptedApps;

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-100 via-blue-200 to-blue-500 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Recruiter <span className="drop-shadow-lg">Messages</span>
          </h1>
          <p className="text-blue-100 text-sm">See who has reached out to you about your applications</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 text-center shadow-sm border border-white/60">
            <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
            <p className="text-xs text-gray-600 mt-1">Total Applications</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 text-center shadow-sm border border-white/60">
            <p className="text-3xl font-bold text-purple-600">{contactedApps.length}</p>
            <p className="text-xs text-gray-600 mt-1">Recruiters Contacted</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 text-center shadow-sm border border-white/60">
            <p className="text-3xl font-bold text-green-600">{acceptedApps.length}</p>
            <p className="text-xs text-gray-600 mt-1">Jobs Accepted</p>
          </div>
        </div>

        {/* Filter Tabs */}
        {applications.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 mb-6 flex gap-2 border border-white/60">
            {[
              { id: 'all', label: 'All' },
              { id: 'contacted', label: '💬 Contacted' },
              { id: 'accepted', label: '✓ Accepted' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-4 py-2 rounded-xl transition text-sm font-medium ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/60 shadow-sm">
            <HiDocumentText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-1">
              {applications.length === 0
                ? 'No applications yet. Start browsing jobs!'
                : `No applications in "${filterType === 'contacted' ? 'Contacted' : 'Accepted'}" category`}
            </p>
            <p className="text-sm text-gray-500">
              {filterType === 'contacted' && 'Recruiters will contact you here once they review your applications.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map(app => (
              <ContactedCard key={app._id} application={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderContacted;
