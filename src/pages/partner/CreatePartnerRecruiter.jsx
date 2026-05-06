import { useState } from "react";
import toast from "react-hot-toast";
import { HiUser, HiMail, HiPhone, HiTicket, HiDuplicate, HiCheckCircle, HiArrowRight, HiUserGroup, HiClipboardCheck } from "react-icons/hi";
import partnerApi from "../../services/partnerApi";

const CreatePartnerRecruiter = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    selectedPlanId: "",
  });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await partnerApi.createRecruiter(form);
      setCredentials({ email: form.email, password: res.data.password });
      toast.success("Recruiter created and payment link sent");
      setForm({ name: "", email: "", phone: "", selectedPlanId: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create recruiter");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (credentials) {
      const text = `Login URL: ${window.location.origin}/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
      navigator.clipboard.writeText(text);
      toast.success("Credentials copied to clipboard");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Column - Info & Branding */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <HiUserGroup className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black leading-tight">Add New Recruiter</h1>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Register a new recruiter to your network. They will be linked to your partner account for all future commission tracking.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiClipboardCheck className="text-indigo-500 w-5 h-5" />
              Onboarding Checklist
            </h3>
            <ul className="space-y-3">
              {[
                "Instant account activation",
                "Secure credentials generation",
                "Email notification with login link",
                "Lifetime referral association"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column - Form / Success */}
        <div className="lg:col-span-3">
          {credentials ? (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiCheckCircle className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Account Created!</h2>
                <p className="text-gray-500 text-sm mt-2">The recruiter can now log in using these details.</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 relative group">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recruiter Email</span>
                    <span className="text-lg font-bold text-slate-900">{credentials.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">One-time Password</span>
                    <span className="text-lg font-bold text-indigo-600 font-mono tracking-tighter">{credentials.password}</span>
                  </div>
                </div>
                <button 
                  onClick={copyCredentials}
                  className="absolute top-4 right-4 p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                  title="Copy to clipboard"
                >
                  <HiDuplicate className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={copyCredentials}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98]"
                >
                  <HiDuplicate className="w-5 h-5" />
                  Copy & Securely Share
                </button>
                <button 
                  onClick={() => setCredentials(null)}
                  className="w-full py-4 text-slate-500 font-bold hover:text-slate-900 transition-colors"
                >
                  Register Another Recruiter
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={update} 
                    placeholder="Recruiter Full Name" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all font-medium text-gray-900" 
                    required 
                  />
                </div>
                <div className="relative group">
                  <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    name="email" 
                    value={form.email} 
                    onChange={update} 
                    placeholder="Business Email" 
                    type="email" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all font-medium text-gray-900" 
                    required 
                  />
                </div>
                <div className="relative group">
                  <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={update} 
                    placeholder="Contact Number" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all font-medium text-gray-900" 
                  />
                </div>
                <div className="relative group">
                  <HiTicket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    name="selectedPlanId" 
                    value={form.selectedPlanId} 
                    onChange={update} 
                    placeholder="Assigned Plan ID (optional)" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all font-medium text-gray-900" 
                  />
                </div>
              </div>

              <button 
                disabled={loading} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg shadow-slate-100 hover:bg-black hover:shadow-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm Registration
                    <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreatePartnerRecruiter;