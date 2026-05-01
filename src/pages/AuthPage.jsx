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

// Minimal LeftPanel component to avoid runtime ReferenceError.
// Keeps layout simple and visually consistent with the design.
const LeftPanel = ({ mode }) => {
  const isPhoneFlow = mode === "phone-login" || mode === "phone-register";
  const title = isPhoneFlow ? "Fast phone OTP access" : "ServiceHub";
  const subtitle = isPhoneFlow
    ? "Enter your number, verify in seconds, and continue without friction."
    : "Connect with trusted professionals and grow your business — fast, reliable, and simple.";

  return (
    <div
      className="hidden lg:flex flex-col items-start justify-between px-12 py-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(239,246,255,0.92) 52%, rgba(224,231,255,0.9) 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl animate-float mb-6">
          <FaRocket className="w-6 h-6 text-white" />
        </div>

        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-blue-700 text-xs font-semibold shadow-sm border border-blue-100 mb-5">
          <HiShieldCheck className="w-4 h-4" /> Secure phone sign-in
        </span>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 max-w-md">
          {title}
        </h2>

        <p className="text-gray-600 mb-8 max-w-md leading-7">{subtitle}</p>

        <div className="relative w-full max-w-md bg-white/80 p-5 rounded-[1.75rem] shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-white/70">
          <div className="absolute -top-4 right-6 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
            OTP ready
          </div>

          <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 items-stretch">
            <div className="rounded-[1.4rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-5 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.55),_transparent_40%)]" />
              <div className="relative z-10 flex items-center justify-between mb-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-blue-100/70">
                    ServiceHub
                  </p>
                  <p className="text-lg font-bold">Phone Login</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/12 border border-white/20 flex items-center justify-center">
                  <HiPhone className="w-5 h-5 text-emerald-300" />
                </div>
              </div>

              <div className="relative z-10 space-y-3">
                <div className="h-3 rounded-full bg-white/12 w-3/5" />
                <div className="h-3 rounded-full bg-white/12 w-4/5" />
                <div className="h-3 rounded-full bg-white/12 w-2/3" />
              </div>

              <div className="relative z-10 mt-6 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-white/90 border border-white/10">
                  +91 mobile
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-xs font-semibold text-emerald-200 border border-emerald-300/20">
                  Verified in seconds
                </span>
              </div>
            </div>

            <div className="grid gap-3 content-start">
              <div className="rounded-[1.25rem] bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <HiCheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Quick access
                    </p>
                    <p className="text-xs text-gray-500">
                      No password required
                    </p>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
                  <div className="h-full w-4/5 rounded-full bg-emerald-500" />
                </div>
              </div>

              <div className="rounded-[1.25rem] bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <MdVerified className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Trusted session
                    </p>
                    <p className="text-xs text-gray-500">
                      Session persists after login
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaStar className="w-4 h-4 text-amber-400" />
                  Fast, reliable, simple
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Minimal UI component stubs used by AuthPage.
const GreenBtn = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-white bg-green-600 hover:bg-green-700 transition ${className}`}
  >
    {children}
  </button>
);

const BlueBtn = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition ${className}`}
  >
    {children}
  </button>
);

const Spinner = ({ size = "sm" }) => (
  <div
    className={`inline-block animate-spin border-2 border-white border-t-transparent rounded-full ${size === "lg" ? "w-5 h-5" : "w-4 h-4"}`}
  />
);

const ProgressBar = ({ filled = 1 }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
    <div
      className="bg-blue-500 h-2 rounded-full"
      style={{ width: `${(filled / 2) * 100}%` }}
    />
  </div>
);

const TrustRow = () => (
  <div className="flex items-center gap-2 justify-center">
    <div className="text-sm font-semibold text-gray-700">4.9</div>
    <div className="text-xs text-gray-400">/ 5K+ users</div>
  </div>
);

const OrLine = () => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-200" />
    <div className="text-xs text-gray-400">OR</div>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const PhoneField = ({ value, onChange, accent = "blue" }) => (
  <TextInput
    icon={HiPhone}
    name="phone"
    value={value}
    onChange={onChange}
    placeholder="Phone Number"
  />
);

const TextInput = ({
  icon: Icon,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  rightSlot,
  accent = "blue",
  required,
}) => (
  <div className="flex items-center gap-3">
    {Icon && <Icon className="w-5 h-5 text-gray-400" />}
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      required={required}
      className="flex-1 py-3 px-3 rounded-xl border border-gray-200 bg-white outline-none"
    />
    {rightSlot}
  </div>
);

const RolePicker = ({
  roles = [],
  setRoles = () => {},
  activeRole,
  setActiveRole = () => {},
  accent = "blue",
}) => {
  const available = ["provider", "recruiter"];

  const toggle = (r) => {
    if (roles.includes(r)) {
      setRoles(roles.filter((x) => x !== r));
      if (activeRole === r) setActiveRole(null);
    } else {
      setRoles([...roles, r]);
      setActiveRole(r);
    }
  };

  return (
    <div className="flex gap-3">
      {available.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => toggle(r)}
          className={`px-3 py-2 rounded-xl border ${roles.includes(r) ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
};

const AuthPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";

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

  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
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
      case "admin":
        navigate("/admin/dashboard", { replace: true });
        break;
      case "manager":
        navigate("/admin/providers", { replace: true });
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
        callback: () => {},
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
    const authData = data?.user
      ? {
          ...data.user,
          token: data.token,
          isNewUser: data.isNewUser,
        }
      : data;

    if (authData.isNewUser) {
      toast.success(
        `${t("auth.welcome")}, ${
          authData.name?.split(" ")[0] || t("auth.there")
        }! ${t("auth.setupProfile")} 🎉`,
      );
    } else {
      toast.success(
        `${t("auth.welcomeBack")}${
          authData.name ? ", " + authData.name.split(" ")[0] : ""
        }!`,
      );
    }

    login(authData, authData.token);
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
      };

      const { data } = await authAPI.firebaseOtpLogin(payload);

      redirectAfterAuth(data);
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
      const { data } = await authAPI.login({
        email: form.email,
        password: form.password,
      });

      redirectAfterAuth(data);
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
      const { data } = await authAPI.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password,
        roles: selectedRoles,
        activeRole: activeRole || selectedRoles[0],
      });

      if (data?.requiresEmailVerification) {
        setEmailOtpSource("register");
        setForm((f) => ({ ...f, email: data.email || f.email, otp: "" }));
        setMode("email-verify");
        toast.success(data.message || "OTP sent to your email");
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        redirectAfterAuth(data);
      }
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
      const { data } = await authAPI.verifyRegistrationEmailOtp({
        email: form.email,
        otp,
        whatsappNumber: form.whatsappNumber || undefined,
      });

      redirectAfterAuth(data);
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.otpFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (accessToken) => {
    setLoading(true);

    try {
      const { data } = await authAPI.googleAuth({
        accessToken,
        roles: mode === "register" ? selectedRoles : undefined,
        activeRole:
          mode === "register" ? activeRole || selectedRoles[0] : undefined,
      });

      redirectAfterAuth(data);
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
            <p className="text-center text-xs text-green-600 font-semibold mt-1.5">
              Firebase OTP Authentication
            </p>
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
