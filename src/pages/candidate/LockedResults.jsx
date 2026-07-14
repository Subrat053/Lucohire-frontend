import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiStar, FiTrendingUp, FiBriefcase, FiPhone } from 'react-icons/fi';
import { BiBuildingHouse } from 'react-icons/bi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const LockedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [phoneState, setPhoneState] = useState('');
  const [step, setStep] = useState(1); // 1: Ask Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [realScore, setRealScore] = useState(null);
  const [realJobs, setRealJobs] = useState([]);
  const { saveUserSession } = useAuth();
  const [confirmationResult, setConfirmationResult] = useState(null);

  const { formData } = location.state || {};

  useEffect(() => {
    if (formData?.phone) {
      setPhoneState(formData.phone);
    }
  }, [formData]);

  const handleInterceptClick = (e) => {
    if (!isVerified) {
      e.preventDefault();
      e.stopPropagation();
      setShowOtpModal(true);
    }
  };

  useEffect(() => {
    if (showOtpModal) {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-guest', {
          size: 'invisible',
          callback: () => {},
        });
        window.recaptchaVerifier.render().catch(console.error);
      }
    } else {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [showOtpModal]);

  const handlePhoneSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!phoneState) {
      return toast.error('Please enter a valid phone number');
    }

    setLoading(true);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-guest', { size: 'invisible' });
      }
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneState.startsWith('+') 
        ? '+' + phoneState.replace(/\D/g, '') 
        : `+91${phoneState.replace(/\D/g, '')}`;
      
      const confResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confResult);
      setStep(2);
      toast.success('OTP sent successfully');
    } catch (err) {
      console.error('Send OTP Error:', err);
      toast.error('Failed to send OTP. Try again or format with +CountryCode');
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    
    if (otp.length !== 6) {
      return toast.error('Enter 6-digit OTP');
    }

    if (!confirmationResult) {
      return toast.error('Please send OTP first');
    }

    setLoading(true);

    try {
      // 1. Verify with Firebase
      const result = await confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();

      // 2. Verify with our backend and create user
      const verifyResponse = await api.post('/jobs/guest-firebase/verify', {
        firebaseToken,
        ...formData, // send password, name, email, skills, experience from GuestDiscovery
      });

      if (verifyResponse.data?.success) {
        toast.success('Phone verified successfully!');
        
        // Log the user in with the received token and user object
        if (verifyResponse.data.token && verifyResponse.data.user) {
          saveUserSession({
            token: verifyResponse.data.token,
            user: verifyResponse.data.user
          });
        }

        setIsVerified(true);
        setShowOtpModal(false);

        // Fetch real personalized jobs
        try {
          // Since we might have logged them in, it could use their auth token
          // Or we can just use the guest-recommended endpoint with their skills
          const response = await api.post('/jobs/guest-recommended', {
            skills: formData?.skills || '',
          });

          if (response.data?.success) {
            setRealScore(response.data.data.score);
            setRealJobs(response.data.data.jobs);
          }
        } catch (err) {
          console.error('Backend Recommendation Error:', err);
          toast.error('Could not fetch personalized jobs. Showing popular ones.');
        }
      }
    } catch (err) {
      console.error('OTP Verify Error:', err);
      toast.error(
        err.response?.data?.message || err.message || 'OTP verification failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (step === 2 && otp.length === 6) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center">
          &larr; Back to Discovery
        </button>
      </div>

      {!isVerified && (
        <div className="w-full max-w-5xl bg-blue-600 rounded-lg p-6 mb-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between relative z-20">
          <div className="flex items-center mb-4 md:mb-0">
            <FiLock className="text-3xl mr-4" />
            <div>
              <h2 className="text-xl font-bold">Verify your mobile number to unlock your full analytics and matching jobs.</h2>
            </div>
          </div>
          <button 
            onClick={() => setShowOtpModal(true)}
            className="bg-white text-blue-600 font-bold py-2 px-6 rounded-md hover:bg-gray-100 transition shadow"
          >
            Verify with OTP
          </button>
        </div>
      )}

      {isVerified && (
        <div className="w-full max-w-5xl bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-green-800 flex items-center">
          <FiCheckCircle className="text-3xl mr-4 text-green-600" />
          <h2 className="text-xl font-bold">You&apos;re Verified! Here are your top matching jobs.</h2>
        </div>
      )}

      {/* Main Content Area - Click intercepted if not verified */}
      <div 
        className="w-full max-w-5xl relative" 
        onClickCapture={handleInterceptClick}
      >
        {/* Score Section */}
        <div className="bg-white shadow rounded-lg p-8 mb-6 flex flex-col md:flex-row items-center justify-between border border-gray-100">
          <div className="flex items-center">
            <div className="relative w-32 h-32 flex items-center justify-center mr-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-green-500" strokeWidth="3" strokeDasharray="78, 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-gray-800">{isVerified ? realScore || 85 : 78}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Resume Match Score</h3>
              <p className="text-gray-500">{isVerified ? 'Excellent Match' : 'Good Match'}</p>
            </div>
          </div>
        </div>

        {/* Analytics Section (Blurred) */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Profile Analytics</h3>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-500 ${!isVerified ? 'blur-sm select-none' : ''}`}>
          {[
            { title: 'Skills Match', icon: <FiStar />, value: 'High' },
            { title: 'Experience Match', icon: <FiBriefcase />, value: 'Medium' },
            { title: 'Industry Fit', icon: <BiBuildingHouse />, value: 'Excellent' },
            { title: 'Profile Strength', icon: <FiTrendingUp />, value: '85/100' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="text-blue-500 text-2xl mb-3">{item.icon}</div>
              <h4 className="text-gray-500 text-sm font-medium mb-1">{item.title}</h4>
              <p className="text-gray-900 font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Jobs Section (Blurred) */}
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-gray-900">Top Matching Jobs for You</h3>
          {!isVerified && <span className="text-sm text-gray-500 flex items-center"><FiLock className="mr-1" /> Unlock to view details</span>}
        </div>
        
        <div className={`space-y-4 transition-all duration-500 ${!isVerified ? 'blur-sm select-none pointer-events-none' : ''}`}>
          {isVerified && realJobs.length > 0 ? (
            realJobs.map((job, idx) => (
              <div key={job._id || idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                      {job.recruiter?.companyName?.charAt(0) || job.title?.charAt(0) || 'J'}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{job.title}</h4>
                      <p className="text-gray-500">{job.recruiter?.companyName || 'Confidential'} &bull; {job.city || 'Remote'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm mb-2">{job.matchScore || 90}% Match</span>
                    <button onClick={() => navigate('/provider/dashboard')} className="text-blue-600 border border-blue-600 hover:bg-blue-50 font-medium px-4 py-2 rounded-md transition">
                      Go to Dashboard
                    </button>
                  </div>
                </div>
                
                {/* Blurred AI Insights CTA */}
                <div className="mt-4 pt-4 border-t border-gray-100 relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                  <div className="filter blur-[4px] select-none pointer-events-none opacity-50 space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-200 rounded-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="flex gap-2 mt-2">
                      <div className="h-6 w-20 bg-emerald-100 rounded-full"></div>
                      <div className="h-6 w-24 bg-blue-100 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/40 backdrop-blur-[1px]">
                    <p className="text-sm font-bold text-gray-800 mb-2 drop-shadow-sm flex items-center gap-2">
                      <FiLock className="w-4 h-4 text-indigo-600" /> Unlock AI Job Insights
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/provider/plans'); }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-5 rounded-full transition-colors shadow-md flex items-center gap-1.5"
                    >
                      View Premium Plans
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            ['Deloitte', 'TCS', 'Infosys'].map((company, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 font-bold text-xl mr-4">
                      {company.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Senior Frontend Developer</h4>
                      <p className="text-gray-500">{company} &bull; Remote &bull; Full-time</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm mb-2">90% Match</span>
                    <button className="text-blue-600 border border-blue-600 hover:bg-blue-50 font-medium px-4 py-2 rounded-md transition">
                      View Job
                    </button>
                  </div>
                </div>
                
                {/* Blurred AI Insights CTA */}
                <div className="mt-4 pt-4 border-t border-gray-100 relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                  <div className="filter blur-[4px] select-none pointer-events-none opacity-50 space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-200 rounded-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="flex gap-2 mt-2">
                      <div className="h-6 w-20 bg-emerald-100 rounded-full"></div>
                      <div className="h-6 w-24 bg-blue-100 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/40 backdrop-blur-[1px]">
                    <p className="text-sm font-bold text-gray-800 mb-2 drop-shadow-sm flex items-center gap-2">
                      <FiLock className="w-4 h-4 text-indigo-600" /> Unlock AI Job Insights
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/provider/plans'); }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-5 rounded-full transition-colors shadow-md flex items-center gap-1.5"
                    >
                      View Premium Plans
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && !isVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div id="recaptcha-container-guest"></div>
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
            <button 
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-6">
                <FiLock className="text-blue-600 text-3xl" />
              </div>
              
              {step === 1 ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock Matching Jobs</h2>
                  <p className="text-gray-500 mb-6">Confirm your mobile number to receive an OTP.</p>
                  
                  <form onSubmit={handlePhoneSubmit} className="w-full">
                    <div className="mb-6 text-left relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input 
                        type="text"
                        value={phoneState}
                        onChange={(e) => setPhoneState(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        required
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={loading || !phoneState}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md disabled:opacity-50 flex justify-center items-center"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify to Unlock</h2>
                  <p className="text-gray-500 mb-6">Enter the OTP sent to <span className="font-semibold text-gray-800">{phoneState}</span></p>
                  
                  <div className="flex justify-center mb-6 w-full">
                    <input
                      className="w-full h-14 px-4 border-2 rounded-lg bg-gray-50 text-center text-3xl tracking-[0.5em] font-bold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 placeholder:tracking-normal"
                      type="text"
                      inputMode="numeric"
                      name="otp"
                      placeholder="------"
                      maxLength="6"
                      value={otp}
                      onChange={handleOtpChange}
                      autoFocus
                    />
                  </div>

                  <p className="text-sm text-gray-500 mb-6">
                    Didn&apos;t receive the code?{' '}
                    <button 
                      type="button"
                      onClick={handlePhoneSubmit} 
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                  
                  <button 
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & View Jobs'}
                  </button>
                </>
              )}
            </div>
            
            <div id="recaptcha-container-guest"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LockedResults;
