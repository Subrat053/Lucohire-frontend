import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { HiCheck, HiX, HiClock, HiOutlineDocumentText } from 'react-icons/hi';

const CustomPlanRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCustomPlanRequests();
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load custom plan requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateCustomPlanRequestStatus(id, newStatus);
      toast.success('Status updated');
      setRequests(requests.map(req => req._id === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pending</span>;
      case 'contacted': return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Contacted</span>;
      case 'resolved': return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Resolved</span>;
      case 'closed': return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">Closed</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Custom Plan Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Manage enterprise and custom plan inquiries from recruiters.</p>
        </div>
        <button onClick={fetchRequests} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition shadow-sm">
          Refresh
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-black">
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Features Requested</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center">
                      <HiOutlineDocumentText className="w-12 h-12 text-slate-300 mb-3" />
                      <p>No custom plan requests found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{req.recruiterId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{req.recruiterId?.email}</div>
                      {req.recruiterId?.phone && <div className="text-xs text-slate-500">{req.recruiterId?.phone}</div>}
                      {req.company && <div className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-wider">{req.company} {req.designation ? `- ${req.designation}` : ''}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{req.durationMonths} Month{req.durationMonths > 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {req.selectedFeatures?.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                      {req.notes && (
                        <div className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                          "{req.notes}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                        className="text-xs font-bold border-slate-200 rounded-lg bg-white px-2 py-1 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomPlanRequests;
