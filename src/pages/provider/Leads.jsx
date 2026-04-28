import { useState, useEffect } from 'react';
import { HiPhone, HiMail, HiBriefcase, HiCheck, HiX as HiXIcon } from 'react-icons/hi';
import { providerAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProviderLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      const { data } = await providerAPI.getLeads();
      setLeads(data);
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await providerAPI.updateLead(id, { status });
      setLeads(leads.map(l => l._id === id ? { ...l, status } : l));
      toast.success(`Lead marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const statusColors = {
    new: 'bg-green-100 text-green-700',
    viewed: 'bg-blue-100 text-blue-700',
    contacted: 'bg-purple-100 text-purple-700',
    hired: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Leads ({leads.length})</h1>

      {leads.length > 0 ? (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{lead.recruiter?.name || 'Unknown Recruiter'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || ''}`}>{lead.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{lead.type?.replace(/_/g, ' ')}</p>
                  {lead.jobPost && (
                    <div className="flex items-center space-x-1 mt-1 text-sm text-indigo-600">
                      <HiBriefcase className="w-4 h-4" />
                      <span>{lead.jobPost.title} - {lead.jobPost.city}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {lead.isUnlocked && lead.recruiter?.phone && (
                    <a href={`tel:${lead.recruiter.phone}`} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                      <HiPhone className="w-5 h-5" />
                    </a>
                  )}
                  {lead.isUnlocked && lead.recruiter?.email && (
                    <a href={`mailto:${lead.recruiter.email}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                      <HiMail className="w-5 h-5" />
                    </a>
                  )}
                  {lead.status === 'new' && (
                    <>
                      <button onClick={() => updateStatus(lead._id, 'contacted')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Mark Contacted">
                        <HiCheck className="w-5 h-5" />
                      </button>
                      <button onClick={() => updateStatus(lead._id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject">
                        <HiXIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <HiBriefcase className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No leads yet</h3>
          <p className="text-gray-500">Complete your profile and upgrade your plan to receive leads.</p>
        </div>
      )}
    </div>
  );
};

export default ProviderLeads;
