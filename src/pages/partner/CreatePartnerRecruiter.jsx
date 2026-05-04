import { useState } from "react";
import toast from "react-hot-toast";
import partnerApi from "../../services/partnerApi";

const CreatePartnerRecruiter = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    selectedPlanId: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await partnerApi.createRecruiter(form);
      toast.success("Recruiter created and payment link sent");
      setForm({ name: "", email: "", phone: "", selectedPlanId: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create recruiter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-3xl border border-[#EAE7F2] p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold text-gray-900">Create Recruiter Profile</h1>
      <p className="text-gray-500 text-sm mt-1">This recruiter will be linked with your referral account.</p>

      <form onSubmit={submit} className="space-y-4 mt-6">
        <input name="name" value={form.name} onChange={update} placeholder="Full name" className="w-full border rounded-2xl px-4 py-3" required />
        <input name="email" value={form.email} onChange={update} placeholder="Email" type="email" className="w-full border rounded-2xl px-4 py-3" required />
        <input name="phone" value={form.phone} onChange={update} placeholder="Phone" className="w-full border rounded-2xl px-4 py-3" />
        <input name="selectedPlanId" value={form.selectedPlanId} onChange={update} placeholder="Selected Plan ID optional" className="w-full border rounded-2xl px-4 py-3" />

        <button disabled={loading} className="w-full bg-[#7C3AED] text-white rounded-2xl px-4 py-3 font-bold">
          {loading ? "Creating..." : "Create Recruiter"}
        </button>
      </form>
    </div>
  );
};

export default CreatePartnerRecruiter;