import { Link } from 'react-router-dom';

const SubscriptionOverview = ({ data = {} }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-900">Subscription Overview</h3>
        <Link to="/admin/plans" className="text-[10px] font-bold text-blue-500 hover:underline">View all →</Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col border-r border-gray-100 pr-2">
          <span className="text-[10px] font-medium text-gray-500 leading-tight mb-1">AI Pro<br/>(Candidates)</span>
          <span className="text-lg font-extrabold text-gray-900">{data.aiPro?.toLocaleString() || 0}</span>
          <span className="text-[10px] font-bold text-emerald-500 mt-1">↑ {data.aiProTrend}%</span>
        </div>

        <div className="flex flex-col border-r border-gray-100 pr-2">
          <span className="text-[10px] font-medium text-gray-500 leading-tight mb-1">Freelance<br/>Alerts</span>
          <span className="text-lg font-extrabold text-gray-900">{data.freelanceAlerts?.toLocaleString() || 0}</span>
          <span className="text-[10px] font-bold text-emerald-500 mt-1">↑ {data.freelanceAlertsTrend}%</span>
        </div>

        <div className="flex flex-col border-r border-gray-100 pr-2">
          <span className="text-[10px] font-medium text-gray-500 leading-tight mb-1">Recruiter<br/>Plans</span>
          <span className="text-lg font-extrabold text-gray-900">{data.recruiterPlans?.toLocaleString() || 0}</span>
          <span className="text-[10px] font-bold text-emerald-500 mt-1">↑ {data.recruiterPlansTrend}%</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-orange-500 leading-tight mb-1">Expiring Soon</span>
          <span className="text-lg font-extrabold text-orange-500">{data.expiringSoon?.toLocaleString() || 0}</span>
          <span className="text-[10px] font-medium text-gray-400 mt-1">In next 7 days</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOverview;
