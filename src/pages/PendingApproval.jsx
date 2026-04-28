import { HiClock, HiShieldCheck } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const PendingApproval = () => {
  const { user } = useAuth();
  const role = user?.activeRole || user?.role;
  const roleLabel = role === 'provider' ? 'provider' : 'recruiter';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
          <HiClock className="w-8 h-8 text-amber-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Approval Pending</h1>
        <p className="text-gray-600 text-sm mb-6">
          Your {roleLabel} account is under manager/admin review. Panel access will be enabled after approval.
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <HiShieldCheck className="w-4 h-4" /> Access is temporarily restricted
          </div>
          <p>
            You currently cannot access dashboard, plans, profile, leads, jobs, or other panel sections until approval is completed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
