import { useState } from "react";
import { Link } from "react-router-dom";
import { HiLockClosed, HiEye, HiEyeOff, HiShieldCheck, HiMail, HiPhone, HiKey, HiExternalLink } from "react-icons/hi";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChangePassword = () => {
  const { user, refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const getPasswordStrength = (password) => {
    if (!password) return { label: "", color: "bg-slate-200" };
    if (password.length < 6) return { label: "Weak", color: "bg-red-400" };
    if (password.length < 10) return { label: "Good", color: "bg-yellow-400" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength(formData.newPassword);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendResetOtp = async () => {
    const targetEmail = user?.email;
    if (!targetEmail) {
      return toast.error("No registered email address found for your account.");
    }

    setSendingReset(true);
    try {
      await authAPI.forgotPassword({ email: targetEmail });
      setResetSent(true);
      toast.success(`Password reset link & verification OTP sent to ${targetEmail}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send reset link / OTP");
    } finally {
      setSendingReset(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    setLoading(true);
    try {
      await authAPI.changePassword(formData);
      toast.success("Password changed successfully");
      
      // Force local update immediately as a fallback
      try {
        const cachedStr = localStorage.getItem('authUser') || localStorage.getItem('user');
        if (cachedStr) {
          const cachedUser = JSON.parse(cachedStr);
          cachedUser.hasPassword = true;
          localStorage.setItem('authUser', JSON.stringify(cachedUser));
        }
      } catch(e) {}

      // Refresh user data so hasPassword is updated in React context
      if (refreshUser) await refreshUser();
      
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });
      
      // Auto-redirect to dashboard to clear state
      setTimeout(() => {
         window.location.href = user?.role === 'admin' ? '/admin/dashboard' : user?.activeRole === 'recruiter' ? '/recruiter/dashboard' : '/provider/dashboard';
      }, 1500);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const getUpdateProfileLink = () => {
    if (user?.role === 'admin') return '/admin/settings';
    if (user?.activeRole === 'recruiter' || user?.role === 'recruiter') return '/recruiter/settings';
    return '/provider/profile';
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 lg:mt-9 space-y-6">
      {/* ── Active Recipient Details Banner ── */}
      <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Security Recipient Address
          </span>
          <Link
            to={getUpdateProfileLink()}
            className="text-xs text-indigo-300 hover:text-white font-bold flex items-center gap-1 underline transition"
          >
            Update Email / Mobile <HiExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
            <HiMail className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Registered Email ID</p>
              <p className="font-mono font-bold text-white truncate">{user?.email || 'Not configured'}</p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
            <HiPhone className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Registered Mobile Number</p>
              <p className="font-mono font-bold text-white truncate">{user?.phone || user?.phoneNumber || 'Not configured'}</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
          ℹ️ All password reset verification links, security tokens, and OTP codes will be sent directly to the registered email & mobile number shown above.
        </p>
      </div>

      {/* ── Main Change Password Form ── */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-emerald-950 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black">Change Password</h2>
            <p className="text-slate-400 text-sm mt-1">Update your account security settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <HiLockClosed className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium text-slate-900"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600"
              >
                {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Strength indicator */}
            {formData.newPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <span className="text-slate-400">Security Strength</span>
                  <span className={strength.label === "Strong" ? "text-green-600" : strength.label === "Good" ? "text-yellow-600" : "text-red-600"}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${strength.color}`} style={{ width: strength.label === "Strong" ? "100%" : strength.label === "Good" ? "60%" : "30%" }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Password must be at least 6 characters long.
                </p>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <HiLockClosed className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium text-slate-900"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <HiShieldCheck className="w-6 h-6" />
                  Update Password
                </>
              )}
            </button>
          </div>

          {/* ── Forgot Password Section ── */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <HiKey className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-amber-950 text-sm">Forgot your current password?</p>
                  <p className="text-amber-700 mt-0.5">
                    Click to send a password reset verification link & OTP code directly to <strong className="font-mono text-amber-950">{user?.email || 'your email'}</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendResetOtp}
                disabled={sendingReset}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition text-xs shrink-0 shadow-sm disabled:opacity-50 self-start sm:self-auto flex items-center gap-1.5"
              >
                {sendingReset ? 'Sending Reset OTP...' : '🔑 Send Reset Link / OTP'}
              </button>
            </div>

            {resetSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <HiShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password reset instructions & OTP have been dispatched to <strong>{user?.email}</strong>. Check your email inbox!</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
