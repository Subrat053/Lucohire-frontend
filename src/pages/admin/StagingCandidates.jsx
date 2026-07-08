import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiUserGroup, HiOutlineMail, HiOutlineChat, HiCheckCircle, HiSearch, HiDatabase, HiSave } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

export default function StagingCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('staged');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchCandidates();
    fetchSettings();
  }, [statusFilter, leadStatusFilter, pagination.page]);

  const fetchSettings = async () => {
    try {
      const { data } = await adminAPI.getSettings();
      const list = Array.isArray(data) ? data : data.settings || [];
      const vals = {};
      list.forEach(s => { vals[s._id] = s.value; if (s.key === 'apify_naukri_cookie') vals.apify_naukri_cookie = s.value; if (s.key === 'daily_scraper_limit') vals.daily_scraper_limit = s.value; });
      setEditValues(vals);
    } catch {
      toast.error('Failed to load settings');
    }
  };

  const handleSaveSetting = async (setting) => {
    try {
      await adminAPI.updateSettings({ settings: [{ key: setting.key, value: setting.value, description: setting.description, category: setting.category }] });
      toast.success(`${setting.key} updated`);
    } catch { toast.error('Failed to update'); }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getStagingCandidates({
        page: pagination.page,
        limit: 50,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        leadStatus: leadStatusFilter !== 'all' ? leadStatusFilter : undefined
      });
      setCandidates(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load staging candidates');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = async (id, type, currentValue) => {
    try {
      await adminAPI.updateStagingCandidateToggle(id, type, !currentValue);
      setCandidates(prev => prev.map(c => 
        c._id === id 
          ? { ...c, [type === 'email' ? 'emailToggle' : 'whatsappToggle']: !currentValue } 
          : c
      ));
      toast.success(`${type} toggle updated`);
    } catch (error) {
      toast.error(`Failed to update ${type} toggle`);
    }
  };

  return (
    <div className="py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiUserGroup className="w-6 h-6 text-indigo-500" />
            Staging Candidates Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review scraped candidates before morning outreach.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="staged">Staged (Pending Outreach)</option>
            <option value="outreach_sent">Outreach Sent</option>
            <option value="claimed">Claimed (Active User)</option>
          </select>
          <select
            value={leadStatusFilter}
            onChange={(e) => {
              setLeadStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Lead Tiers</option>
            <option value="Verified Active Candidate">Verified Active Candidate</option>
            <option value="Active Signal Lead">Active Signal Lead</option>
            <option value="Raw Lead">Raw Lead</option>
          </select>
        </div>
      </div>

      {/* Scraper Engine Config Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HiDatabase className="w-5 h-5 text-indigo-500" />
              Scraper Engine Configuration
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage Apify integration and automated scraping limits</p>
          </div>
          <button
            onClick={() => {
              const sCookie = editValues.apify_naukri_cookie || '';
              const sLimit = editValues.daily_scraper_limit || '500';
              handleSaveSetting({ key: 'apify_naukri_cookie', category: 'scraper', value: sCookie, description: 'Naukri Session Cookie' });
              handleSaveSetting({ key: 'daily_scraper_limit', category: 'scraper', value: sLimit, description: 'Daily max scrape limit' });
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <HiSave className="w-4 h-4" /> Save Config
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naukri Session Cookie</label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={editValues.apify_naukri_cookie || ''}
                  onChange={(e) => setEditValues({ ...editValues, apify_naukri_cookie: e.target.value })}
                  placeholder="Paste the full session cookie string here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This cookie is required for Apify to authenticate and scrape private candidate data securely.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Scraping Limit (Budget Control)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="10"
                  value={editValues.daily_scraper_limit || 500}
                  onChange={(e) => setEditValues({ ...editValues, daily_scraper_limit: e.target.value })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editValues.daily_scraper_limit || 500}
                    onChange={(e) => setEditValues({ ...editValues, daily_scraper_limit: e.target.value })}
                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm text-center font-bold"
                  />
                  <span className="text-sm text-gray-500 font-medium">profiles/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && candidates.length === 0 ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Query</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Email Toggle</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">WA Toggle</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outreach Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scraped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No candidates found matching criteria.
                    </td>
                  </tr>
                ) : (
                  candidates.map((cand) => (
                    <tr key={cand._id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{cand.name}</div>
                        <div className="text-xs text-gray-500">{cand.jobTitle}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{cand.email} • {cand.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {cand.sourceQuery}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleChannel(cand._id, 'email', cand.emailToggle)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            cand.emailToggle ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            cand.emailToggle ? 'translate-x-4.5' : 'translate-x-1'
                          }`} />
                        </button>
                        {cand.emailSentAt && <div className="text-[10px] text-green-600 mt-1">Sent</div>}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleChannel(cand._id, 'whatsapp', cand.whatsappToggle)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            cand.whatsappToggle ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            cand.whatsappToggle ? 'translate-x-4.5' : 'translate-x-1'
                          }`} />
                        </button>
                        {cand.whatsappSentAt && <div className="text-[10px] text-green-600 mt-1">Sent</div>}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cand.status === 'staged' ? 'bg-yellow-100 text-yellow-800' :
                          cand.status === 'outreach_sent' ? 'bg-blue-100 text-blue-800' :
                          cand.status === 'claimed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cand.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cand.leadStatus === 'Verified Active Candidate' ? 'bg-green-100 text-green-800' :
                          cand.leadStatus === 'Active Signal Lead' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cand.leadStatus || 'Raw Lead'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{cand.activeScore || 0}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (cand.activeScore || 0) >= 100 ? 'bg-green-500' :
                                (cand.activeScore || 0) >= 31 ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} 
                              style={{ width: `${Math.min(100, cand.activeScore || 0)}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(cand.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
