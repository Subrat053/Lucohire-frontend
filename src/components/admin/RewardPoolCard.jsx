import { HiGift } from 'react-icons/hi';

const RewardPoolCard = ({ pool = { total: 100000, distributed: 0, remaining: 100000 } }) => {
  const percentage = Math.round((pool.distributed / pool.total) * 100) || 0;

  return (
    <div className="bg-gradient-to-br from-[#F8F7FB] to-white rounded-3xl border border-[#EAE7F2] p-6 shadow-sm relative overflow-hidden">
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
            <HiGift className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Reward Pool</h3>
            <p className="text-[10px] text-gray-500">Monthly distribution status</p>
          </div>
        </div>

        <div className="mb-5 mt-2">
          <h2 className="text-[28px] font-extrabold text-gray-900">
            ₹{pool.total.toLocaleString('en-IN')}
          </h2>
          <p className="text-[10px] text-gray-400 mt-1">
            Total pool
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-[#7C3AED] h-1.5 rounded-full transition-all" 
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] mt-2">
            <span className="text-gray-500">Distributed</span>
            <span className="font-bold text-green-600">₹{pool.distributed.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">Remaining</span>
            <span className="font-bold text-gray-900">₹{pool.remaining.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardPoolCard;
