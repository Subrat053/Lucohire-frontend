import { useState } from "react";
import { HiLockClosed, HiEye, HiEyeOff, HiShieldCheck } from "react-icons/hi";
import { authAPI } from "../../services/api";
import toast from "react-hot-toast";

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getPasswordStrength = (password) => {
    if (!password) return { label: "", color: "bg-slate-200" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&#]/.test(password)) strength++;

    if (strength <= 2) return { label: "Weak", color: "bg-red-400" };
    if (strength <= 4) return { label: "Good", color: "bg-yellow-400" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength(formData.newPassword);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    setLoading(true);
    try {
      await authAPI.changePassword(formData);
      toast.success("Password changed successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-[#081028] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black">Change Password</h2>
            <p className="text-slate-400 text-sm mt-1">Update your account security settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Current Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <HiLockClosed className="h-5 w-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
              </div>
              <input
                name="currentPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.currentPassword}
                onChange={handleChange}
                className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all outline-none font-medium text-slate-900"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-600"
              >
                {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* New Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <HiLockClosed className="h-5 w-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
              </div>
              <input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all outline-none font-medium text-slate-900"
                placeholder="Enter new password"
              />
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
                  Include uppercase, numbers, and symbols for a stronger password.
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
                <HiLockClosed className="h-5 w-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
              </div>
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all outline-none font-medium text-slate-900"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
