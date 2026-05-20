import React, { useState, useEffect } from 'react';
import { referralAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  Copy, 
  Check, 
  TrendingUp, 
  Wallet, 
  Clock, 
  UserPlus,
  Share2,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

const ReferralManagement = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await referralAPI.getMyStats();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast.error('Failed to load referral data');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(stats?.user?.referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on ServiceHub!',
        text: `Hey! Use my referral link to join ServiceHub and find top service providers or jobs:`,
        url: stats?.user?.referralLink,
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
        <p className="text-gray-600">Invite your friends to ServiceHub and earn commission on their first subscription.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Referrals</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.user?.totalReferrals}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Wallet Balance</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats?.user?.referralWalletBalance}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Earnings</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats?.user?.totalReferralCommission}</h3>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white mb-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Share2 className="mr-2" /> Share your link
          </h2>
          <p className="text-indigo-100 mb-8 max-w-md">
            Earn 10% commission when your referred friends subscribe to any of our plans for the first time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex-1 w-full font-mono text-sm break-all">
              {stats?.user?.referralLink}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center whitespace-nowrap"
              >
                {copied ? <Check size={20} className="mr-2" /> : <Copy size={20} className="mr-2" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button 
                onClick={shareReferral}
                className="p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 transition-colors"
              >
                <Share2 size={24} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center text-sm text-indigo-100">
            <span className="mr-2">Your Code:</span>
            <span className="font-bold bg-white/20 px-3 py-1 rounded-lg border border-white/30 tracking-widest">{stats?.user?.referralCode}</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referrals List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Referrals</h3>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              {stats?.referrals?.length || 0} Total
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {stats?.referrals?.length > 0 ? (
              stats.referrals.map((ref) => (
                <div key={ref._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold overflow-hidden border-2 border-white shadow-sm">
                      {ref.referredUserId?.avatar ? (
                        <img src={ref.referredUserId.avatar} alt={ref.referredUserId.name} className="w-full h-full object-cover" />
                      ) : (
                        ref.referredUserId?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{ref.referredUserId?.name || 'Unknown User'}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Clock size={12} className="mr-1" />
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      ref.status === 'subscribed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ref.status}
                    </span>
                    {ref.commissionAmount > 0 && (
                      <p className="text-sm font-bold text-green-600 mt-1">+₹{ref.commissionAmount}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                  <UserPlus className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-500">No referrals yet. Share your link to start earning!</p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Wallet History</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {stats?.transactions?.length > 0 ? (
              stats.transactions.map((tx) => (
                <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'user_referral_commission' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {tx.type === 'user_referral_commission' ? <ArrowUpRight size={20} /> : <ArrowUpRight size={20} className="rotate-180" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {tx.type === 'user_referral_commission' ? 'Referral Commission' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'user_referral_commission' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'user_referral_commission' ? '+' : '-'}₹{tx.amount}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                  <Wallet className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-500">No transactions yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralManagement;
