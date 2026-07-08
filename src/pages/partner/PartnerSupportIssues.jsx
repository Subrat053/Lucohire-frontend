import React, { useState, useEffect } from 'react';
import { supportAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiCheckCircle, HiClock, HiLockOpen, HiX } from 'react-icons/hi';
import ProfileUnlocker from '../admin/ProfileUnlocker';

const PartnerSupportIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await supportAPI.getManagerTickets();
      setIssues(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load support issues');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await supportAPI.resolveManagerTicket(id);
      toast.success('Issue marked as resolved');
      fetchIssues(); // Refresh list
    } catch (error) {
      toast.error('Failed to resolve issue');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading issues...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Issues (Profile & Job)</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user issues assigned to the Manager panel.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {issues.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No issues found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {issues.map(issue => (
              <div key={issue._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md ${
                      issue.type === 'profile' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {issue.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(issue.createdAt).toLocaleString()}
                    </span>
                    {issue.status === 'open' ? (
                      <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <HiClock className="w-3 h-3 mr-1" /> Open
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <HiCheckCircle className="w-3 h-3 mr-1" /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {issue.user ? `${issue.user.name} (${issue.user.email})` : 'Unknown User'}
                  </p>
                  <p className="text-gray-600 text-sm">{issue.message}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {issue.status === 'open' && issue.user && (
                    <button
                      onClick={() => {
                        setSelectedUserEmail(issue.user.email);
                        setUnlockModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium rounded-lg transition-colors text-sm border border-purple-100"
                    >
                      <HiLockOpen className="w-4 h-4" /> Send OTP / Unlock
                    </button>
                  )}
                  {issue.status === 'open' && (
                    <button
                      onClick={() => handleResolve(issue._id)}
                      disabled={resolvingId === issue._id}
                      className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 border border-indigo-100"
                    >
                      {resolvingId === issue._id ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unlocker Modal */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => {
                setUnlockModalOpen(false);
                setSelectedUserEmail('');
              }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <HiX className="w-5 h-5" />
            </button>
            <div className="pt-2">
              <ProfileUnlocker restrictionType="manager_support" initialEmail={selectedUserEmail} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSupportIssues;
