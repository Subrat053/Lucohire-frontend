import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  HiMail,
  HiPhone,
  HiUser,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiShieldCheck,
  HiCheckCircle,
  HiLocationMarker,
  HiArrowLeft,
} from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import {
  FaRocket,
  FaFacebook,
  FaApple,
  FaLinkedin,
  FaStar,
  FaWhatsapp,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useGoogleLogin } from "@react-oauth/google";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";

/* keep all your existing illustration / small components same */
/* ═══════════════════════════ ILLUSTRATIONS ═══════════════════════════ */
const PersonAtLaptop = () => (
  <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs drop-shadow-2xl">
    {/* Desk */}
    <rect x="30" y="228" width="260" height="12" rx="6" fill="white" fillOpacity="0.25" />
    {/* Laptop base */}
    <rect x="85" y="196" width="150" height="36" rx="6" fill="white" fillOpacity="0.35" />
    <rect x="88" y="198" width="144" height="32" rx="4" fill="white" fillOpacity="0.15" />
    {/* Laptop screen */}
    <rect x="82" y="128" width="156" height="72" rx="6" fill="white" fillOpacity="0.2" />
    <rect x="86" y="132" width="148" height="64" rx="4" fill="#1e40af" fillOpacity="0.6" />
    {/* Screen glow lines */}
    <rect x="96" y="142" width="70" height="5" rx="2.5" fill="white" fillOpacity="0.7" />
    <rect x="96" y="152" width="50" height="4" rx="2" fill="white" fillOpacity="0.5" />
    <rect x="96" y="161" width="88" height="4" rx="2" fill="white" fillOpacity="0.4" />
    <rect x="96" y="170" width="40" height="4" rx="2" fill="white" fillOpacity="0.3" />
    {/* Screen cursor blink */}
    <rect x="96" y="178" width="3" height="10" rx="1.5" fill="white" fillOpacity="0.8" />
    {/* Body */}
    <rect x="122" y="96" width="76" height="96" rx="12" fill="#fde68a" />
    {/* Shirt collar */}
    <rect x="132" y="96" width="56" height="18" rx="4" fill="#3b82f6" />
    {/* Head */}
    <circle cx="160" cy="76" r="34" fill="#fde68a" />
    {/* Hair */}
    <path d="M126 64 Q160 36 194 64 Q188 46 160 42 Q132 46 126 64Z" fill="#1e293b" />
    {/* Eyes */}
    <circle cx="148" cy="72" r="4.5" fill="#1e293b" />
    <circle cx="172" cy="72" r="4.5" fill="#1e293b" />
    <circle cx="149.5" cy="71" r="1.5" fill="white" />
    <circle cx="173.5" cy="71" r="1.5" fill="white" />
    {/* Eyebrows */}
    <path d="M143 65 Q148 62 153 65" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M167 65 Q172 62 177 65" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Smile */}
    <path d="M150 84 Q160 93 170 84" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Left arm */}
    <path d="M122 108 Q90 130 96 175" stroke="#fde68a" strokeWidth="18" strokeLinecap="round" fill="none" />
    {/* Right arm */}
    <path d="M198 108 Q230 130 224 175" stroke="#fde68a" strokeWidth="18" strokeLinecap="round" fill="none" />
    {/* Hands on keyboard */}
    <ellipse cx="96" cy="210" rx="14" ry="8" fill="#fde68a" />
    <ellipse cx="224" cy="210" rx="14" ry="8" fill="#fde68a" />
    {/* Plant pot decoration */}
    <ellipse cx="54" cy="245" rx="18" ry="6" fill="white" fillOpacity="0.2" />
    <rect x="46" y="228" width="16" height="18" rx="3" fill="white" fillOpacity="0.3" />
    <path d="M54 228 Q46 210 36 200" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="34" cy="198" rx="8" ry="6" fill="#4ade80" fillOpacity="0.8" />
    <path d="M54 224 Q62 206 72 198" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="74" cy="196" rx="8" ry="6" fill="#4ade80" fillOpacity="0.8" />
    <path d="M54 220 Q54 200 54 185" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="54" cy="183" r="7" fill="#4ade80" fillOpacity="0.8" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 drop-shadow-xl">
    <path d="M40 8 L68 20 L68 44 Q68 60 40 72 Q12 60 12 44 L12 20 Z" fill="white" fillOpacity="0.25" stroke="white" strokeOpacity="0.6" strokeWidth="2" />
    <path d="M28 40 L36 48 L52 32" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ═══════════════════════════ FLOATING BADGES ═══════════════════════════ */
