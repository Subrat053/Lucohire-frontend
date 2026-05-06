import { HiChevronRight } from 'react-icons/hi';

const PlanSummary = ({ plans = {} }) => {
  // Map plan slugs to nice display names and colors based on the image
  const PLAN_TYPES = [
    { key: 'free', name: 'Free', color: 'bg-gray-300', dot: 'bg-gray-300' },
    { key: 'starter', name: 'Basic', color: 'bg-[#C4B5FD]', dot: 'bg-[#A78BFA]' },
    { key: 'business', name: 'Pro', color: 'bg-[#7C3AED]', dot: 'bg-[#7C3AED]' },
    { key: 'enterprise', name: 'Enterprise', color: 'bg-gray-900', dot: 'bg-gray-900' },
  ];

  // For visual mockup, override counts to match image if empty
  const defaultPlans = Object.keys(plans).length === 0 ? {
    free: 84520,
    starter: 28140,
    business: 9820,
    enterprise: 2100
  } : plans;

  const total = Object.values(defaultPlans).reduce((a, b) => a + (Number(b) || 0), 0) || 1;

  return (
    <div className="bg-white rounded-3xl border border-[#EAE7F2] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-gray-900 text-sm">Plan Summary</h3>
        <span className="text-[10px] text-gray-500">{total.toLocaleString('en-IN')} total</span>
      </div>
      
      {/* Single Multi-color Progress Bar */}
      <div className="flex w-full h-1.5 rounded-full overflow-hidden mb-6">
        {PLAN_TYPES.map((plan) => {
          const count = defaultPlans[plan.key] || 0;
          const percentage = (count / total) * 100;
          if (percentage === 0) return null;
          return (
            <div 
              key={plan.key}
              className={`${plan.color} h-full`} 
              style={{ width: `${percentage}%` }}
            />
          );
        })}
      </div>

      <div className="space-y-3 text-[11px]">
        {PLAN_TYPES.map((plan) => {
          const count = defaultPlans[plan.key] || 0;
          const percentage = ((count / total) * 100).toFixed(1);
          
          return (
            <div key={plan.key} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${plan.dot}`} />
                <span className="text-gray-500 font-medium">{plan.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-extrabold text-gray-900 w-12 text-right">{count.toLocaleString('en-IN')}</span>
                <span className="text-gray-400 w-8 text-right">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanSummary;
