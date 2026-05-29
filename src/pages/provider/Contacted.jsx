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
  pending:     { bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', label: 'Pending Review' },
  reviewed:    { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',       label: 'Reviewed' },
  contacted:   { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',   label: '✓ Contacted You!' },
  shortlisted:{ bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', label: 'Shortlisted' },
  rejected:    { bg: 'bg-red-500/10 border-red-500/30 text-red-400',          label: 'Not Selected' },
  hired:       { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: '✓✓ Hired!' },
};

const ContactedCard = ({ application }) => {
  const { formatPrice } = useLocale();
  const recruiter = application.jobPost?.recruiter;
  const job = application.jobPost;
  const badge = STATUS_BADGES[application.status] || STATUS_BADGES.pending;
  const isContacted = application.status === 'contacted' || application.status === 'hired' || application.status === 'shortlisted';

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
      isContacted
        ? 'bg-slate-900/80 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
    }`}>
      {isContacted && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider">
          💬 Contacted
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Recruiter Info */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">{recruiter?.name || 'Recruiter'}</h3>
            <p className="text-sm text-slate-400 mt-1 font-semibold">
              {job?.title}{job?.city && ` • ${job.city}`}
            </p>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Job Details */}
        <div className="bg-slate-950/40 rounded-xl p-4 space-y-2.5 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <HiDocumentText className="w-4 h-4 text-slate-500" />
            <span><span className="text-slate-500 uppercase tracking-wider text-[10px]">Skill Required:</span> {job?.skill}</span>
          </div>
          {job?.budgetMin && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-emerald-400 font-extrabold">{formatPrice(job.budgetMin)}</span>
              {job?.budgetMax && <span className="text-slate-500">– {formatPrice(job.budgetMax)}</span>}
            </div>
          )}
          {job?.description && (
            <p className="text-xs text-slate-400 leading-relaxed font-medium">{job.description}</p>
          )}
        </div>

        {/* Contact & Actions */}
        <div className="grid sm:grid-cols-2 gap-3">
          {recruiter?.email && (
            <a href={`mailto:${recruiter.email}`}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-all text-xs font-bold border border-blue-500/30"
            >
              <HiMail className="w-4 h-4" /> Send Email
            </a>
          )}
          {recruiter?.phone && (
            <a href={`tel:${recruiter.phone}`}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition-all text-xs font-bold border border-emerald-500/30"
            >
              <HiPhone className="w-4 h-4" /> Place Call
            </a>
          )}
        </div>

        {/* Timeline */}
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-700" />
          Applied {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
          {isContacted && (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/50" />
              <span className="text-amber-400">Contacted recently</span>
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
  const [filterType, setFilterType] = useState('all');

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
    <div className="min-h-screen bg-linear-to-b from-[#030d22] via-[#051636] to-[#0A224D] py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Recruiter <span className="text-blue-400 drop-shadow-md">Messages</span>
          </h1>
          <p className="text-slate-400 text-sm">See who has reached out to you about your applications</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 text-center shadow-md border border-slate-800">
            <p className="text-3xl font-black text-blue-400">{applications.length}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Total Applications</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 text-center shadow-md border border-slate-800">
            <p className="text-3xl font-black text-amber-400">{contactedApps.length}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Recruiters Contacted</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 text-center shadow-md border border-slate-800">
            <p className="text-3xl font-black text-emerald-400">{acceptedApps.length}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Jobs Accepted</p>
          </div>
        </div>

        {/* Filter Tabs */}
        {applications.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-2 mb-6 flex gap-2 border border-slate-800">
            {[
              { id: 'all', label: 'All' },
              { id: 'contacted', label: '💬 Contacted' },
              { id: 'accepted', label: '✓ Accepted' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-4 py-2.5 rounded-xl transition text-xs font-extrabold uppercase tracking-wider ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-md border-0'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
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
          <div className="bg-slate-900/40 backdrop-blur-xs rounded-2xl p-16 text-center border border-slate-800 shadow-md">
            <HiDocumentText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-300 font-bold mb-1 text-sm uppercase tracking-wider">
              {applications.length === 0
                ? 'No applications yet. Start browsing jobs!'
                : `No applications in "${filterType === 'contacted' ? 'Contacted' : 'Accepted'}" category`}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
