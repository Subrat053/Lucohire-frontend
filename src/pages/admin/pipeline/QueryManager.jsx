import React, { useEffect, useState } from 'react';
import { pipelineAdminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const QueryManager = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuery, setNewQuery] = useState({ query: '', location: '', countryCode: 'IN' });

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await pipelineAdminAPI.getQueries();
      if (res.data?.success) {
        setQueries(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuery = async (e) => {
    e.preventDefault();
    try {
      // Simplification: In a real app we need the countryId, here we assume it's passed or handled by the backend
      // But we will just pass the strings for now.
      await pipelineAdminAPI.addQuery({ ...newQuery, sourceType: 'manual' });
      toast.success('Query added!');
      setNewQuery({ query: '', location: '', countryCode: 'IN' });
      fetchQueries();
    } catch (error) {
      toast.error('Failed to add query');
    }
  };

  const handleTriggerManualScan = async (queryObj) => {
    try {
      await pipelineAdminAPI.triggerManualScan({
        countryCode: queryObj.countryCode || 'IN',
        query: queryObj.query,
        location: queryObj.location
      });
      toast.success(`Manual scan triggered for "${queryObj.query}"`);
    } catch (error) {
      toast.error('Failed to trigger scan');
    }
  };

  if (loading) return <div className="text-gray-500">Loading queries...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Query Manager</h2>
      <p className="text-sm text-gray-500 mb-6">Manage fixed seed queries and trigger manual scans.</p>

      <form onSubmit={handleAddQuery} className="mb-8 bg-gray-50 p-4 rounded-lg flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
          <input type="text" required value={newQuery.query} onChange={e => setNewQuery({...newQuery, query: e.target.value})} className="border border-gray-300 rounded px-3 py-2 w-64" placeholder="e.g. React Developer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" value={newQuery.location} onChange={e => setNewQuery({...newQuery, location: e.target.value})} className="border border-gray-300 rounded px-3 py-2 w-48" placeholder="e.g. Remote, Delhi" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">Add Query</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Query</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.map((q, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.query}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.location || 'Any'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onClick={() => handleTriggerManualScan(q)} className="text-blue-600 hover:text-blue-900 font-medium">Trigger Scan</button>
                </td>
              </tr>
            ))}
            {queries.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No queries found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueryManager;
