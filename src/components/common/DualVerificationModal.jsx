import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiSmartphone, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const DualVerificationModal = ({ isOpen, onClose, recruiterData }) => {
  const { saveUserSession } = useAuth();
  const navigate = useNavigate();

  // Steps: 1 = Email OTP Send, 2 = Email OTP Verify, 3 = Phone OTP Send, 4 = Phone OTP Verify, 5 = Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [emailOtp, setEmailOtp] = useState('');
  const [guestToken, setGuestToken] = useState('');

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [accountExistsError, setAccountExistsError] = useState(false);

  const [phoneOtp, setPhoneOtp] = useState('');

  const [localPhone, setLocalPhone] = useState(recruiterData?.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [country, setCountry] = useState(recruiterData?.country || '');
  const [stateName, setStateName] = useState(recruiterData?.state || '');
  const [city, setCity] = useState(recruiterData?.city || '');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleAutoFillLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        if (data && data.address) {
          setCountry(data.address.country || '');
          setStateName(data.address.state || data.address.region || '');
          setCity(data.address.city || data.address.town || data.address.village || data.address.county || '');
          toast.success('Location detected successfully!');
        } else {
          toast.error('Could not detect exact location');
        }
      } catch (err) {
        toast.error('Error fetching location data');
      } finally {
        setLoadingLocation(false);
      }
    }, () => {
      setLoadingLocation(false);
      toast.error('Location access denied or unavailable');
    });
  };

  useEffect(() => {
    if (recruiterData?.phone && !localPhone) {
      setLocalPhone(recruiterData.phone);
    }
  }, [recruiterData]);

  useEffect(() => {
    if (isOpen) {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha resolved');
          },
          'expired-callback': () => {
            toast.error('Recaptcha expired, please try again.');
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        });
        // Pre-render to make sending faster
        window.recaptchaVerifier.render().catch(console.error);
      }
    } else {
      // Clean up when modal closes
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [isOpen]);

  const handleSendEmailOtp = async () => {
    setLoading(true);
    setAccountExistsError(false);
    try {
      const { data } = await api.post('/jobs/recruiter-discovery/send-email-otp', {
        email: recruiterData.email
      });
      if (data.success) {
        setGuestToken(data.guestToken);
        setStep(2);
        toast.success(data.message || 'OTP sent to email');
        if (data.devMode && data.otp) {
          console.log('Dev Mode OTP:', data.otp);
        }
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.accountExists) {
        setAccountExistsError(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to send OTP to email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtp.length !== 6) return toast.error('Enter 6-digit OTP');
    setStep(3); 
    toast.success('Email OTP recorded. Now verify your phone.');
  };

  const handleSendPhoneOtp = async () => {
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = localPhone.startsWith('+') 
        ? '+' + localPhone.replace(/\D/g, '') 
        : `+91${localPhone.replace(/\D/g, '')}`;
      
      const confResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confResult);
      setStep(4);
      setIsEditingPhone(false);
      toast.success('OTP sent to phone');
    } catch (err) {
      console.error('Send Phone OTP Error:', err);
      toast.error('Failed to send OTP to phone. Format must be +CountryCode');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDual = async () => {
    if (phoneOtp.length !== 6) return toast.error('Enter 6-digit phone OTP');
    setLoading(true);

    try {
      // 1. Verify Phone OTP locally with Firebase
      const result = await confirmationResult.confirm(phoneOtp);
      const firebaseToken = await result.user.getIdToken();

      // 2. Call backend with everything
      const payload = {
        guestToken,
        emailOtp,
        firebaseToken,
        name: recruiterData.name,
        companyName: recruiterData.companyName,
        email: recruiterData.email,
        phone: localPhone,
        password: recruiterData.password,
        industry: recruiterData.industry,
        country,
        state: stateName,
        city
      };

      const { data } = await api.post('/jobs/recruiter-discovery/verify-dual', payload);

      if (data.success) {
        saveUserSession({ token: data.token, user: data.user });
        setStep(5);
        setTimeout(() => {
          navigate('/recruiter/dashboard');
        }, 1500);
      } else {
        toast.error(data.message || 'Verification failed');
      }

    } catch (err) {
      console.error('Dual Verify Error:', err);
      toast.error(err.response?.data?.message || 'Invalid Phone OTP or Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FiX className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Account</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Please verify your email and phone number to unlock full access to candidates.
        </p>

        {/* STEP 1: Email Send */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
              <FiMail className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-semibold text-purple-900">Verify Email</h4>
                <p className="text-sm text-purple-700">{recruiterData.email}</p>
              </div>
            </div>

            {accountExistsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-center">
                <p className="font-medium mb-2 text-sm">Account already exists!</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition text-sm w-full"
                >
                  Login to Continue
                </button>
              </div>
            )}

            <div className={`bg-gray-50 p-4 rounded-xl border border-gray-200 ${accountExistsError ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-800 text-sm">Location Details</h4>
                <button
                  type="button"
                  onClick={handleAutoFillLocation}
                  disabled={loadingLocation}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1 transition"
                >
                  {loadingLocation ? 'Detecting...' : '📍 Auto Detect'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full text-sm p-2 border rounded-md outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. India" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">State</label>
                  <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} className="w-full text-sm p-2 border rounded-md outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. Karnataka" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full text-sm p-2 border rounded-md outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. Bangalore" />
              </div>
            </div>

            <button
              onClick={handleSendEmailOtp}
              disabled={loading || !country || !stateName || !city || accountExistsError}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? 'Sending...' : 'Send Email Code'}
            </button>
          </div>
        )}

        {/* STEP 2: Email Verify */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">Enter Email Code</h4>
              <p className="text-sm text-gray-500">Sent to {recruiterData.email}</p>
            </div>
            <input
              type="text"
              maxLength="6"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-widest py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
            />
            <button
              onClick={handleVerifyEmailOtp}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 3: Phone Send */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold text-green-900">Email Verified</h4>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <FiSmartphone className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-purple-900">Verify Phone</h4>
                  {isEditingPhone ? (
                    <input
                      type="text"
                      value={localPhone}
                      onChange={(e) => setLocalPhone(e.target.value)}
                      className="mt-1 w-full px-2 py-1 text-sm border rounded outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="+91..."
                    />
                  ) : (
                    <p className="text-sm text-purple-700">{localPhone}</p>
                  )}
                </div>
              </div>
              {!isEditingPhone ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="text-xs text-purple-600 font-semibold hover:underline"
                >
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="text-xs text-purple-600 font-semibold hover:underline"
                >
                  Done
                </button>
              )}
            </div>
            <button
              onClick={handleSendPhoneOtp}
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Phone Code'}
            </button>
          </div>
        )}

        {/* STEP 4: Phone Verify */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900">Enter Phone Code</h4>
              <p className="text-sm text-gray-500">Sent to {localPhone}</p>
            </div>
            <input
              type="text"
              maxLength="6"
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-widest py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
            />
            <button
              onClick={handleVerifyDual}
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Unlock Account'}
            </button>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Account Verified!</h3>
            <p className="text-gray-500">Redirecting to your workspace...</p>
          </div>
        )}

      </div>
      
      {/* Hidden Recaptcha container rendered unconditionally */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default DualVerificationModal;
