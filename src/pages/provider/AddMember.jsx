import React, { useState } from "react";
import { referralAPI } from "../../services/api";
import { toast } from "react-hot-toast";
import { UserPlus } from "lucide-react";

const AddMember = () => {
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "provider",
  });
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await referralAPI.createUserReferral(inviteData);
      toast.success("User invited successfully! Email sent.");
      setInviteData({ name: "", email: "", phone: "", role: "provider" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Member</h1>
        <p className="text-gray-600">
          Invite new members to the platform manually.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <UserPlus className="mr-2 text-indigo-600" /> Invite User
        </h2>
        <form
          onSubmit={handleInvite}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Full Name"
            required
            value={inviteData.name}
            onChange={(e) =>
              setInviteData({ ...inviteData, name: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
          />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={inviteData.email}
            onChange={(e) =>
              setInviteData({ ...inviteData, email: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
          />
          <input
            type="tel"
            placeholder="Phone (Optional)"
            value={inviteData.phone}
            onChange={(e) =>
              setInviteData({ ...inviteData, phone: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
          />
          <select
            value={inviteData.role}
            onChange={(e) =>
              setInviteData({ ...inviteData, role: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
          >
            <option value="provider">Service Provider</option>
            <option value="recruiter">Recruiter / Client</option>
          </select>
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={inviting}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-70"
            >
              {inviting ? "Sending Invite..." : "Send Email Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;
