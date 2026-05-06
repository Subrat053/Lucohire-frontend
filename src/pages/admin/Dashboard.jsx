import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiUsers, HiUserAdd, HiBriefcase, HiCheckCircle, HiArrowRight, HiSearch, HiFilter, HiChevronRight, HiPhotograph } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// Import all the new dashboard components
import DashboardStatsCard from '../../components/admin/DashboardStatsCard';
import RevenueChart from '../../components/admin/RevenueChart';
import EarningsSourceChart from '../../components/admin/EarningsSourceChart';
import TopPartnersTable from '../../components/admin/TopPartnersTable';
import RewardProgramTable from '../../components/admin/RewardProgramTable';
import PlatformSummary from '../../components/admin/PlatformSummary';
import PlanSummary from '../../components/admin/PlanSummary';
import RewardPoolCard from '../../components/admin/RewardPoolCard';

const Dashboard = () => {
  const { user: admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/50 min-h-screen">
      
      {/* Top Bar Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 text-xs">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">
          <HiFilter className="w-4 h-4" /> Filters
        </button>
        <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex-1">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-400">Date Range:</span>
            <select className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-400">Group by:</span>
            <select className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
              <option>Country</option>
            </select>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-400">Plan Type:</span>
            <select className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
              <option>All Plans</option>
            </select>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-400">Partner Type:</span>
            <select className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
              <option>All Partners</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">
            Reset
          </button>
          <button className="px-4 py-1.5 bg-[#7C3AED] text-white rounded-full font-bold shadow-sm hover:bg-[#6D28D9] transition-colors">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {admin?.name || 'Admin'} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening with your platform today.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Purple Revenue Banner */}
          <div className="bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#A855F7] rounded-[24px] p-8 text-white relative overflow-hidden shadow-lg">
            {/* Decorative blurs */}
            <div className="absolute -top-24 -right-20 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-20 w-40 h-40 bg-white/10 rounded-full blur-xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-purple-200 uppercase mb-2">Total Platform Revenue</p>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
                  </h2>
                </div>
                
                <div className="flex items-center gap-8 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Website Earnings</p>
                    <p className="text-xl font-bold">₹{(stats.websiteEarnings || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Total Payouts</p>
                    <p className="text-xl font-bold">₹{(stats.totalPayouts || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-end items-start md:items-end">
                <Link to="/admin/payments" className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all hover:scale-105">
                  View Transactions <HiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Activity Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Platform Activity</h3>
                <span className="text-[10px] text-gray-400">Total metrics</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <DashboardStatsCard 
                  icon={HiUsers} 
                  label="Total Users" 
                  value={(stats.totalUsers || 0).toLocaleString('en-IN')} 
                />
                <DashboardStatsCard 
                  icon={HiUserAdd} 
                  label="Candidates" 
                  value={(stats.totalProviders || 0).toLocaleString('en-IN')} 
                />
                <DashboardStatsCard 
                  icon={HiBriefcase} 
                  label="Recruiters" 
                  value={(stats.totalRecruiters || 0).toLocaleString('en-IN')} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 text-red-500">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest">Pending Review</h3>
                <span className="text-[10px]">Action required</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/admin/users?status=pending">
                  <DashboardStatsCard 
                    icon={HiCheckCircle} 
                    label="Pending Accounts" 
                    value={(stats.pendingApprovals || 0).toLocaleString('en-IN')} 
                    isPriority={true}
                  />
                </Link>
                <Link to="/admin/profile-photo-approvals">
                  <DashboardStatsCard 
                    icon={HiPhotograph} 
                    label="Photo Approvals" 
                    value={(stats.pendingPhotoApprovals || 0).toLocaleString('en-IN')} 
                    isPriority={true}
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={stats.revenueTrend || []} />
            <EarningsSourceChart data={stats.earningsBySource || []} />
          </div>

          {/* Tables Row */}
          <div className="space-y-6">
            <TopPartnersTable partners={stats.topPartners || []} />
            <RewardProgramTable topPartners={stats.topPartners || []} />
          </div>
          
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <PlatformSummary 
            totalUsers={stats.totalUsers} 
            totalProviders={stats.totalProviders} 
            totalRecruiters={stats.totalRecruiters} 
          />
          <PlanSummary plans={stats.planSummary || {}} />
          <RewardPoolCard pool={stats.rewardPool} />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

