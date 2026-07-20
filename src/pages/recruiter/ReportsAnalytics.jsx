import useTranslation from "../../hooks/useTranslation";
import React, { Suspense } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FiCalendar, FiFilter, FiDownload, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

const tabs = [
  { label: 'Overview',           path: '/recruiter/reports'                    },
  { label: 'Hiring Funnel',      path: '/recruiter/reports/hiring-funnel'      },
  { label: 'Source Analytics',   path: '/recruiter/reports/source-analytics'   },
  { label: 'Job Performance',    path: '/recruiter/reports/job-performance'    },
  { label: 'Outreach Analytics', path: '/recruiter/reports/outreach-analytics' },
  { label: 'AI Insights',        path: '/recruiter/reports/ai-insights'        },
  { label: 'Custom Reports',     path: '/recruiter/reports/custom-reports'     },
];

const ReportsAnalytics = () => {
  const { t } = useTranslation();

  const handleExport = () => {
    // Generate dummy CSV
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Metric,Value\n"
      + "2026-05-01,Hires,5\n"
      + "2026-05-02,Hires,3\n"
      + "2026-05-03,Hires,8";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recruiter_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(t("Report exported successfully!"));
  };

  const handleFilters = () => {
    toast.success(t("Filters menu opened"));
  };

  const handleDateChange = () => {
    toast.success(t("Date range updated to Last 30 Days"));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{t("Reports & Analytics")}</h1>
              <p className="text-sm text-gray-500">{t("Track performance, measure impact and make data-driven hiring decisions.")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 transition whitespace-nowrap">
                <FiCalendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="hidden sm:inline">{t("20 Apr – 20 May 2026")}</span>
                <span className="sm:hidden">{t("Apr – May")}</span>
                <FiChevronDown className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleFilters}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 transition"
              >
                <FiFilter className="w-4 h-4" />{t("Filters")}
              </button>
              <button 
                onClick={handleExport}
                className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <FiDownload className="w-4 h-4 relative z-10 group-hover:animate-bounce" />
                <span className="relative z-10">{t("Export")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.path === '/recruiter/reports'}
                className={({ isActive }) =>
                  `flex-shrink-0 px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition border-b-2 ${
                    isActive
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-200'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Sub-page content */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        }>
          <Outlet />
        </Suspense>

      </div>
    </div>
  );
};

export default ReportsAnalytics;
