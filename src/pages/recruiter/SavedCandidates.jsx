import { useEffect, useState } from 'react';
import { recruiterAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiUser, HiBriefcase, HiLocationMarker, HiTrash, HiExternalLink,
    HiPhone, HiMail, HiSearch, HiX, HiStar, HiShieldCheck,
} from 'react-icons/hi';

// Normalize data from the Lead->provider populated user
const normalizeSaved = (lead) => {
    const provider = lead.provider || {};
    return {
        leadId: lead._id,
        providerId: lead.provider?._id, 
        providerProfileId: lead.providerProfileId || lead.provider?._id,
        name: provider.name || 'Candidate',
        email: provider.email || '',
        phone: provider.phone || '',
        avatar: provider.profilePhoto || provider.avatar || '',
        savedAt: lead.createdAt,
        source: lead.metadata?.source || 'ai_smart_search',
        experience: lead.experience || 'N/A',
        location: lead.location || 'Unknown',
        isSaved: true
    };
};

export default function SavedCandidates() {
    const navigate = useNavigate();
    const [saved, setSaved] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingIds, setRemovingIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [viewingCandidate, setViewingCandidate] = useState(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const formatLocation = (loc) => {
        if (!loc) return "Unknown";
        if (typeof loc === 'string') return loc;
        if (typeof loc === 'object') {
            return loc.formattedAddress || loc.name || [loc.city, loc.state].filter(Boolean).join(', ') || "Unknown";
        }
        return "Unknown";
    };

    const fetchSaved = async () => {
        try {
            setLoading(true);
            const { data } = await recruiterAPI.getSavedCandidates();
            const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
            setSaved(candidates.map(normalizeSaved));
        } catch (err) {
            toast.error('Failed to load saved candidates.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (candidate) => {
        const id = candidate.leadId;
        setRemovingIds((prev) => new Set(prev).add(id));
        try {
            await recruiterAPI.removeSavedCandidate(candidate.providerProfileId || id);
            setSaved((prev) => prev.filter((c) => c.leadId !== id));
            toast.success('Candidate removed from saved list.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove candidate.');
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleViewProfile = async (candidate) => {
        try {
            // providerProfileId is needed for the API
            const profileId = candidate.providerProfileId || candidate.providerId;
            setViewingCandidate({ ...candidate, loading: true });
            setIsProfileModalOpen(true);
            
            const { data } = await recruiterAPI.viewProvider(profileId);
            setViewingCandidate({
                ...candidate,
                ...data.provider,
                contactInfo: data.contactInfo,
                isUnlocked: data.isUnlocked,
                reviews: data.reviews,
                loading: false
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load candidate profile");
            setIsProfileModalOpen(false);
        }
    };

    const handleUnlockContact = async (candidateId) => {
        try {
            setIsUnlocking(true);
            const { data } = await recruiterAPI.unlockContact(candidateId);
            
            if (data.contact) {
                setViewingCandidate(prev => ({
                    ...prev,
                    contactInfo: data.contact,
                    isUnlocked: true
                }));
                toast.success("Contact unlocked successfully!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unlock contact");
        } finally {
            setIsUnlocking(false);
        }
    };

    useEffect(() => {
        fetchSaved();
    }, []);

    const filtered = saved.filter((c) =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-5 bg-[#F8FAFF] min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#081B3A]">Saved Candidates</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? 'Loading…' : `${saved.length} candidate${saved.length !== 1 ? 's' : ''} saved`}
                    </p>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-xl border border-[#E5EAF3] bg-white px-3 py-2 w-full sm:w-64">
                    <HiSearch className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="rounded-2xl border border-[#E5EAF3] bg-white p-10 text-center text-sm text-gray-400">
                    Loading saved candidates…
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-[#E5EAF3] bg-white p-10 text-center">
                    <HiUser className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                    <p className="font-semibold text-[#081B3A]">
                        {searchQuery ? 'No results match your search.' : 'No saved candidates yet.'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        {!searchQuery && 'Use AI Smart Search on the Job Postings page to find and save candidates.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => navigate('/recruiter/job-postings')}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white"
                        >
                            <HiSearch className="h-4 w-4" />
                            Start AI Search
                        </button>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-[#E5EAF3] bg-white overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1.5fr_1fr] items-center gap-2 border-b border-[#E5EAF3] px-4 py-3 text-xs font-bold uppercase text-gray-400 tracking-wide">
                        <span>Candidate</span>
                        <span className="hidden sm:block">Saved On</span>
                        <span className="text-right">Actions</span>
                    </div>

                    {filtered.map((candidate) => (
                        <div
                            key={candidate.leadId}
                            className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1.5fr_1fr] items-center gap-2 border-b border-[#F0F2F7] px-4 py-3 last:border-0 hover:bg-[#F7F9FF] transition"
                        >
                            {/* Candidate Info */}
                            <div className="flex items-center gap-3 min-w-0">
                                {candidate.avatar ? (
                                    <img
                                        src={candidate.avatar}
                                        alt={candidate.name}
                                        className="h-10 w-10 rounded-full object-cover border border-[#E5EAF3] shrink-0"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                                        {candidate.name?.[0] || 'C'}
                                    </div>
                                )}
                                <div 
                                    className="min-w-0 cursor-pointer group"
                                    onClick={() => handleViewProfile(candidate)}
                                >
                                    <p className="font-semibold text-[#081B3A] group-hover:text-[#0066FF] transition-colors truncate">{candidate.name}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                        {candidate.email && (
                                            <a
                                                href={`mailto:${candidate.email}`}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0066FF] transition truncate"
                                            >
                                                <HiMail className="h-3 w-3 shrink-0" />
                                                {candidate.email}
                                            </a>
                                        )}
                                        {candidate.phone && (
                                            <a
                                                href={`tel:${candidate.phone}`}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0066FF] transition"
                                            >
                                                <HiPhone className="h-3 w-3 shrink-0" />
                                                {candidate.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Saved On */}
                            <span className="hidden sm:block text-xs text-gray-400">
                                {candidate.savedAt
                                    ? new Date(candidate.savedAt).toLocaleDateString()
                                    : '—'}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleRemove(candidate)}
                                    disabled={removingIds.has(candidate.leadId)}
                                    title="Remove from saved"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                                >
                                    {removingIds.has(candidate.leadId) ? (
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                                    ) : (
                                        <HiTrash className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Candidate Profile Modal */}
            {isProfileModalOpen && viewingCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <h3 className="text-xl font-bold text-[#081B3A]">Candidate Profile</h3>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <HiX className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
                            {viewingCandidate.loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent"></div>
                                    <p className="mt-4 text-gray-500">Loading profile details...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Profile Summary */}
                                    <div className="flex items-start gap-6">
                                        <div className="h-24 w-24 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700 shadow-inner shrink-0">
                                            {viewingCandidate.profilePhoto ? (
                                                <img src={viewingCandidate.profilePhoto} alt="" className="h-full w-full rounded-2xl object-cover" />
                                            ) : (
                                                viewingCandidate.name?.[0] || "C"
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-2xl font-bold text-[#081B3A] truncate">{viewingCandidate.name}</h4>
                                                {viewingCandidate.isVerified && (
                                                    <HiShieldCheck className="h-6 w-6 text-blue-500" title="Verified Provider" />
                                                )}
                                            </div>
                                            <p className="text-lg text-gray-600 mt-1">{viewingCandidate.role || viewingCandidate.title}</p>
                                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                    <HiBriefcase className="h-4 w-4 text-gray-400" />
                                                    {viewingCandidate.experience} Experience
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                    <HiLocationMarker className="h-4 w-4 text-gray-400" />
                                                    {formatLocation(viewingCandidate.location)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Section */}
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
                                        <h5 className="font-bold text-[#081B3A] mb-4 flex items-center gap-2">
                                            Contact Information
                                        </h5>
                                        {viewingCandidate.isUnlocked || (viewingCandidate.phone && viewingCandidate.email) ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                        <HiPhone className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Phone</p>
                                                        <p className="font-semibold text-gray-700">{viewingCandidate.phone || viewingCandidate.contactInfo?.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                        <HiMail className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Email</p>
                                                        <p className="font-semibold text-gray-700">{viewingCandidate.email || viewingCandidate.contactInfo?.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-gray-600 mb-4">Contact details are locked. Use your plan credits to unlock.</p>
                                                <button
                                                    onClick={() => handleUnlockContact(viewingCandidate.providerProfileId || viewingCandidate.providerId)}
                                                    disabled={isUnlocking}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
                                                >
                                                    {isUnlocking ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    ) : (
                                                        "Unlock Contact Details"
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* About / Skills */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h5 className="font-bold text-[#081B3A] mb-3">About Candidate</h5>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                {viewingCandidate.shortBio || viewingCandidate.description || "No bio provided by candidate."}
                                            </p>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-[#081B3A] mb-3">Core Skills</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingCandidate.skills?.map((skill, idx) => (
                                                    <span key={idx} className="rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {(!viewingCandidate.skills || viewingCandidate.skills.length === 0) && (
                                                    <p className="text-sm text-gray-400 italic">No skills listed.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 bg-gray-50 p-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}