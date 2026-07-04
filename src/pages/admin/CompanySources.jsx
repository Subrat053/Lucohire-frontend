import { useState, useEffect } from 'react';
import { HiPlus, HiTrash, HiX, HiDownload, HiShieldCheck } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyCompany = {
  companyName: '',
  companyDomain: '',
  careerUrl: '',
  atsType: 'greenhouse',
  atsIdentifier: '',
  countryCode: 'US',
  status: 'active'
};

const CompanySources = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showDiscoverForm, setShowDiscoverForm] = useState(false);
  const [form, setForm] = useState({ ...emptyCompany });
  const [importText, setImportText] = useState('');
  const [discoverState, setDiscoverState] = useState({ atsType: 'greenhouse', countryCode: 'IN', keywords: '' });
  const [discovering, setDiscovering] = useState(false);
  const [filters, setFilters] = useState({ country: '', atsType: '', status: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    fetchCompanies();
  }, [filters]);

  const fetchCompanies = async () => {
    try {
      const { data } = await adminAPI.getCompanySources(filters);
      setCompanies(data.companies || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to load company sources');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async (e) => {
    e.preventDefault();
    try {
      setDiscovering(true);
      const { data } = await adminAPI.triggerDiscovery(discoverState);
      if (data.success) {
        toast.success(data.message || 'Discovery complete!');
        setShowDiscoverForm(false);
        fetchCompanies();
      } else {
        toast.error(data.message || 'Discovery failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discovery request failed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.companyDomain || !form.atsIdentifier) {
      toast.error('Name, Domain, and ATS Identifier are required');
      return;
    }
    try {
      await adminAPI.createCompanySource(form);
      toast.success('Company source created successfully');
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create company source');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company source? This will stop ATS sync for this company.')) return;
    try {
      await adminAPI.deleteCompanySource(id);
      toast.success('Company source deleted');
      fetchCompanies();
    } catch (err) {
      toast.error('Failed to delete company');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importText.trim()) {
      toast.error('Please input JSON array or CSV text');
      return;
    }

    try {
      let payload;
      try {
        // Try parsing JSON first
        payload = JSON.parse(importText);
      } catch (err) {
        // Treat as CSV
        payload = { csvString: importText };
      }

      const { data } = await adminAPI.importCompanySources(payload);
      toast.success(data.message || 'Import processed successfully!');
      setShowImportForm(false);
      setImportText('');
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ATS Company Discovery</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Discover and import hiring companies to ingest their active job board postings automatically.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowDiscoverForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition font-medium text-sm border border-indigo-200"
          >
            <HiShieldCheck className="w-5 h-5" /> Auto-Discover
          </button>
          <button
            onClick={() => { setShowImportForm(true); setImportText(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition font-medium text-sm border border-gray-200"
          >
            <HiDownload className="w-5 h-5" /> Bulk Import
          </button>
          <button
            onClick={() => { setForm({ ...emptyCompany }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm shadow-md"
          >
            <HiPlus className="w-5 h-5" /> Add Company
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 mb-6 text-sm">
        <input
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          placeholder="Search by company name or domain..."
          className="flex-1 min-w-[200px] px-3.5 py-2 border border-gray-200 rounded-xl outline-none"
        />
        <select
          value={filters.country}
          onChange={(e) => setFilters(f => ({ ...f, country: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700"
        >
          <option value="">All Countries</option>
          <option value="US">USA (US)</option>
          <option value="IN">India (IN)</option>
          <option value="GB">UK (GB)</option>
          <option value="CA">Canada (CA)</option>
          <option value="AE">UAE (AE)</option>
          <option value="AU">Australia (AU)</option>
        </select>
        <select
          value={filters.atsType}
          onChange={(e) => setFilters(f => ({ ...f, atsType: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700"
        >
          <option value="">All ATS Platforms</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="workable">Workable</option>
        </select>
      </div>

      {/* Listing Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {companies.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No companies found. Create or import company profiles to sync ATS jobs.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ATS Platform</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ATS Identifier</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs Synced</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hiring Level</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {companies.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{c.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium hover:underline">
                      <a href={`https://${c.companyDomain}`} target="_blank" rel="noreferrer">{c.companyDomain}</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-700">{c.atsType}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">{c.atsIdentifier}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">{c.countryCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{c.activeJobCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        c.hiringLevel === 'priority' 
                          ? 'bg-red-50 text-red-700' 
                          : c.hiringLevel === 'very_high' 
                            ? 'bg-orange-50 text-orange-700' 
                            : c.hiringLevel === 'high' 
                              ? 'bg-yellow-50 text-yellow-700' 
                              : 'bg-green-50 text-green-700'
                      }`}>
                        {c.hiringLevel || 'normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Discover Modal */}
      {showDiscoverForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Auto-Discover Companies</h2>
              <button onClick={() => setShowDiscoverForm(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"><HiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDiscover} className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">The system will autonomously crawl Google for active ATS boards and add valid companies to your database.</p>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target ATS Engine</label>
                <select
                  required
                  value={discoverState.atsType}
                  onChange={(e) => setDiscoverState({ ...discoverState, atsType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="greenhouse">Greenhouse</option>
                  <option value="lever">Lever</option>
                  <option value="ashby">Ashby</option>
                  <option value="smartrecruiters">SmartRecruiters</option>
                  <option value="workable">Workable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target Country</label>
                <select
                  required
                  value={discoverState.countryCode}
                  onChange={(e) => setDiscoverState({ ...discoverState, countryCode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="IN">India (IN)</option>
                  <option value="US">USA (US)</option>
                  <option value="GB">UK (GB)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="AE">UAE (AE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target Keywords (Optional)</label>
                <input
                  type="text"
                  value={discoverState.keywords}
                  onChange={(e) => setDiscoverState({ ...discoverState, keywords: e.target.value })}
                  placeholder="e.g. Software Engineer, React"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowDiscoverForm(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">
                  Cancel
                </button>
                <button disabled={discovering} type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50 flex items-center gap-2">
                  {discovering ? <LoadingSpinner size="sm" /> : <HiShieldCheck className="w-5 h-5" />}
                  {discovering ? 'Crawling...' : 'Run Discovery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Company Profile</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"><HiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company Name</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="e.g. Stripe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company Domain</label>
                <input
                  required
                  value={form.companyDomain}
                  onChange={(e) => setForm(f => ({ ...f, companyDomain: e.target.value }))}
                  placeholder="e.g. stripe.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ATS Platform</label>
                  <select
                    value={form.atsType}
                    onChange={(e) => setForm(f => ({ ...f, atsType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="greenhouse">Greenhouse</option>
                    <option value="lever">Lever</option>
                    <option value="ashby">Ashby</option>
                    <option value="workable">Workable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ATS Identifier (Slug)</label>
                  <input
                    required
                    value={form.atsIdentifier}
                    onChange={(e) => setForm(f => ({ ...f, atsIdentifier: e.target.value }))}
                    placeholder="e.g. stripe"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Country</label>
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm(f => ({ ...f, countryCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="US">USA (US)</option>
                    <option value="IN">India (IN)</option>
                    <option value="GB">UK (GB)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="AU">Australia (AU)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Career Page URL (Optional)</label>
                  <input
                    value={form.careerUrl}
                    onChange={(e) => setForm(f => ({ ...f, careerUrl: e.target.value }))}
                    placeholder="e.g. stripe.com/jobs"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-scale-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Bulk Import Hiring Companies</h2>
              <button onClick={() => setShowImportForm(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"><HiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Paste CSV String or JSON Array</label>
                <textarea
                  required
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`CSV Format:\ncompanyName,companyDomain,atsType,atsIdentifier,countryCode\nStripe,stripe.com,greenhouse,stripe,US\n\nOr JSON:\n[\n  {"companyName": "Stripe", "companyDomain": "stripe.com", "atsType": "greenhouse", "atsIdentifier": "stripe", "countryCode": "US"}\n]`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-xs font-mono focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowImportForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md"
                >
                  Parse & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySources;