const FloatingBadge = ({ icon: Icon, label, color, className }) => (
  <div className={`absolute flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow-xl text-xs font-semibold pointer-events-none select-none ${className}`}>
    <Icon className={`w-4 h-4 ${color}`} />
    <span className="text-gray-700">{label}</span>
  </div>
);

const FloatingSocialChip = ({ icon: Icon, color, style }) => (
  <div className="absolute w-11 h-11 bg-white rounded-full shadow-xl flex items-center justify-center pointer-events-none animate-float" style={style}>
    <Icon className={`w-6 h-6 ${color}`} />
  </div>
);

/* ═══════════════════════════ DECORATIVE ARROW ═══════════════════════════ */
const DashedArrow = ({ color = '#fff', className, rotate = 0 }) => (
  <svg className={`absolute pointer-events-none ${className}`} width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ transform: `rotate(${rotate}deg)`, opacity: 0.55 }}>
    <path d="M8 48 Q28 8 48 28" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4" />
    <polygon points="44,22 50,32 40,30" fill={color} />
  </svg>
);

/* ═══════════════════════════ STAR RATING ═══════════════════════════ */
const StarRating = () => (
  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30">
    {[1, 2, 3, 4, 5].map(i => <FaStar key={i} className="w-3.5 h-3.5 text-yellow-300" />)}
    <span className="text-white text-xs font-semibold ml-1">4.9 / 5K+ users</span>
  </div>
);

/* ═══════════════════════════ LEFT PANEL ═══════════════════════════ */
/* IMPORTANT:
   From your existing file, keep these components unchanged:
   PersonAtLaptop
   ShieldIcon
   FloatingBadge
   FloatingSocialChip
   DashedArrow
   StarRating
   LeftPanel
   ProgressBar
   TrustRow
   GreenBtn
   BlueBtn
   Spinner
   OrLine
   PhoneField
   TextInput
   RolePicker
*/

