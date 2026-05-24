import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { providerWalletAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiCreditCard, HiPlus, HiTrash, HiCheckCircle, HiArrowRight, HiShieldCheck, HiOutlineSparkles, HiLockClosed } from 'react-icons/hi';
import { FaQrcode as HiQrCode } from 'react-icons/fa';
import useTranslation from '../../hooks/useTranslation';

const PayoutSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [activeTab, setActiveTab] = useState('bank'); // bank, upi, qr
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [upiId, setUpiId] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [qrProviderName, setQrProviderName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const { data } = await providerWalletAPI.getWallet();
      setPayoutMethods(data.payoutMethods || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('payout.failedLoad', 'Failed to load payout settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone) {
      toast.error(t('payout.phoneRequired', 'Mobile number is required for verification'));
      return;
    }
    
    // Quick format validation for phone
    if (phone.length < 10) {
      toast.error(t('payout.phoneInvalid', 'Please enter a valid mobile number'));
      return;
    }

    try {
      setSendingOtp(true);
      await providerWalletAPI.sendOtpForPayout({ phone });
      toast.success(t('payout.otpSent', '6-digit verification code sent to your mobile'));
      setShowOtpModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('payout.otpFail', 'Failed to send verification code'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleQrUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('qrCode', file);
    
    const toastId = toast.loading(t('payout.uploadingQr', 'Uploading QR Code image...'));
    try {
      const { data } = await providerWalletAPI.uploadQrCode(formData);
      setQrPreview(data.url);
      toast.success(t('payout.qrUploaded', 'QR Code uploaded successfully!'), { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || t('payout.qrUploadFail', 'QR Image upload failed'), { id: toastId });
    }
  };

  const resetForm = () => {
    setBankDetails({
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
    });
    setUpiId('');
    setQrFile(null);
    setQrPreview('');
    setQrProviderName('');
    setIsDefault(false);
    setEditingId(null);
    setOtp('');
    setShowOtpModal(false);
  };

  const handleEditClick = (method) => {
    resetForm();
    setEditingId(method._id);
    setActiveTab(method.type);
    setIsDefault(method.isDefault);
    
    if (method.type === 'bank') {
      setBankDetails({
        accountHolderName: method.bankDetails?.accountHolderName || '',
        bankName: method.bankDetails?.bankName || '',
        accountNumber: '', // Keep empty or masked for safety upon edit
        ifscCode: method.bankDetails?.ifscCode || '',
      });
    } else if (method.type === 'upi') {
      setUpiId(method.upiId || '');
    } else if (method.type === 'qr') {
      setQrPreview(method.qrCodeImage || '');
      setQrProviderName(method.providerName || '');
    }
    
    // Smooth scroll to top/form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePayoutMethod = async () => {
    if (!otp || otp.length !== 6) {
      toast.error(t('payout.enterOtp', 'Please enter the 6-digit OTP code'));
      return;
    }

    setSaving(true);
    const payload = {
      id: editingId,
      type: activeTab,
      isDefault,
      otp,
      phone
    };

    if (activeTab === 'bank') {
      payload.bankDetails = bankDetails;
    } else if (activeTab === 'upi') {
      payload.upiId = upiId;
    } else if (activeTab === 'qr') {
      payload.qrCodeImage = qrPreview;
      payload.providerName = qrProviderName;
    }

    try {
      const { data } = await providerWalletAPI.savePayoutMethod(payload);
      setPayoutMethods(data.payoutMethods || []);
      toast.success(editingId ? t('payout.updated', 'Payout method updated!') : t('payout.saved', 'Payout method saved!'));
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('payout.saveFail', 'Failed to save payout method'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const { data } = await providerWalletAPI.setDefaultPayoutMethod(id);
      setPayoutMethods(data.payoutMethods || []);
      toast.success(t('payout.defaultSet', 'Default payout method updated'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('payout.defaultFail', 'Failed to update default status'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('payout.deleteConfirm', 'Are you sure you want to delete this payout method?'))) return;
    try {
      const { data } = await providerWalletAPI.deletePayoutMethod(id);
      setPayoutMethods(data.payoutMethods || []);
      toast.success(t('payout.deleted', 'Payout method removed'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('payout.deleteFail', 'Failed to delete payout method'));
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              {t('payout.badge', 'Withdrawal Center')}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('payout.title', 'Payout Settings')}</h1>
            <p className="text-slate-400 mt-2 max-w-lg text-sm md:text-base">
              {t('payout.subtitle', 'Configure and verify your billing payout destinations securely. Verification code is required for modifications.')}
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10 shrink-0">
            <HiShieldCheck className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-xs text-slate-400">{t('payout.securityStatus', 'Secured & Masked')}</p>
              <p className="text-xs font-bold text-slate-200">{t('payout.securityLevel', 'AES-256 Compliant')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Side: Payout Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><HiCreditCard className="w-5 h-5" /></span>
            {editingId ? t('payout.editHeader', 'Edit Payout Method') : t('payout.addHeader', 'Add Payout Method')}
          </h2>

          {/* Form Tabs */}
          <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-6">
            {[
              { id: 'bank', label: t('payout.tabBank', 'Bank Account'), icon: HiCreditCard },
              { id: 'upi', label: t('payout.tabUpi', 'UPI ID'), icon: HiShieldCheck },
              { id: 'qr', label: t('payout.tabQr', 'QR Code'), icon: HiQrCode }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { if (!editingId) setActiveTab(tab.id); }}
                disabled={!!editingId}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900 disabled:opacity-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            {activeTab === 'bank' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.bankName', 'Bank Name')}</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.bankName}
                      onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.holderName', 'Holder Name')}</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.accountHolderName}
                      onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                      placeholder="Name as in Bank"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.accountNo', 'Account Number')}</label>
                  <input
                    type="password"
                    required
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder={editingId ? '••••••••••••' : 'Enter complete account number'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition font-mono"
                  />
                  {editingId && <p className="text-xs text-amber-500 mt-1">{t('payout.editBankHint', 'Leave or enter new value to overwrite')}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.ifsc', 'IFSC Code')}</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.ifscCode}
                    onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition font-mono uppercase"
                  />
                </div>
              </div>
            )}

            {activeTab === 'upi' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.upiId', 'UPI ID')}</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. name@upi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition font-mono"
                  />
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.qrFile', 'Upload QR Code Image')}</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-500 transition relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) handleQrUpload(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {qrPreview ? (
                      <div className="flex flex-col items-center">
                        <img src={qrPreview} alt="QR Code Preview" className="w-32 h-32 object-contain rounded-lg border bg-white mb-2" />
                        <span className="text-xs text-indigo-600 font-semibold">{t('payout.replaceQr', 'Click to replace image')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <HiQrCode className="w-10 h-10 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">{t('payout.dragQr', 'Choose photo or drag here')}</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.qrProvider', 'Provider Name (Optional)')}</label>
                  <input
                    type="text"
                    value={qrProviderName}
                    onChange={e => setQrProviderName(e.target.value)}
                    placeholder="e.g. GPay, PhonePe, Paytm"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Default method toggle */}
            <div className="flex items-center gap-2.5 py-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                className="w-4.5 h-4.5 border-slate-300 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isDefault" className="text-xs font-semibold text-slate-600 select-none">
                {t('payout.makeDefault', 'Set as default payout method')}
              </label>
            </div>

            {/* Verification & Submit Button */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('payout.phoneConfirm', 'Send Verification SMS Code to:')}</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    disabled={!!user?.phone}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={sendingOtp || (activeTab === 'qr' && !qrPreview)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-sm transition-all disabled:opacity-50 flex items-center gap-2.5 shrink-0"
                  >
                    {sendingOtp ? t('payout.sending', 'Sending...') : t('payout.verifyAndSave', 'Verify & Save')}
                    <HiArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {!user?.phone && (
                  <p className="text-xs text-indigo-500 mt-1.5 flex items-center gap-1.5">
                    <HiLockClosed className="w-3.5 h-3.5" />
                    {t('payout.phoneUpdateAlert', 'Ensure this matches your phone to verify successfully')}
                  </p>
                )}
              </div>
              
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  {t('common.cancel', 'Cancel Edit')}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Saved Methods */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg">
            <h3 className="text-lg font-bold mb-1.5 flex items-center gap-2">
              <HiShieldCheck className="w-5 h-5 text-indigo-400" />
              {t('payout.savedHeader', 'Payout Destinations')}
            </h3>
            <p className="text-xs text-slate-400 mb-6">{t('payout.savedCountDesc', 'Manage default options for automated withdrawal approvals')}</p>

            <div className="space-y-3">
              {payoutMethods.length > 0 ? (
                payoutMethods.map(method => (
                  <div
                    key={method._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      method.isDefault
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-slate-100 shadow-xs'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {method.type === 'bank' && <HiCreditCard className="w-5 h-5 text-indigo-400" />}
                        {method.type === 'upi' && <HiShieldCheck className="w-5 h-5 text-teal-400" />}
                        {method.type === 'qr' && <HiQrCode className="w-5 h-5 text-amber-400" />}
                        <span className="font-bold text-xs uppercase tracking-wide">
                          {method.type === 'bank' ? t('payout.bank', 'Bank') : method.type === 'upi' ? t('payout.upi', 'UPI') : t('payout.qr', 'QR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {!method.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(method._id)}
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
                            title={t('payout.setDefault', 'Set as Default')}
                          >
                            <HiCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditClick(method)}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-indigo-400 transition"
                          title={t('common.edit', 'Edit')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(method._id)}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 transition"
                          title={t('common.delete', 'Delete')}
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs space-y-1 font-mono text-slate-300">
                      {method.type === 'bank' && (
                        <>
                          <p className="font-semibold text-slate-100 font-sans">{method.bankDetails?.accountHolderName}</p>
                          <p>{method.bankDetails?.bankName}</p>
                          <p className="text-indigo-200">{method.bankDetails?.accountNumber}</p>
                          <p className="text-slate-400">IFSC: {method.bankDetails?.ifscCode}</p>
                        </>
                      )}
                      {method.type === 'upi' && (
                        <p className="text-teal-200">{method.upiId}</p>
                      )}
                      {method.type === 'qr' && (
                        <div>
                          {method.providerName && <p className="font-sans font-semibold text-amber-200">{method.providerName}</p>}
                          <a href={method.qrCodeImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:underline mt-1 font-sans">
                            <HiQrCode className="w-3.5 h-3.5" />
                            {t('payout.viewQr', 'View QR Image')}
                          </a>
                        </div>
                      )}
                    </div>

                    {method.isDefault && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold tracking-wider uppercase font-sans">
                        <HiCheckCircle className="w-3.5 h-3.5" />
                        {t('payout.defaultBadge', 'Default')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <HiCreditCard className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">{t('payout.noSaved', 'No payout methods added yet.')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center animate-scaleUp">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiShieldCheck className="w-7 h-7" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('payout.otpTitle', 'Verify Identity')}</h3>
            <p className="text-xs text-slate-500 mb-6 px-4">
              {t('payout.otpDesc', 'Enter the 6-digit security code sent to')} <span className="font-bold text-slate-700 font-mono">{phone}</span>
            </p>

            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-extrabold font-mono tracking-[0.6em] focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSavePayoutMethod}
                  disabled={saving || otp.length !== 6}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {saving ? t('payout.savingStatus', 'Saving...') : t('payout.confirmBtn', 'Confirm Code')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                className="inline-block text-xs font-bold text-indigo-600 hover:underline mt-2"
              >
                {t('payout.resend', 'Resend Code')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutSettings;
