import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

const DashboardStatsCard = ({ icon: Icon, label, value, trend, trendLabel }) => {
  const isPositive = trend >= 0;

  return (
    <div className="bg-white rounded-3xl border border-[#EAE7F2] p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {isPositive ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-extrabold text-gray-900 mt-4">{value}</h3>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {trendLabel && <p className="text-[10px] text-gray-400 mt-0.5">{trendLabel}</p>}
    </div>
  );
};

export default DashboardStatsCard;