const LeftPanel = ({ mode }) => {
  const isLogin = mode === 'login' || mode === 'whatsapp-login';
  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden rounded-l-3xl p-10 min-h-full"
      style={{ background: 'linear-gradient(145deg,#1d4ed8 0%,#4f46e5 50%,#7c3aed 100%)' }}>

      {/* Ambient orbs */}
      <div className="absolute w-64 h-64 rounded-full bg-white/10 blur-3xl" style={{ top: '-10%', left: '-15%' }} />
      <div className="absolute w-48 h-48 rounded-full bg-purple-300/20 blur-3xl" style={{ bottom: '5%', right: '-10%' }} />
      <div className="absolute w-32 h-32 rounded-full bg-blue-200/20 blur-2xl" style={{ top: '45%', left: '60%' }} />

      {/* Floating social chips */}
      <FloatingSocialChip icon={FcGoogle} color="" style={{ top: '42%', right: '8%', animationDelay: '0s' }} />
      <FloatingSocialChip icon={FaFacebook} color="text-blue-600" style={{ top: '54%', right: '19%', animationDelay: '0.3s' }} />
      <FloatingSocialChip icon={FaApple} color="text-gray-800" style={{ top: '49%', left: '6%', animationDelay: '0.6s' }} />
      <FloatingSocialChip icon={FaLinkedin} color="text-blue-500" style={{ top: '68%', right: '2%', animationDelay: '0.9s' }} />
      <FloatingSocialChip icon={FaWhatsapp} color="text-green-500" style={{ top: '65%', left: '9%', animationDelay: '1.2s' }} />

      {/* Dashed arrows */}
      <DashedArrow color="#fff" className="top-16 right-8" rotate={30} />
      <DashedArrow color="#a5f3fc" className="bottom-32 left-16" rotate={220} />

      {/* Floating trust badges */}
      <FloatingBadge icon={HiShieldCheck} label="100% Secure" color="text-green-500" className="top-6 right-6 animate-float" style={{ animationDelay: '0.5s' }} />
      <FloatingBadge icon={MdVerified} label="2-Step Verified" color="text-blue-500" className="bottom-8 right-4 animate-float" style={{ animationDelay: '1s' }} />

      {/* Top: brand */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <FaRocket className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-white font-extrabold text-2xl tracking-tight">ServiceHub</p>
            <p className="text-blue-200 text-xs">Connect. Hire. Grow.</p>
          </div>
        </div>

        <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
          {isLogin ? 'Welcome\nBack!' : 'Your Growth\nStarts Here.'}
        </h2>
        <p className="text-blue-100 text-sm leading-relaxed mb-6">
          {isLogin
            ? 'Sign in to access your dashboard, manage leads, and grow your business.'
            : 'Join thousands of service providers and recruiters building their network.'}
        </p>
        <StarRating />
      </div>

      {/* Center: illustration */}
      <div className="relative z-10 flex justify-center items-end my-4">
        <div className="relative">
          {/* <PersonAtLaptop /> */}
          {/* Shield badge overlay */}
          <img src="/laptop.png" alt="" className='h-60' />
          <div className="absolute -top-4 -right-2">
            <ShieldIcon />
          </div>
        </div>
      </div>
      {/* Bottom: stats */}
      <div className="relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: '10K+', l: 'Providers' },
            { n: '5K+', l: 'Recruiters' },
            { n: '50K+', l: 'Connections' },
          ].map(({ n, l }) => (
            <div key={l} className="text-center bg-white/15 backdrop-blur-sm rounded-2xl py-3 border border-white/20">
              <p className="text-white font-extrabold text-lg">{n}</p>
              <p className="text-blue-200 text-xs">{l}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-white/40 text-xs mt-6">© 2025 ServiceHub • All rights reserved</p>
      </div>
    </div>
  );
};
/* ═══════════════════════════ SHARED SMALL COMPONENTS ═══════════════════════════ */
const ProgressBar = ({ filled = 1, total = 2 }) => (
  <div className="flex gap-2 mt-2 mb-5">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < filled ? 'bg-blue-600' : 'bg-gray-200'}`} />
    ))}
  </div>
);

const TrustRow = () => (
  <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-6">
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h14v2H3V4zm0 5h10v2H3V9zm0 5h12v2H3v-2z" /></svg>
      </div>
      2-Step Signup
    </div>
    <div className="w-px h-7 bg-gray-200" />
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
        <HiCheckCircle className="w-4 h-4 text-red-500" />
      </div>
      No Password Required
    </div>
    <div className="w-px h-7 bg-gray-200" />
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
        <HiShieldCheck className="w-4 h-4 text-green-600" />
      </div>
      100% Secure
    </div>
  </div>
);

const GreenBtn = ({ onClick, disabled, children }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 shadow-lg transition active:scale-[.98] disabled:opacity-50 text-[15px]"
    style={{ background: disabled ? '#9ca3af' : 'linear-gradient(90deg,#22c55e,#16a34a)' }}>
    {children}
  </button>
);

const BlueBtn = ({ type = 'button', onClick, disabled, children }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 shadow-lg transition active:scale-[.98] disabled:opacity-50 text-[15px]"
    style={{ background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }}>{children}
  </button>
);
const Spinner = () => <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />;
const OrLine = ({ label }) => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 border-t border-dashed border-gray-200" />
    <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 border-t border-dashed border-gray-200" />
  </div>
);
const PhoneField = ({ value, onChange, accent = 'blue' }) => (
  <div className="flex gap-2">
    <div className="flex items-center gap-1.5 px-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 shrink-0 font-medium">
      <span>🇮🇳</span><span>+91</span>
      <svg className="w-3 h-3 text-gray-400 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </div>
    <div className="relative flex-1">
      <HiPhone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
      <input name="phone" value={value} onChange={onChange} placeholder="Phone Number" inputMode="tel"
        className={`w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none transition text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-${accent}-400 focus:border-transparent`} />
    </div>
  </div>
);

const TextInput = ({ icon: Icon, name, type = 'text', value, onChange, placeholder, accent = 'blue', required, rightSlot }) => (
  <div className="relative">
    <Icon className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
    <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} autoComplete="off"
      className={`w-full pl-10 ${rightSlot ? 'pr-11' : 'pr-4'} py-3 border-2 border-gray-200 rounded-xl outline-none transition text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-${accent}-400 focus:border-transparent`} />
    {rightSlot && <div className="absolute right-3.5 top-3.5">{rightSlot}</div>}
  </div>
);

const RolePicker = ({ roles, setRoles, activeRole, setActiveRole, accent = 'blue' }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-2">I want to register as</p>
    <div className="grid grid-cols-2 gap-3">
      {[{ v: 'provider', e: '🛠️', l: 'Service Provider' }, { v: 'recruiter', e: '💼', l: 'Recruiter' }].map(({ v, e, l }) => (<button
        key={v} type="button"
        onClick={() => {
          if (roles.includes(v)) {
            const next = roles.filter((r) => r !== v);
            setRoles(next);
            if (activeRole === v) setActiveRole(next[0] || null);
          } else {
            const next = [...roles, v];
            setRoles(next);
            if (!activeRole) setActiveRole(v);
          }
        }}
        className={`p-3 rounded-2xl border-2 text-center transition text-xs font-semibold ${roles.includes(v) ? `border-${accent}-500 bg-${accent}-50 ring-2 ring-${accent}-200` : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
        <span className="text-2xl block mb-1">{e}</span>{l}
        {activeRole === v && <span className="block mt-1 text-[10px] font-bold text-gray-600">Active</span>}</button>
      ))}
    </div>
    {roles.length > 1 && (
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Default active role</p>
        <div className="flex gap-2">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRole(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${activeRole === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);
// Minimal LeftPanel component to avoid runtime ReferenceError.
// Keeps layout simple and visually consistent with the design.


const AuthPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";
  const referralCode = new URLSearchParams(location.search).get("ref") || "";

  const [mode, setMode] = useState(isLoginRoute ? "login" : "register");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(null);

  const [confirmationResult, setConfirmationResult] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
    city: "",
    whatsappNumber: "",
  });

  const [emailOtpSource, setEmailOtpSource] = useState("register");
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const {
    saveUserSession,
    isAuthenticated,
    user,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMode(location.pathname === "/login" ? "login" : "register");
    setStep(1);
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      otp: "",
      city: "",
      whatsappNumber: "",
    });
    setSelectedRoles([]);
    setActiveRole(null);
    setEmailOtpSource("register");
    setConfirmationResult(null);
  }, [location.pathname]);

  useEffect(() => {
    if (mode === "phone-verify" || mode === "email-verify") {
      setResendTimer(60);
      timerRef.current = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [mode]);

  const redirectToDashboard = (userRole) => {
    switch (userRole) {
      case "provider":
        navigate("/provider/dashboard", { replace: true });
        break;

      case "recruiter":
        navigate("/recruiter/job-postings", { replace: true });
        break;

      case "manager":
      case "partner":
        navigate("/partner/dashboard", { replace: true });
        break;

      case "admin":
        navigate("/admin/dashboard", { replace: true });
        break;

      default:
        navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const resolvedRole = user?.activeRole || user?.role;
    redirectToDashboard(resolvedRole);
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getFormattedPhone = () => {
    const cleanPhone = form.phone.replace(/\D/g, "");

    if (!cleanPhone) return "";

    if (form.phone.startsWith("+")) {
      return form.phone;
    }

    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    }

    if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
      return `+${cleanPhone}`;
    }

    return `+91${cleanPhone}`;
  };

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => { },
        "expired-callback": () => {
          window.recaptchaVerifier = null;
        },
      },
    );

    return window.recaptchaVerifier;
  };

  const resetRecaptcha = () => {
    try {
      window.recaptchaVerifier?.clear();
    } catch {
      // ignore
    }
    window.recaptchaVerifier = null;
  };

  const redirectAfterAuth = (data) => {
    const authData = data?.token && data?.user ? data : null;
    if (!authData) return;

    const savedUser = saveUserSession(authData) || authData.user;

    toast.success(
      `${t("auth.welcomeBack")}${savedUser?.name ? ", " + savedUser.name.split(" ")[0] : ""
      }!`
    );

    const resolvedRole =
      savedUser?.activeRole ||
      savedUser?.role ||
      savedUser?.roles?.[0];

    redirectToDashboard(resolvedRole);
  };

  const handleOtpBox = (idx, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = form.otp.padEnd(6, " ").split("");
    arr[idx] = digit || " ";
    const otp = arr.join("").trimEnd();

    setForm((f) => ({ ...f, otp }));

    if (digit && idx < 5) {
      setTimeout(() => otpRefs.current[idx + 1]?.focus(), 0);
    }
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === "Backspace") {
      const arr = form.otp.padEnd(6, " ").split("");

      if (arr[idx] && arr[idx] !== " ") {
        arr[idx] = " ";
        setForm((f) => ({ ...f, otp: arr.join("").trimEnd() }));
      } else if (idx > 0) {
        arr[idx - 1] = " ";
        setForm((f) => ({ ...f, otp: arr.join("").trimEnd() }));
        setTimeout(() => otpRefs.current[idx - 1]?.focus(), 0);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedOtp = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    setForm((f) => ({ ...f, otp: pastedOtp }));
    setTimeout(
      () => otpRefs.current[Math.min(pastedOtp.length, 5)]?.focus(),
      0,
    );
  };

  useEffect(() => {
    if (mode === "phone-verify" && form.otp.replace(/\s/g, "").length === 6) {
      handleFirebaseOtpVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.otp]);

  const handleFirebaseSendOtp = async () => {
    const formattedPhone = getFormattedPhone();

    if (!formattedPhone) {
      return toast.error("Please enter phone number");
    }

    if (mode === "phone-register" && selectedRoles.length === 0) {
      return toast.error("Please select at least one role");
    }

    setLoading(true);

    try {
      resetRecaptcha();

      const appVerifier = setupRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier,
      );
      console.log("[PHONE OTP SENT]");

      setConfirmationResult(result);
      setForm((f) => ({ ...f, phone: formattedPhone, otp: "" }));

      toast.success("OTP sent successfully");
      setMode("phone-verify");

      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      console.error("Firebase Send OTP Error:", err);
      resetRecaptcha();
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseOtpVerify = async () => {
    const otp = form.otp.replace(/\s/g, "");

    if (otp.length !== 6) {
      return toast.error("Enter 6-digit OTP");
    }

    if (!confirmationResult) {
      return toast.error("Please send OTP first");
    }

    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      console.log("[PHONE FIREBASE VERIFIED]", result.user);
      const firebaseToken = await result.user.getIdToken(true);

      const defaultRoles = selectedRoles.length ? selectedRoles : ["provider"];
      const defaultActiveRole = activeRole || selectedRoles[0] || "provider";

      const payload = {
        firebaseToken,
        phone: result.user.phoneNumber,
        name: form.name || undefined,
        city: form.city || undefined,
        roles: defaultRoles,
        activeRole: defaultActiveRole,
        role: defaultActiveRole,
        referralCode,
      };

      const { data } = await authAPI.phoneLogin(payload);
      console.log("[PHONE LOGIN RESPONSE]", data);
      redirectAfterAuth(data?.data);
    } catch (err) {
      console.error("Firebase OTP Verify Error:", err);
      toast.error(
        err.response?.data?.message || err.message || "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseResend = async () => {
    if (resendTimer > 0) return;

    setForm((f) => ({ ...f, otp: "" }));
    setConfirmationResult(null);

    await handleFirebaseSendOtp();

    setResendTimer(60);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error(t("auth.fillAllFields"));
    }

    setLoading(true);

    try {
      const { data } = await authAPI.loginEmail({
        email: form.email,
        password: form.password,
      });

      console.log("[EMAIL LOGIN RESPONSE]", data);
      redirectAfterAuth(data?.data);
    } catch (err) {
      if (err.response?.data?.requiresEmailVerification) {
        setEmailOtpSource("login");
        setForm((f) => ({
          ...f,
          email: err.response?.data?.email || f.email,
          otp: "",
        }));
        setMode("email-verify");
        toast.error(
          err.response?.data?.message || "Email verification required",
        );
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        toast.error(err.response?.data?.message || t("auth.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return toast.error(t("auth.fillAllFields"));
    }

    if (selectedRoles.length === 0) {
      return toast.error("Please select at least one role");
    }

    setLoading(true);

    try {
      const { data } = await authAPI.registerEmail({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password,
        roles: selectedRoles,
        activeRole: activeRole || selectedRoles[0],
        referralCode,
      });

      console.log("[EMAIL REGISTER RESPONSE]", data);
      setEmailOtpSource("register");
      setForm((f) => ({ ...f, email: form.email, otp: "" }));
      setMode("email-verify");
      toast.success(data.message || "OTP sent to your email");
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpVerify = async () => {
    const otp = form.otp.replace(/\s/g, "");

    if (!form.email || otp.length !== 6) {
      return toast.error("Enter email and 6-digit OTP");
    }

    setLoading(true);

    try {
      const { data } = await authAPI.verifyEmailOtp({
        email: form.email,
        otp,
        whatsappNumber: form.whatsappNumber || undefined,
      });

      console.log("[EMAIL OTP VERIFY RESPONSE]", data);
      redirectAfterAuth(data?.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.otpFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (accessToken) => {
    setLoading(true);

    try {
      const { data } = await authAPI.googleLogin({
        accessToken,
        roles: mode === "register" ? selectedRoles : undefined,
        activeRole:
          mode === "register" ? activeRole || selectedRoles[0] : undefined,
        referralCode,
      });

      console.log("[GOOGLE LOGIN RESPONSE]", data);
      redirectAfterAuth(data?.data);
    } catch (err) {
      const message = err.response?.data?.message;
      toast.error(message || t("auth.googleFailed"));
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) =>
      handleGoogleAuthSuccess(tokenResponse.access_token),
    onError: () => {
      toast.error(t("auth.googleCancelled"));
      setLoading(false);
    },
  });

  const handleGoogleAuth = () => {
    setLoading(true);
    triggerGoogleLogin();
  };

  const handleEmailResend = async () => {
    if (resendTimer > 0 || !form.email) return;

    setLoading(true);

    try {
      await authAPI.sendRegistrationEmailOtp({ email: form.email });

      setForm((f) => ({ ...f, otp: "" }));
      toast.success("A new OTP has been sent to your email");

      setResendTimer(60);
      clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const renderOtpBoxes = (accent = "blue") => (
    <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => (otpRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={form.otp[idx] && form.otp[idx] !== " " ? form.otp[idx] : ""}
          onChange={(e) => handleOtpBox(idx, e)}
          onKeyDown={(e) => handleOtpKey(idx, e)}
          disabled={loading}
          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-2xl outline-none transition border-gray-200 focus:border-${accent}-500 focus:ring-2 focus:ring-${accent}-200 bg-gray-50 focus:bg-white disabled:opacity-50`}
        />
      ))}
    </div>
  );

  const renderForm = () => {
    if (mode === "register" && step === 1) {
      return (
        <div>
          <div className="mb-7">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
              {t("auth.createAccount")}
            </h2>
            <p className="text-gray-500 text-sm">
              {t("auth.getStarted")}{" "}
              <span className="text-blue-600 font-semibold">
                {t("auth.quickEasy")}
              </span>
            </p>
          </div>

          <div className="mb-3">
            <GreenBtn onClick={() => setMode("phone-register")}>
              <HiPhone className="w-6 h-6" /> Signup with Phone OTP
            </GreenBtn>
            {/* <p className="text-center text-xs text-green-600 font-semibold mt-1.5">
              Firebase OTP Authentication
            </p> */}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex items-center justify-center gap-2 border-2 border-gray-200 bg-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
            >
              <FcGoogle className="w-5 h-5" /> {t("auth.continueGoogle")}
            </button>

            <button
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-2 border-2 border-gray-200 bg-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
            >
              <HiMail className="w-5 h-5 text-blue-500" />{" "}
              {t("auth.continueEmail")}
            </button>
          </div>

          <div className="mt-5">
            <TrustRow />
          </div>

          <div className="mb-5">
            <p className="text-xs text-center text-gray-400 mb-3">
              You can select one or both roles. You can also switch roles later
              from the navbar.
            </p>

            <RolePicker
              roles={selectedRoles}
              setRoles={setSelectedRoles}
              activeRole={activeRole}
              setActiveRole={setActiveRole}
            />
          </div>

          <p className="text-center text-sm text-gray-500">
            {t("auth.alreadyAccount")}{" "}
            <Link
              to="/login"
              className="text-blue-600 font-bold hover:underline"
            >
              {t("navbar.login")}
            </Link>
          </p>
        </div>
      );
    }

    if (mode === "register" && step === 2) {
      return (
        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HiUser className="w-5 h-5 text-blue-500" />
              <h2 className="text-2xl font-extrabold text-gray-900">
                Tell us about yourself
              </h2>
              <span className="text-sm text-gray-400 font-medium">
                (Step 2/2)
              </span>
            </div>
            <ProgressBar filled={2} />
          </div>

          <TextInput
            icon={HiUser}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />

          <PhoneField value={form.phone} onChange={handleChange} />

          <TextInput
            icon={HiLocationMarker}
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
          />

          <TextInput
            icon={HiMail}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
          />

          <TextInput
            icon={HiLockClosed}
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <HiEyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <HiEye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            }
          />

          <RolePicker
            roles={selectedRoles}
            setRoles={setSelectedRoles}
            activeRole={activeRole}
            setActiveRole={setActiveRole}
          />

          <BlueBtn type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                {t("auth.creatingAccount")}
              </>
            ) : (
              <>{t("auth.createAccount")} &#8594;</>
            )}
          </BlueBtn>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-xs text-gray-400 hover:text-blue-500 transition"
          >
            &#8592; {t("auth.backToOptions")}
          </button>
        </form>
      );
    }

    if (mode === "phone-register") {
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HiUser className="w-5 h-5 text-blue-500" />
              <h2 className="text-2xl font-extrabold text-gray-900">
                Register with Phone OTP
              </h2>
              <span className="text-sm text-gray-400 font-medium">
                Firebase
              </span>
            </div>
            <ProgressBar filled={1} />
          </div>

          <TextInput
            icon={HiUser}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            accent="green"
          />

          <PhoneField
            value={form.phone}
            onChange={handleChange}
            accent="green"
          />

          <TextInput
            icon={HiLocationMarker}
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            accent="green"
          />

          <RolePicker
            roles={selectedRoles}
            setRoles={setSelectedRoles}
            activeRole={activeRole}
            setActiveRole={setActiveRole}
            accent="green"
          />

          <GreenBtn onClick={handleFirebaseSendOtp} disabled={loading}>
            <HiPhone className="w-5 h-5" />
            {loading ? "Sending OTP..." : "Send Phone OTP"}
          </GreenBtn>

          <p className="text-center text-sm text-gray-500">
            {t("auth.alreadyAccount")}{" "}
            <Link
              to="/login"
              className="text-blue-600 font-bold hover:underline"
            >
              {t("navbar.login")}
            </Link>
          </p>

          <button
            onClick={() => setMode("register")}
            className="w-full text-xs text-gray-400 hover:text-blue-500 transition"
          >
            &#8592; {t("auth.backToOptions")}
          </button>
        </div>
      );
    }

    if (mode === "phone-verify") {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <HiPhone className="w-11 h-11 text-green-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Verify your phone number
            </h2>

            <p className="text-gray-500 text-sm">
              OTP sent to{" "}
              <strong className="text-gray-800">{form.phone}</strong>
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 text-center mb-4">
              Enter 6-digit OTP
            </p>
            {renderOtpBoxes("green")}
          </div>

          <GreenBtn
            onClick={handleFirebaseOtpVerify}
            disabled={loading || form.otp.replace(/\s/g, "").length !== 6}
          >
            {loading ? (
              <>
                <Spinner />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </GreenBtn>

          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() =>
                setMode(
                  location.pathname === "/login"
                    ? "phone-login"
                    : "phone-register",
                )
              }
              className="text-gray-500 hover:text-green-600 transition"
            >
              &#8592; Change Number
            </button>

            <button
              onClick={handleFirebaseResend}
              disabled={resendTimer > 0 || loading}
              className="text-green-600 font-bold disabled:text-gray-400 transition"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      );
    }

    if (mode === "email-verify") {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <HiMail className="w-10 h-10 text-blue-600" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Verify your email
            </h2>

            <p className="text-gray-500 text-sm">
              Enter the 6-digit OTP sent to{" "}
              <strong className="text-gray-800">{form.email}</strong>
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 text-center mb-4">
              Email OTP
            </p>
            {renderOtpBoxes("blue")}
          </div>

          <div>
            <TextInput
              icon={HiPhone}
              name="whatsappNumber"
              value={form.whatsappNumber}
              onChange={handleChange}
              placeholder="WhatsApp number optional"
            />
          </div>

          <BlueBtn
            onClick={handleEmailOtpVerify}
            disabled={loading || form.otp.replace(/\s/g, "").length !== 6}
          >
            {loading ? (
              <>
                <Spinner />
                {t("auth.verifying")}
              </>
            ) : (
              "Verify & Continue"
            )}
          </BlueBtn>

          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => {
                setForm((f) => ({ ...f, otp: "" }));

                if (emailOtpSource === "login") {
                  setMode("login");
                } else {
                  setMode("register");
                  setStep(2);
                }
              }}
              className="text-gray-500 hover:text-blue-600 transition"
            >
              &#8592;{" "}
              {emailOtpSource === "login"
                ? t("auth.backToLogin")
                : t("auth.backToOptions")}
            </button>

            <button
              onClick={handleEmailResend}
              disabled={resendTimer > 0 || loading}
              className="text-blue-600 font-bold disabled:text-gray-400 transition"
            >
              {resendTimer > 0
                ? `${t("auth.resendIn")} ${resendTimer}s`
                : t("auth.resendOtp")}
            </button>
          </div>
        </div>
      );
    }

    if (mode === "phone-login") {
      return (
        <div className="space-y-5">
          <div className="text-center mb-2">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <HiPhone className="w-11 h-11 text-green-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Sign in with Phone OTP
            </h2>

            <p className="text-gray-500 text-sm">
              Firebase will send a one-time code.
            </p>
          </div>

          <PhoneField
            value={form.phone}
            onChange={handleChange}
            accent="green"
          />

          <GreenBtn onClick={handleFirebaseSendOtp} disabled={loading}>
            <HiPhone className="w-5 h-5" />
            {loading ? "Sending OTP..." : "Send Phone OTP"}
          </GreenBtn>

          <button
            onClick={() => setMode("login")}
            className="w-full text-sm text-gray-500 hover:text-green-600 transition"
          >
            &#8592; {t("auth.backToLogin")}
          </button>
        </div>
      );
    }

    if (mode === "login") {
      return (
        <form onSubmit={handleEmailLogin}>
          <div className="mb-7">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
              {t("auth.welcomeBack")}
            </h2>

            <p className="text-gray-500 text-sm">
              {t("auth.signinSeamless")}{" "}
              <span className="text-blue-600 font-semibold">
                {t("auth.quickEasy")}
              </span>
            </p>
          </div>

          <div className="mb-3">
            <GreenBtn
              onClick={() => {
                setSelectedRoles([]);
                setActiveRole(null);
                setMode("phone-login");
              }}
            >
              <HiPhone className="w-6 h-6" /> Sign in with Phone OTP
            </GreenBtn>

            <p className="text-center text-xs text-green-600 font-semibold mt-1.5">
              Firebase OTP Authentication
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex items-center justify-center gap-2 border-2 border-gray-200 bg-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
            >
              <FcGoogle className="w-5 h-5" /> {t("auth.continueGoogle")}
            </button>
          </div>

          <div className="mt-5">
            <TrustRow />
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <HiUser className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-gray-800">
                Your Credentials
              </h3>
              <span className="text-xs text-gray-400">(Step 2/2)</span>
            </div>

            <ProgressBar filled={2} />

            <div className="space-y-3">
              <TextInput
                icon={HiMail}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
              />

              <TextInput
                icon={HiLockClosed}
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                required
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiEyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <HiEye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                }
              />
            </div>
          </div>

          <BlueBtn type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                {t("auth.signingIn")}
              </>
            ) : (
              <>{t("auth.signIn")} &#8594;</>
            )}
          </BlueBtn>

          <p className="text-center text-sm text-gray-500 mt-3">
            {t("auth.noAccount")}{" "}
            <Link
              to="/signup"
              className="text-blue-600 font-bold hover:underline"
            >
              {t("navbar.signup")}
            </Link>
          </p>
        </form>
      );
    }

    return null;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-4"
      style={{
        background:
          "linear-gradient(135deg,#dbeafe 0%,#ede9fe 45%,#fce7f3 100%)",
      }}
    >
      <div
        className="fixed rounded-full blur-3xl opacity-40 pointer-events-none bg-blue-200 w-96 h-96"
        style={{ top: "-8%", left: "-8%" }}
      />

      <div
        className="fixed rounded-full blur-3xl opacity-30 pointer-events-none bg-purple-300 w-72 h-72"
        style={{ bottom: "-5%", right: "-5%" }}
      />

      <Link
        to="/"
        className="fixed top-5 left-5 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition text-sm font-medium z-20 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md"
      >
        <HiArrowLeft className="w-4 h-4" /> {t("navbar.home")}
      </Link>

      <div
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden auth-page-card"
        style={{ minHeight: "620px" }}
      >
        <div className="flex flex-col lg:grid lg:grid-cols-[480px_1fr] min-h-130">
          <LeftPanel mode={mode} />

          <div className="flex flex-col justify-center px-8 sm:px-12 py-10 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 90% 10%, #eff6ff 0%, transparent 50%), radial-gradient(circle at 10% 90%, #f0fdf4 0%, transparent 40%)",
              }}
            />

            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
                <FaRocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-gray-800">
                ServiceHub
              </span>
            </div>

            <div className="relative z-10 max-w-md mx-auto w-full">
              {renderForm()}
            </div>
          </div>
        </div>
      </div>

      <div id="recaptcha-container"></div>

      <style>{`
        .auth-page-card {
          animation: authPageIn 0.4s cubic-bezier(.22,.68,0,1.15);
        }

        @keyframes authPageIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }

        .animate-float {
          animation: floatUp 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
