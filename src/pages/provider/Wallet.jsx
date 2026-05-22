import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providerWalletAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  HiCurrencyRupee, HiArrowUp, HiArrowDown, HiClock, HiCheckCircle, HiExclamationCircle, 
  HiInformationCircle, HiPlusCircle, HiArrowRight, HiDocumentReport, HiOutlineSparkles, HiCog 
} from 'react-icons/hi';
import useTranslation from '../../hooks/useTranslation';

const Wallet = () => {
  const { t } = useTranslation();
  
  const [wallet, setWallet] = useState(null);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [config, setConfig] = useState({ minWithdrawalAmount: 500, fixedWithdrawalFee: 0 });
  const [loading, setLoading] = useState(true);
  
  // Withdrawal Form Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const { data } = await providerWalletAPI.getWallet();
      setWallet(data.wallet || null);
      setPayoutMethods(data.payoutMethods || []);
      setTransactions(data.transactions || []);
      setConfig(data.config || { minWithdrawalAmount: 500, fixedWithdrawalFee: 0 });
      
      // Auto-select default payout method
      const defaultMethod = data.payoutMethods?.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedPayoutMethodId(defaultMethod._id);
      } else if (data.payoutMethods?.length > 0) {
        setSelectedPayoutMethodId(data.payoutMethods[0]._id);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('wallet.loadFail', 'Failed to load wallet dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    
    if (!numericAmount || numericAmount <= 0) {
      toast.error(t('wallet.invalidAmount', 'Please enter a valid withdrawal amount'));
      return;
    }

    if (numericAmount < config.minWithdrawalAmount) {
      toast.error(`${t('wallet.minLimitError', 'Minimum withdrawal amount is')} ₹${config.minWithdrawalAmount}`);
      return;
    }

    if (numericAmount > (wallet?.availableBalance || 0)) {
      toast.error(t('wallet.insufficient', 'Insufficient available balance'));
      return;
    }

    if (!selectedPayoutMethodId) {
      toast.error(t('wallet.selectPayout', 'Please select a payout method'));
      return;
    }

    try {
      setSubmittingWithdraw(true);
      const { data } = await providerWalletAPI.requestWithdrawal({
        amount: numericAmount,
        payoutMethodId: selectedPayoutMethodId
      });
      toast.success(t('wallet.withdrawSuccess', 'Withdrawal request submitted successfully!'));
      setShowWithdrawModal(false);
      setAmount('');
      // Refresh wallet dashboard
      await fetchWalletData();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('wallet.withdrawFail', 'Failed to submit withdrawal request'));
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const defaultMethod = payoutMethods.find(m => m._id === selectedPayoutMethodId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner and Quick Actions */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              {t('wallet.liveStatus', 'Wallet & Balance')}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('wallet.title', 'Earnings Ledger')}</h1>
            <p className="text-slate-400 mt-1 max-w-lg text-sm">
              {t('wallet.subtitle', 'Track your income share, platform fees, and withdrawal histories securely.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/provider/payout-settings" 
              className="px-5 py-3 border border-white/10 hover:border-white/20 bg-white/5 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all flex items-center gap-2"
            >
              <HiCog className="w-4 h-4 text-slate-400" />
              {t('wallet.managePayouts', 'Payout Methods')}
            </Link>
            <button
              onClick={() => {
                if (payoutMethods.length === 0) {
                  toast.error(t('wallet.addPayoutFirst', 'Please add a Payout Method first!'));
                } else {
                  setShowWithdrawModal(true);
                }
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              <HiCurrencyRupee className="w-5 h-5 text-indigo-200" />
              {t('wallet.withdrawBtn', 'Withdraw Money')}
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          { label: t('wallet.totalEarnings', 'Total Earnings'), value: wallet?.totalEarnings || 0, color: 'from-blue-600 to-indigo-600', icon: HiArrowUp, desc: t('wallet.totalEarnedDesc', 'Provider earnings credited') },
          { label: t('wallet.availableBalance', 'Available Balance'), value: wallet?.availableBalance || 0, color: 'from-emerald-600 to-teal-600', icon: HiCheckCircle, desc: t('wallet.availDesc', 'Ready to withdraw instantly') },
          { label: t('wallet.pendingBalance', 'Pending Balance'), value: wallet?.pendingBalance || 0, color: 'from-amber-600 to-orange-600', icon: HiClock, desc: t('wallet.pendingDesc', 'Locked in withdrawal process') },
          { label: t('wallet.withdrawnAmount', 'Withdrawn Amount'), value: wallet?.withdrawnAmount || 0, color: 'from-slate-600 to-slate-800', icon: HiArrowDown, desc: t('wallet.withdrawnDesc', 'Successfully paid out') },
          { label: t('wallet.feesDeducted', 'Commission Paid'), value: wallet?.commissionDeducted || 0, color: 'from-rose-600 to-red-700', icon: HiExclamationCircle, desc: t('wallet.feeDesc', 'Platform commission share') }
        ].map((card, idx) => (
          <div key={idx} className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 shadow-xs hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${card.color} text-white flex items-center justify-center`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">₹{card.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ledger & Transactions: 2 Columns */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><HiDocumentReport className="w-5 h-5" /></span>
                {t('wallet.transactionsHeader', 'Transaction Ledger')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{t('wallet.transactionsDesc', 'List of all system updates, earning splits, and withdrawal processing logs')}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
                  <th className="py-3 px-2 uppercase">{t('wallet.txnId', 'Txn Details')}</th>
                  <th className="py-3 px-2 uppercase">{t('wallet.txnType', 'Type')}</th>
                  <th className="py-3 px-2 uppercase">{t('wallet.txnAmount', 'Amount')}</th>
                  <th className="py-3 px-2 uppercase">{t('wallet.txnStatus', 'Status')}</th>
                  <th className="py-3 px-2 uppercase">{t('wallet.txnDate', 'Date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.length > 0 ? (
                  transactions.map(txn => (
                    <tr key={txn._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-semibold text-slate-800">{txn.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {txn._id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] ${
                          txn.type === 'earning' ? 'bg-indigo-50 text-indigo-700' :
                          txn.type === 'withdrawal' ? 'bg-orange-50 text-orange-700' :
                          txn.type === 'commission' ? 'bg-red-50 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-mono font-bold text-slate-900">
                        {txn.status === 'credited' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                          txn.status === 'credited' ? 'bg-emerald-50 text-emerald-700' :
                          txn.status === 'debited' ? 'bg-slate-100 text-slate-700' :
                          txn.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            txn.status === 'credited' ? 'bg-emerald-500' :
                            txn.status === 'debited' ? 'bg-slate-500' :
                            txn.status === 'pending' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} />
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-slate-400">
                        {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <HiInformationCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">{t('wallet.noTxn', 'No wallet transactions found.')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic withdrawal limits card */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-400">
              <HiInformationCircle className="w-5 h-5 text-indigo-400" />
              {t('wallet.rulesHeader', 'Withdrawal Rules')}
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">{t('wallet.minLimit', 'Minimum Payout Threshold')}</span>
                <span className="font-bold text-slate-200">₹{config.minWithdrawalAmount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">{t('wallet.withdrawalFee', 'Fixed Payout Fee')}</span>
                <span className="font-bold text-slate-200">
                  {config.fixedWithdrawalFee > 0 ? `₹${config.fixedWithdrawalFee}` : t('wallet.freeFee', '₹0.00 (Free)')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">{t('wallet.processingDuration', 'Admin Review Window')}</span>
                <span className="font-bold text-slate-200">{t('wallet.reviewTime', '24 - 48 Hours')}</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <strong>{t('wallet.notefromadmin', 'Note:')}</strong> {t('wallet.rulesDesc', 'Ensure that at least one payout method has been registered and verified with an OTP under Payout Settings. Unverified attempts are blocked.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WITHDRAW MONEY MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 animate-scaleUp">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-50 text-indigo-600"><HiCurrencyRupee className="w-5 h-5" /></span>
              {t('wallet.withdrawalRequest', 'Submit Withdrawal')}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {t('wallet.withdrawPrompt', 'Enter the amount you would like to transfer. This amount will be locked until the request is paid.')}
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('wallet.withdrawAmountLabel', 'Withdrawal Amount')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min={config.minWithdrawalAmount}
                    max={wallet?.availableBalance}
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`e.g. ${config.minWithdrawalAmount}`}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-base font-bold focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px]">
                  <span className="text-slate-400">{t('wallet.availLimit', 'Available:')} <strong className="text-slate-600">₹{wallet?.availableBalance}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setAmount(String(wallet?.availableBalance))}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    {t('wallet.maxBtn', 'Withdraw Maximum')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('wallet.selectPayoutLabel', 'Select Payout Destination')}</label>
                <select
                  required
                  value={selectedPayoutMethodId}
                  onChange={e => setSelectedPayoutMethodId(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                >
                  <option value="" disabled>{t('wallet.selectOne', 'Choose saved payout method')}</option>
                  {payoutMethods.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.type === 'bank' ? `${m.bankDetails?.bankName} (••• ${m.bankDetails?.accountNumber?.slice(-4)})` : m.type === 'upi' ? `UPI - ${m.upiId}` : `QR Code - ${m.providerName || 'Online'}`} {m.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {defaultMethod && (
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-1">
                  <p className="font-bold text-indigo-900 uppercase tracking-wide text-[9px] mb-1">{t('wallet.methodPreview', 'Payout Destination Summary')}</p>
                  {defaultMethod.type === 'bank' && (
                    <>
                      <p className="font-bold text-slate-800">{defaultMethod.bankDetails?.accountHolderName}</p>
                      <p className="text-slate-600">{defaultMethod.bankDetails?.bankName} • Account ending in {defaultMethod.bankDetails?.accountNumber?.slice(-4)}</p>
                    </>
                  )}
                  {defaultMethod.type === 'upi' && <p className="text-slate-800 font-semibold">{defaultMethod.upiId}</p>}
                  {defaultMethod.type === 'qr' && <p className="text-slate-800 font-semibold">QR Code {defaultMethod.providerName ? `(${defaultMethod.providerName})` : ''}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdraw || !amount || Number(amount) < config.minWithdrawalAmount}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingWithdraw ? t('wallet.submitting', 'Submitting...') : t('wallet.confirmWithdraw', 'Confirm Payout')}
                  <HiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
