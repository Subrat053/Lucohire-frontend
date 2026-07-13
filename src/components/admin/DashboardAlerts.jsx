import { HiOutlineExclamationCircle, HiOutlineCreditCard, HiOutlineShieldExclamation, HiOutlineServer, HiOutlineUsers, HiOutlinePhone, HiOutlineTicket, HiOutlineClock, HiOutlineLink } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const DashboardAlerts = ({ criticalAlerts = [], teamPerformance = {} }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Critical Alerts */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-5">
          <HiOutlineExclamationCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-bold text-gray-900">Critical Alerts</h3>
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {criticalAlerts.reduce((sum, a) => sum + (a.count || 0), 0)}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {criticalAlerts.map((alert) => (
            <div key={alert.id} className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                  {alert.id === 1 && <HiOutlineServer className="w-3.5 h-3.5" />}
                  {alert.id === 2 && <HiOutlineCreditCard className="w-3.5 h-3.5" />}
                  {alert.id === 3 && <HiOutlineShieldExclamation className="w-3.5 h-3.5" />}
                  {alert.id === 4 && <HiOutlineServer className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-bold text-gray-600 leading-tight">{alert.title}</span>
              </div>
              <span className="text-lg font-extrabold text-gray-900 mb-1">{alert.count}</span>
              <Link to={alert.actionLink} className="text-[10px] font-medium text-blue-500 hover:underline">
                {alert.actionText}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-900">Team Performance <span className="text-gray-500 font-normal">(Customer Support)</span></h3>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Live</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="flex flex-col border-r border-gray-100 pr-2">
            <div className="flex items-center gap-1 mb-1">
              <HiOutlineUsers className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium leading-tight">Executives<br/>Online</span>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className="text-lg font-extrabold text-gray-900">{teamPerformance.executivesOnline || 0}</span>
              <span className="text-[10px] font-bold text-gray-400">/ {teamPerformance.totalExecutives || 0}</span>
            </div>
          </div>
          
          <div className="flex flex-col border-r border-gray-100 pr-2">
            <div className="flex items-center gap-1 mb-1">
              <HiOutlinePhone className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium leading-tight">On Call</span>
            </div>
            <span className="text-lg font-extrabold text-gray-900 mt-auto">{teamPerformance.onCall || 0}</span>
          </div>

          <div className="flex flex-col border-r border-gray-100 pr-2">
            <div className="flex items-center gap-1 mb-1">
              <HiOutlineTicket className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium leading-tight">Tickets Resolved<br/>Today</span>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              <span className="text-lg font-extrabold text-gray-900">{teamPerformance.ticketsResolvedToday || 0}</span>
              <span className="text-[10px] font-bold text-emerald-500">↑ {teamPerformance.ticketsResolvedTrend}%</span>
            </div>
          </div>

          <div className="flex flex-col border-r border-gray-100 pr-2">
            <div className="flex items-center gap-1 mb-1">
              <HiOutlineClock className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium leading-tight">Avg.<br/>Resolution Time</span>
            </div>
            <span className="text-lg font-extrabold text-gray-900 mt-auto">{teamPerformance.avgResolutionTime || '0m'}</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <HiOutlineLink className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium leading-tight">Payment Links<br/>Sent</span>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              <span className="text-lg font-extrabold text-gray-900">{teamPerformance.paymentLinksSent || 0}</span>
              <span className="text-[10px] font-bold text-emerald-500">↑ {teamPerformance.paymentLinksTrend}%</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DashboardAlerts;
