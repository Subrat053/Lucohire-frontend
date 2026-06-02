import React, { useEffect, useState } from 'react';
import SafeExternalLink from '../common/SafeExternalLink';
import { toAbsoluteMediaUrl } from '../../utils/media';
import { X } from 'lucide-react';

const PortfolioApprovalPanel = ({ adminAPI }) => {
  const [pendingLinks, setPendingLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeResumeUrl, setActiveResumeUrl] = useState(null);
  const [error, setError] = useState('');
  const [actioningLinkId, setActioningLinkId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedLink, setSelectedLink] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPendingLinks = async () => {
    try {
      setLoading(true);
      setError('');
      // Calls adminAPI wrapper method
      const { data } = await adminAPI.getPortfolioApprovals({ page, limit: 10 });
      setPendingLinks(data.pendingLinks || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching pending portfolio links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLinks();
  }, [page]);

  const handleApprove = async (profileId, linkId) => {
    try {
      setActioningLinkId(linkId);
      // Calls adminAPI wrapper method
      await adminAPI.approvePortfolioLink(profileId, linkId);
      
      // Update in-memory state
      setPendingLinks(prev => prev.filter(l => l.linkId !== linkId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving portfolio link.');
    } finally {
      setActioningLinkId(null);
    }
  };

  const handleOpenRejectModal = (link) => {
    setSelectedLink(link);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }

    try {
      setActioningLinkId(selectedLink.linkId);
      setShowRejectModal(false);
      
      // Calls adminAPI wrapper method
      await adminAPI.rejectPortfolioLink(selectedLink.profileId, selectedLink.linkId, rejectionReason.trim());

      // Update in-memory state
      setPendingLinks(prev => prev.filter(l => l.linkId !== selectedLink.linkId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting portfolio link.');
    } finally {
      setActioningLinkId(null);
      setSelectedLink(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Portfolio Link Moderation</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Review and moderate user-submitted website and social links before they go live on public profiles.
          </p>
        </div>
        <button
          onClick={fetchPendingLinks}
          className="text-xs font-bold text-violet-600 hover:text-white hover:bg-violet-600 border border-violet-100 px-4 py-2 rounded-xl transition-all self-start"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-4 py-3 rounded-2xl animate-fade-in">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : pendingLinks.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User / Profile</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Link</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved URL (Current)</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted At</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pendingLinks.map((link) => (
                <tr key={link.linkId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{link.userName}</p>
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      {link.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                      {link.platform}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <SafeExternalLink
                      href={link.url}
                      className="text-violet-600 hover:text-violet-800 font-semibold truncate block hover:underline"
                    >
                      {link.url}
                    </SafeExternalLink>
                  </td>
                  <td className="p-4 max-w-xs">
                    {link.currentApprovedUrl ? (
                      <SafeExternalLink
                        href={link.currentApprovedUrl}
                        className="text-slate-400 hover:text-slate-600 font-semibold truncate block hover:underline"
                      >
                        {link.currentApprovedUrl}
                      </SafeExternalLink>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">None</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 font-semibold">
                    {new Date(link.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-1 whitespace-nowrap">
                    {link.resumeUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveResumeUrl(toAbsoluteMediaUrl(link.resumeUrl))}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors inline-block text-center hover:scale-102"
                      >
                        View Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleApprove(link.profileId, link.linkId)}
                      disabled={actioningLinkId === link.linkId}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors hover:scale-102"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(link)}
                      disabled={actioningLinkId === link.linkId}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors hover:scale-102"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-400 font-semibold text-xs italic">No pending portfolio links for moderation.</p>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-500 font-bold">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Rejection reason modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl space-y-4 animate-scale-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Reject Portfolio Link</h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide a brief explanation for the user on why this link is being rejected.
              </p>
            </div>
            
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Broken URL link, dangerous platform redirects, or inappropriate personal content..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-violet-500 focus:outline-hidden transition-colors"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl transition-colors hover:scale-102"
              >
                Reject Link
              </button>
            </div>
          </div>
        </div>
      )}
      {activeResumeUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between animate-fadeIn">
              <h3 className="font-bold text-slate-800 text-sm">Resume Document Viewer</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveResumeUrl(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="flex-1 bg-slate-100 p-4">
              {activeResumeUrl.endsWith('.pdf') || activeResumeUrl.includes('/raw/') || activeResumeUrl.includes('.pdf') || activeResumeUrl.includes('cloudinary.com') ? (
                <iframe
                  src={`${activeResumeUrl.includes('cloudinary.com') && !activeResumeUrl.toLowerCase().endsWith('.pdf') ? activeResumeUrl + '.pdf' : activeResumeUrl}#toolbar=0`}
                  title="Resume Viewer"
                  className="w-full h-full rounded-2xl border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-2xl p-6 text-center space-y-4">
                  <span className="text-4xl">📄</span>
                  <p className="text-sm font-semibold text-slate-600 font-sans">Document format view is not supported directly in the browser.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioApprovalPanel;
