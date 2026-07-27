import React, { useEffect, useState } from "react";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";

export default function SeoCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [trackingId, setTrackingId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSeoHealth = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSeoHealthDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load SEO configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoHealth();
  }, []);

  const openModal = (integration) => {
    setSelectedIntegration(integration);
    setTrackingId("");
    setIsModalOpen(true);
  };

  const handleSaveIntegration = async () => {
    if (!trackingId.trim()) return toast.error("Please enter a valid tracking ID or key.");
    try {
      setSaving(true);
      const res = await adminAPI.updateSeoIntegration(selectedIntegration.id, { trackingId });
      if (res.data.success) {
        toast.success("Integration updated successfully");
        setIsModalOpen(false);
        fetchSeoHealth();
      }
    } catch (err) {
      toast.error("Failed to update integration");
    } finally {
      setSaving(false);
    }
  };

  const { healthScore, integrations = [], webVitals, alerts = [], recommendations = [], metrics } = data || {};

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-gray-900 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SEO Intelligence & Monitoring Command Center</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Unified dashboard for external search engine webmaster tools, technical SEO health, Core Web Vitals, and indexing monitoring.
          </p>
        </div>
        <button
          onClick={fetchSeoHealth}
          disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Scanning..." : "Run Diagnostic Scan"}
        </button>
      </div>

      {loading && !data ? (
        <div className="text-gray-500 text-sm animate-pulse">Running full SEO diagnostic scan...</div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Unified Dashboard (Integrations) */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Unified Search Engine Integrations</h2>
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Platform</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {integrations.map((integration) => (
                      <tr key={integration.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{integration.name}</td>
                        <td className="px-4 py-3">
                          {integration.status === "not_configured" ? (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Not Configured</span>
                          ) : (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">{integration.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => openModal(integration)}
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            Configure
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Core Web Vitals Tracking */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Core Web Vitals Tracking</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(webVitals || {}).map(([key, vital]) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-sm p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{key}</div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-xs text-gray-400">Field Data</div>
                        <div className="text-lg font-semibold text-gray-900">{vital.field}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Lab Data</div>
                        <div className="text-sm font-medium text-gray-700">{vital.lab}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${vital.status === 'good' ? 'text-green-600' : 'text-amber-600'}`}>
                      {vital.status.replace("_", " ")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* AI Recommendation Engine */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">AI Recommendation Engine</h2>
              <div className="bg-white border border-gray-200 rounded-sm p-5 space-y-3">
                {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3 text-sm text-gray-700 items-start">
                    <span className="text-indigo-500 font-bold mt-0.5">→</span>
                    <p>{rec}</p>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No new recommendations at this time.</p>
                )}
              </div>
            </section>

          </div>
          
          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            
            {/* Technical SEO Health Score */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Technical & Schema Health</h2>
              <div className="bg-white border border-gray-200 rounded-sm p-6 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">SEO Health Score</div>
                <div className={`text-6xl font-black mb-2 ${healthScore >= 80 ? 'text-green-600' : healthScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {healthScore}
                </div>
                <div className="text-xs text-gray-400 mb-6">Weighted score (0-100) based on schema and indexing integrity.</div>
                
                <div className="space-y-3 text-left">
                  <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Missing Profile Locations</span>
                    <span className="font-semibold">{metrics?.missingLocation}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Jobs Missing Salary</span>
                    <span className="font-semibold">{metrics?.missingSalaryJobs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Orphan Profiles (0 Views)</span>
                    <span className="font-semibold text-red-600">{metrics?.orphanProfiles}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Alert Center */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Alert Center</h2>
              <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
                {alerts.length > 0 ? alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-sm text-sm border-l-2 ${alert.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-amber-50 border-amber-500 text-amber-800'}`}>
                    <span className="font-bold uppercase text-[10px] tracking-wider block mb-1 opacity-70">{alert.type}</span>
                    {alert.message}
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No critical alerts detected.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      ) : (
        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-sm border border-red-200">
          Failed to load SEO diagnostic data. Ensure the backend is running.
        </div>
      )}

      {/* Configuration Modal */}
      {isModalOpen && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Configure {selectedIntegration.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the tracking ID, Measurement ID, or API Key provided by the platform.</p>
            
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. G-XXXXXXX or 123456789"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveIntegration}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
