import React, { useState, useEffect } from "react";
import { referralAPI, walletAPI } from "../../services/api";
import { toast } from "react-hot-toast";
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
  ArrowUpRight,
  Building2,
  Phone,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { auth } from "../../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";

const ReferralManagement = () => {
  const { user } = useAuth();
  const activeRole = user?.activeRole || user?.role;
  const isProvider = activeRole === "provider";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    upiId: "",
  });

  // Firebase Auth State
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Quick Invite State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "provider",
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, summaryRes, txnsRes] = await Promise.all([
        referralAPI.getMyStats(),
        walletAPI.getSummary(),
        walletAPI.getTransactions()
      ]);

      const statsData = statsRes.data;
      const summaryData = summaryRes.data.data;
      const txnsData = txnsRes.data.data;

      const mergedStats = {
        ...statsData,
        user: {
          ...statsData.user,
          referralWalletBalance: summaryData.referralWalletBalance || 0,
          totalReferralCommission: summaryData.totalCommissionEarned || 0,
        },
        transactions: txnsData || []
      };

      setStats(mergedStats);
      if (statsData?.user?.bankDetails) {
        setBankDetails({
          accountHolderName: statsData.user.bankDetails.accountHolderName || "",
          accountNumber: statsData.user.bankDetails.accountNumber || "",
          upiId: statsData.user.bankDetails.upiId || "",
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      toast.error("Failed to load referral data");
      setLoading(false);
    }
  };

  const saveBankDetails = async () => {
    setProcessing(true);
    try {
      await referralAPI.updatePaymentMethods(bankDetails);
      toast.success("Bank details saved securely.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save details");
    } finally {
      setProcessing(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" },
      );
    }
  };

  const sendOtp = async () => {
    if (!stats?.user?.phone) {
      return toast.error("Please add a phone number in your profile first");
    }
    setProcessing(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = stats.user.phone.startsWith("+91")
        ? stats.user.phone
        : `+91${stats.user.phone}`;

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to send OTP");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setProcessing(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return toast.error("Enter 6-digit OTP");
    setProcessing(true);
    try {
      await confirmationResult.confirm(otp);
      setIsPhoneVerified(true);
      setOtpSent(false);
      toast.success("Phone verified successfully!");
    } catch (error) {
      toast.error("Invalid or expired OTP");
    } finally {
      setProcessing(false);
    }
  };

  const submitWithdrawal = async () => {
    if (!isPhoneVerified) return toast.error("Please verify your phone first");
    const numericAmount = Number(withdrawAmount);
    if (!numericAmount || numericAmount < 500 || !Number.isInteger(numericAmount)) {
      return toast.error("Minimum withdrawal is ₹500 (positive integer)");
    }

    setProcessing(true);
    try {
      await referralAPI.requestWithdrawal({
        amount: Number(withdrawAmount),
        method: payoutMethod,
      });
      toast.success("Withdrawal request submitted successfully");
      setWithdrawAmount("");
      setIsPhoneVerified(false);
      fetchStats(); // Refresh balance
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(stats?.user?.referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Join me on ServiceHub!",
          text: `Hey! Use my referral link to join ServiceHub and find top service providers or jobs:`,
          url: stats?.user?.referralLink,
        })
        .catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await referralAPI.createUserReferral(inviteData);
      toast.success("User invited successfully! Email sent.");
      setInviteModalOpen(false);
      setInviteData({ name: "", email: "", phone: "", role: "provider" });
      fetchStats(); // refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to invite user");
    } finally {
      setInviting(false);
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
        <p className="text-gray-600">
          Invite your friends to ServiceHub and earn commission on their first
          subscription.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
              Total Referrals
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.user?.totalReferrals}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
              Wallet Balance
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹{stats?.user?.referralWalletBalance}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
              Total Earnings
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹{stats?.user?.totalReferralCommission}
            </h3>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="bg-linear-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white mb-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Share2 className="mr-2" /> Share your link
          </h2>
          <p className="text-indigo-100 mb-8 max-w-md">
            Earn 10% commission when your referred friends subscribe to any of
            our plans for the first time.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex-1 w-full font-mono text-sm break-all">
              {stats?.user?.referralLink}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center justify-center whitespace-nowrap border border-white/30"
              >
                {copied ? (
                  <Check size={20} className="mr-2" />
                ) : (
                  <Copy size={20} className="mr-2" />
                )}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-indigo-100 border-t border-white/20 pt-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="mr-2">Your Code:</span>
              <span className="font-bold bg-white/20 px-3 py-1 rounded-lg border border-white/30 tracking-widest">
                {stats?.user?.referralCode}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="mt-8 mb-6 flex justify-center">
        <button
          onClick={() => setInviteModalOpen(true)}
          className="relative w-full sm:w-auto flex items-center justify-center text-white bg-linear-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-600 px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] transition-all duration-300 font-extrabold text-lg transform hover:-translate-y-1 overflow-hidden group border border-white/10"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          <UserPlus size={24} className="mr-3 group-hover:scale-110 transition-transform duration-300" /> 
          Quick Invite Manually
        </button>
      </div>

      <br />

      {/* Quick Invite Form */}
      {inviteModalOpen && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <UserPlus className="mr-2 text-indigo-600" /> Quick Invite User
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
            <div className="md:col-span-2 flex gap-3 mt-4">
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-70"
              >
                {inviting ? "Sending Invite..." : "Send Email Invite"}
              </button>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div id="recaptcha-container"></div>

      {/* Withdrawal Section */}
      {!isProvider && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <CreditCard className="mr-2 text-indigo-600" /> Withdrawal Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Details Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                1. Payment Details (Encrypted)
              </h3>

              <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setPayoutMethod("bank")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${payoutMethod === "bank" ? "bg-white shadow text-indigo-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Bank
                </button>
                <button
                  onClick={() => setPayoutMethod("upi")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${payoutMethod === "upi" ? "bg-white shadow text-indigo-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  UPI
                </button>
              </div>

              {payoutMethod === "bank" && (
                <>
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) =>
                      setBankDetails((d) => ({
                        ...d,
                        accountHolderName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails((d) => ({
                        ...d,
                        accountNumber: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
                  />
                </>
              )}

              {payoutMethod === "upi" && (
                <input
                  type="text"
                  placeholder="UPI ID (e.g. name@bank)"
                  value={bankDetails.upiId}
                  onChange={(e) =>
                    setBankDetails((d) => ({ ...d, upiId: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
                />
              )}

              <button
                onClick={saveBankDetails}
                disabled={processing}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-70"
              >
                Save Payment Details
              </button>
            </div>

            {/* Request Withdrawal Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                2. Request Payout
              </h3>

              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="Amount (Min. ₹500)"
                  value={withdrawAmount}
                  step="1"
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    const sanitized = val.replace(/\D/g, '');
                    setWithdrawAmount(sanitized);
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
                />
              </div>
              <p className="text-xs text-gray-500 text-right">
                Available to withdraw: ₹{stats?.user?.referralWalletBalance}
              </p>

              {/* OTP Verification Block */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-start mb-3">
                  <ShieldCheck
                    className="text-indigo-600 mr-2 shrink-0"
                    size={20}
                  />
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    For your security, withdrawals require a one-time password
                    sent to your registered mobile number:{" "}
                    <strong>{stats?.user?.phone || "Not set"}</strong>
                  </p>
                </div>

                {!otpSent && !isPhoneVerified && (
                  <button
                    onClick={sendOtp}
                    disabled={processing}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-70"
                  >
                    Send OTP via SMS
                  </button>
                )}

                {otpSent && !isPhoneVerified && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={verifyOtp}
                      disabled={processing}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-70"
                    >
                      Verify
                    </button>
                  </div>
                )}

                {isPhoneVerified && (
                  <div className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-3 py-2 rounded-lg">
                    <Check size={16} className="mr-1" /> Phone Verified
                    Successfully
                  </div>
                )}
              </div>

              <button
                onClick={submitWithdrawal}
                disabled={processing || !isPhoneVerified || !withdrawAmount}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex justify-center items-center"
              >
                Submit Withdrawal Request
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referrals List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Referrals
            </h3>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              {stats?.referrals?.length || 0} Total
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {stats?.referrals?.length > 0 ? (
              stats.referrals.map((ref) => (
                <div
                  key={ref._id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold overflow-hidden border-2 border-white shadow-sm">
                      {ref.referredUserId?.avatar ? (
                        <img
                          src={ref.referredUserId.avatar}
                          alt={ref.referredUserId.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        ref.referredUserId?.name?.charAt(0) || "U"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {ref.referredUserId?.name || "Unknown User"}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Clock size={12} className="mr-1" />
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ref.status === "subscribed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {ref.status}
                    </span>
                    {ref.commissionAmount > 0 && (
                      <p className="text-sm font-bold text-green-600 mt-1">
                        +₹{ref.commissionAmount}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                  <UserPlus className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-500">
                  No referrals yet. Share your link to start earning!
                </p>
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
                <div
                  key={tx._id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.direction === "credit"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {tx.direction === "credit" ? (
                        <ArrowUpRight size={20} />
                      ) : (
                        <ArrowUpRight size={20} className="rotate-180" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {tx.type ? tx.type.replace(/_/g, ' ') : 'Transaction'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {tx.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${tx.direction === "credit" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.direction === "credit" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
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
