import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { HiGlobe, HiRefresh, HiShieldCheck } from "react-icons/hi";

export default function SeoCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSeoHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/seo-command-dashboard");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoHealth();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiGlobe className="text-blue-600" /> SEO Command Center
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage search engine visibility and schema health.
          </p>
        </div>
        <button
          onClick={fetchSeoHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <HiRefresh className={loading ? "animate-spin" : ""} /> Refresh Scan
        </button>
      </div>

      {loading && !data ? (
        <div className="text-center py-12 text-gray-500">Scanning SEO Health...</div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className={`text-5xl font-bold mb-2 ${data.healthScore > 80 ? 'text-green-500' : data.healthScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {data.healthScore}
            </div>
            <div className="text-gray-600 font-medium">Overall SEO Health</div>
            <div className="text-xs text-gray-400 mt-1">Based on schema completeness</div>
          </div>
          
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">Profiles Missing Location</div>
              <div className="text-2xl font-semibold">{data.metrics?.missingLocation}</div>
              <div className="text-xs text-gray-400 mt-1">Out of {data.metrics?.totalProfiles}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">Jobs Missing Salary</div>
              <div className="text-2xl font-semibold">{data.metrics?.missingSalaryJobs}</div>
              <div className="text-xs text-gray-400 mt-1">Out of {data.metrics?.totalJobs} active jobs</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm mb-1">Orphan Profiles (0 Views)</div>
                <div className="text-2xl font-semibold">{data.metrics?.orphanProfiles}</div>
              </div>
              {data.metrics?.orphanProfiles > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Needs Attention
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
            <strong>How is the score calculated?</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Starts at <strong>100 points</strong>.</li>
              <li>Deducts up to <strong>30 points</strong> based on the percentage of profiles missing location data.</li>
              <li>Deducts up to <strong>30 points</strong> based on the percentage of active jobs missing salary data.</li>
              <li>Deducts up to <strong>40 points</strong> based on the percentage of orphan profiles (0 views).</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-red-500">Failed to load SEO data.</div>
      )}
    </div>
  );
}
