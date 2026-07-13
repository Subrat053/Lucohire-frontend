import { useState, useEffect } from 'react';
import { Settings, Save, Download, Globe, Clock, Loader2, Server } from 'lucide-react';
import { adminAPI } from '../../../services/api';

const NightlyEngineSettings = () => {
  const [settings, setSettings] = useState({ daily_scrape_limit: '300' });
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const resSettings = await adminAPI.getCrawlerSettings();
      if (resSettings && resSettings.data) {
        setSettings(resSettings.data);
      }
      
      const resCompanies = await adminAPI.getMappedCompanies({ limit: 10 });
      if (resCompanies && resCompanies.data) {
        setCompanies(resCompanies.data.companies || []);
        setStats({ total: resCompanies.data.pagination?.total || 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await adminAPI.updateCrawlerSettings({ daily_scrape_limit: settings.daily_scrape_limit });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadCsv = async () => {
    try {
      setSaveMessage('Downloading CSV...');
      const response = await adminAPI.exportCrawlerCompaniesCsv();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crawler_companies.csv');
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSaveMessage('CSV Downloaded!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('Failed to download CSV');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Nightly Engine Configuration
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configure limits for the BullMQ nightly crawler job.</p>
          </div>
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
              {saveMessage}
            </span>
          )}
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Scrape Limit (Companies per night)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Server className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={settings.daily_scrape_limit}
                onChange={(e) => setSettings({ ...settings, daily_scrape_limit: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2.5 border"
              />
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors md:w-auto w-full"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Mapped Companies Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              Mapped Career Pages
            </h2>
            <p className="text-sm text-gray-500 mt-1">Total {stats.total} companies actively managed by the Nightly Engine.</p>
          </div>
          <button
            onClick={downloadCsv}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Career URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Synced</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                    <div className="text-sm text-gray-500">{company.companyDomain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">
                    <a href={company.careerUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {company.careerUrl ? new URL(company.careerUrl).pathname : 'N/A'}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {company.lastSyncedAt ? new Date(company.lastSyncedAt).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                    No mapped companies yet. Upload some using the Bulk Mapping tab!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NightlyEngineSettings;
