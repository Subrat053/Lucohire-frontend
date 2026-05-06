import { useState } from "react";
import toast from "react-hot-toast";
import { HiUser, HiMail, HiPhone, HiTicket, HiPlus, HiDuplicate, HiCheckCircle, HiArrowRight, HiBriefcase } from "react-icons/hi";
import partnerApi from "../../services/partnerApi";

const CreatePartnerProvider = () => {
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
      const res = await partnerApi.createProvider(form);
      setCredentials({ email: form.email, password: res.data.password });
      toast.success("Provider created and payment link sent");
      setForm({ name: "", email: "", phone: "", selectedPlanId: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create provider");
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
          <div className="bg-[#7C3AED] p-8 rounded-[32px] text-white shadow-xl shadow-purple-200 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <HiBriefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black leading-tight">Create Provider Profile</h1>
              <p className="mt-4 text-purple-100 text-sm leading-relaxed">
                Onboard a new service provider to your network. They will be automatically linked to your referral dashboard for commissions.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiCheckCircle className="text-green-500 w-5 h-5" />
              What happens next?
            </h3>
            <ul className="space-y-3">
              {[
                "Account is instantly created",
                "Temporary password generated",
                "Payment link sent via email",
                "Referral tracking activated"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
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
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Success!</h2>
                <p className="text-gray-500 text-sm mt-2">Provider account is ready for use.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 relative group">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                    <span className="text-lg font-bold text-gray-900">{credentials.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Temporary Password</span>
                    <span className="text-lg font-bold text-indigo-600 font-mono tracking-tighter">{credentials.password}</span>
                  </div>
                </div>
                <button 
                  onClick={copyCredentials}
                  className="absolute top-4 right-4 p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                  title="Copy to clipboard"
                >
                  <HiDuplicate className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={copyCredentials}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98]"
                >
                  <HiDuplicate className="w-5 h-5" />
                  Copy & Share Credentials
                </button>
                <button 
                  onClick={() => setCredentials(null)}
                  className="w-full py-4 text-gray-600 font-bold hover:text-gray-900 transition-colors"
                >
                  Add Another Provider
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={update} 
                    placeholder="Full name" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all font-medium text-gray-900" 
                    required 
                  />
                </div>
                <div className="relative group">
                  <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    name="email" 
                    value={form.email} 
                    onChange={update} 
                    placeholder="Email address" 
                    type="email" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all font-medium text-gray-900" 
                    required 
                  />
                </div>
                <div className="relative group">
                  <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={update} 
                    placeholder="Phone number" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all font-medium text-gray-900" 
                  />
                </div>
                <div className="relative group">
                  <HiTicket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    name="selectedPlanId" 
                    value={form.selectedPlanId} 
                    onChange={update} 
                    placeholder="Plan ID (optional)" 
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all font-medium text-gray-900" 
                  />
                </div>
              </div>

              <button 
                disabled={loading} 
                className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-black text-lg shadow-lg shadow-purple-100 hover:bg-[#6D28D9] hover:shadow-purple-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Profile
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

export default CreatePartnerProvider;