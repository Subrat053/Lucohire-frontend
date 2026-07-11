import React, { useState } from 'react';
import { FiPlus, FiDownload, FiFileText, FiTrash2, FiEdit2, FiClock } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

export default function CustomReportsPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState(['hires', 'funnel', 'sources']);
  const [reportName, setReportName] = useState('');
  const [format, setFormat] = useState('PDF');
  const [showBuilder, setShowBuilder] = useState(false);

  React.useEffect(() => {
    import('../../services/api').then(({ recruiterAPI }) => {
      recruiterAPI.getCustomExportsData()
        .then(res => setData(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading || !data) return <div className="p-12 text-center text-gray-500 font-bold">Loading reports...</div>;

  const { savedReports, templates } = data;
  const metrics = [
    { id: 'hires',       label: 'Total Hires'          },
    { id: 'funnel',      label: 'Hiring Funnel'         },
    { id: 'sources',     label: 'Source Performance'    },
    { id: 'time',        label: 'Time to Hire'          },
    { id: 'cost',        label: 'Cost per Hire'         },
    { id: 'outreach',    label: 'Outreach Analytics'    },
    { id: 'interviews',  label: 'Interview Analytics'   },
    { id: 'ai',          label: 'AI Insights & Trends'  },
  ];



  const toggleMetric = (id) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Custom Report Builder</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create tailored reports with the metrics you care about.</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
        >
          <FiPlus /> {showBuilder ? 'Close Builder' : 'Create Custom Report'}
        </button>
      </div>

      {/* Report Builder Panel */}
      {showBuilder && (
        <SCard className="p-6 border-indigo-100 bg-indigo-50/30">
          <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
            <HiSparkles className="text-indigo-600" /> Report Builder
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Report Name</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
                  placeholder="e.g., Q3 Hiring Summary"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Export Format</label>
                <div className="flex gap-3">
                  {['PDF', 'Excel', 'CSV'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        format === f
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >{f}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Select Metrics to Include</label>
              <div className="grid grid-cols-2 gap-2">
                {metrics.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMetric(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                      selectedMetrics.includes(m.id)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded border-2 shrink-0 flex items-center justify-center ${
                      selectedMetrics.includes(m.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}>
                      {selectedMetrics.includes(m.id) && <span className="text-white text-[8px] font-black">✓</span>}
                    </span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-indigo-100">
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
              <FiDownload /> Generate Report
            </button>
            <button className="flex items-center gap-2 border border-indigo-200 text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 transition">
              Save Template
            </button>
            <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
              Preview
            </button>
          </div>
        </SCard>
      )}

      {/* Report Templates */}
      <SCard className="p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Report Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <button
              key={i}
              onClick={() => setShowBuilder(true)}
              className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition text-left group"
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <div className="text-xs font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition">{t.name}</div>
                <div className="text-[10px] font-medium text-gray-500">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </SCard>

      {/* Saved Reports */}
      <SCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Saved Reports</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your previously generated and saved reports</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[540px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3">Report Name</th>
                <th className="pb-3 text-center">Format</th>
                <th className="pb-3 text-center">Created</th>
                <th className="pb-3 text-center">Downloads</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedReports.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition group">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <FiFileText className={r.type === 'PDF' ? 'text-red-500' : 'text-emerald-500'} />
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition">{r.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{r.type}</span>
                  </td>
                  <td className="py-3.5 text-center text-xs font-semibold text-gray-600">
                    <div className="flex items-center justify-center gap-1"><FiClock className="w-3 h-3 text-gray-400" />{r.created}</div>
                  </td>
                  <td className="py-3.5 text-center text-xs font-semibold text-gray-700">{r.downloads}</td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition"><FiDownload className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition"><FiEdit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 transition"><FiTrash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SCard>
    </div>
  );
}
