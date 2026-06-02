import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { providerAPI, aiAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import RouteLoader from "../../components/common/RouteLoader";
import toast from "react-hot-toast";
import { toAbsoluteMediaUrl } from "../../utils/media";
import { safeReturnPath } from "../../utils/navigation";
import { cacheBustedUrl } from "../../utils/cacheBuster";
import { sanitizePayload } from "../../utils/sanitizePayload";
import useSubmitLock from "../../hooks/useSubmitLock";
import LocationSearch from "../../components/LocationSearch";
import DocumentVerificationStatusCard from "../../components/provider/DocumentVerificationStatusCard";
import AIProfileAssistant from "../../components/provider/AIProfileAssistant";
import AIProfileAutoFillModal from "../../components/provider/AIProfileAutoFillModal";
import ProviderAIChat from "../../components/provider/ProviderAIChat";
import PortfolioLinksManager from "../../components/common/PortfolioLinksManager";
import { compressImage } from "../../utils/fileCompressionService";
import { validateUploadFile } from "../../utils/fileValidationService";
import SkillSearchSelect from "../../components/common/SkillSearchSelect";
import SmartMultiSelect from "../../components/common/SmartMultiSelect";
import {
  User as UserIcon,
  Phone as PhoneIcon,
  Sparkles,
  MapPin,
  Globe,
  Calendar,
  Award,
  ShieldCheck,
  Link2,
  Eye,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  ShieldAlert,
  Plus,
  X,
  UploadCloud,
  Trash2,
  Camera,
  Compass,
  RefreshCw,
  Search,
  Shield,
  CheckCircle,
  ChevronDown,
  Check,
  Briefcase,
  Zap,
  Star,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────
const INDIAN_CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Noida",
  "Gurgaon",
  "Delhi NCR",
  "Surat",
  "Bhopal",
  "Indore",
  "Nagpur",
  "Patna",
  "Chandigarh",
  "Coimbatore",
];
export const ALL_SKILLS = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Driver",
  "Cook",
  "Welder",
  "Mason",
  "AC Technician",
  "CCTV Installer",
  "Tiler",
  "Interior Designer",
  "UI/UX Designer",
  "Graphic Designer",
  "Web Developer",
  "Mobile Developer",
  "Content Writer",
  "Digital Marketer",
  "Accountant",
  "Data Entry Operator",
  "Receptionist",
  "Security Guard",
  "Housekeeping",
  "Nurse",
  "Caretaker",
  "Tailor",
  "Beautician",
  "Yoga Trainer",
  "Tutor",
];

const TIER_SKILL_ALLOWLIST = {
  unskilled: new Set([
    "labour",
    "helper plumber",
    "helper electrician",
    "construction helper",
    "cleaning helper",
    "painter helper",
    "carpenter helper",
    "loader",
    "delivery helper",
    "kitchen helper",
  ]),
  "semi-skilled": new Set([
    "plumber",
    "ac mechanic",
    "ac technician",
    "electrician",
    "carpenter",
    "painter",
    "mason",
    "driver",
    "cook",
    "tailor",
    "machine operator",
    "technician",
  ]),
  skilled: new Set([
    "web developer",
    "app developer",
    "digital marketer",
    "seo expert",
    "graphic designer",
    "video editor",
    "content writer",
    "ai developer",
    "cyber security expert",
    "senior electrician",
    "interior designer",
    "project manager",
    "consultant",
  ]),
};

function isSkillAllowedForTier(skill, tier) {
  const normalizedSkill = String(skill || "")
    .trim()
    .toLowerCase();
  const normalizedTier = String(tier || "unskilled")
    .trim()
    .toLowerCase();
  if (!normalizedSkill) return false;
  const allowed = TIER_SKILL_ALLOWLIST[normalizedTier];
  if (!allowed) return true;
  return allowed.has(normalizedSkill);
}
export const ALL_LANGUAGES = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "Assamese",
  "Azerbaijani",
  "Bengali",
  "Bhojpuri",
  "Bosnian",
  "Bulgarian",
  "Burmese",
  "Cantonese",
  "Catalan",
  "Cebuano",
  "Chinese (Mandarin)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Esperanto",
  "Estonian",
  "Farsi (Persian)",
  "Finnish",
  "French",
  "Galician",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Hausa",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Igbo",
  "Indonesian",
  "Irish",
  "Italian",
  "Japanese",
  "Javanese",
  "Kannada",
  "Kazakh",
  "Khmer",
  "Korean",
  "Kurdish",
  "Lao",
  "Latin",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Maithili",
  "Malay",
  "Malayalam",
  "Marathi",
  "Mongolian",
  "Nepali",
  "Norwegian",
  "Odia",
  "Pashto",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Sanskrit",
  "Serbian",
  "Sindhi",
  "Sinhala",
  "Slovak",
  "Slovenian",
  "Somali",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tagalog (Filipino)",
  "Tajik",
  "Tamil",
  "Telugu",
  "Thai",
  "Tibetan",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Vietnamese",
  "Welsh",
  "Yoruba",
  "Zulu",
];

const OCR_TEST_OPTIONS = [
  { value: "document", label: "Document OCR" },
  { value: "text", label: "Text OCR" },
];

function inferExperienceMonths(value) {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (!text) return 0;

  let total = 0;
  const yearMatch = text.match(/(\d+)\s*(year|years|saal|sal)/i);
  const monthMatch = text.match(/(\d+)\s*(month|months|mahina|mahine)/i);

  if (yearMatch) total += Number(yearMatch[1]) * 12;
  if (monthMatch) total += Number(monthMatch[1]);

  if (!total) {
    const maybeNumber = Number.parseInt(text, 10);
    if (Number.isFinite(maybeNumber)) {
      total = maybeNumber >= 12 ? maybeNumber : maybeNumber * 12;
    }
  }

  return Number.isFinite(total) ? total : 0;
}

// ─── Chip ────────────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full shadow-sm">
    {label}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition leading-none text-base"
      >
        ×
      </button>
    )}
  </span>
);

// ─── TagPicker ───────────────────────────────────────────────────────────────
const TagPicker = ({ available, selected, onAdd, onRemove, placeholder }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = available
    .filter((s) => !selected.includes(s))
    .filter((s) => s.toLowerCase().includes(query.toLowerCase()));

  const addCustom = () => {
    const val = query.trim();
    if (val && !selected.includes(val)) {
      onAdd(val);
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map((s) => (
          <Chip key={s} label={s} onRemove={() => onRemove(s)} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-blue-300 text-blue-600 bg-white text-sm font-medium hover:bg-blue-50 transition"
      >
        + Add {placeholder}
      </button>
      {open && (
        <div className="relative z-10 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCustom())
              }
              placeholder={`Search or type ${placeholder}...`}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {query.trim() &&
              !selected.includes(query.trim()) &&
              !filtered.some(
                (f) => f.toLowerCase() === query.trim().toLowerCase(),
              ) && (
                <li
                  onClick={addCustom}
                  className="px-4 py-2.5 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 border-b"
                >
                  Add &ldquo;{query.trim()}&rdquo;
                </li>
              )}
            {filtered.map((s) => (
              <li
                key={s}
                onClick={() => {
                  onAdd(s);
                  setQuery("");
                  setOpen(false);
                }}
                className="px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── ProviderProfile ─────────────────────────────────────────────────────────
const ProviderProfile = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const hasInitialized = useRef(false);

  // Submit lock to prevent duplicate save/upload submissions
  const { isSubmitting: isSaving, withLock: withSaveLock } = useSubmitLock();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [plan, setPlan] = useState("free");

  const [profileData, setProfileData] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [newLink, setNewLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMeta, setAiMeta] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [pricingSuggestion, setPricingSuggestion] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentVerification, setDocumentVerification] = useState(null);
  const [ocrTestType, setOcrTestType] = useState("document");
  const [ocrTesting, setOcrTesting] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState("");
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [coverageRefreshLoading, setCoverageRefreshLoading] = useState(false);
  const [coverageUpgradeLoading, setCoverageUpgradeLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    skills: [],
    locations: [],
    city: "",
    state: "",
    tier: "unskilled",
    experience: "",
    languages: [],
    description: "",
    portfolioLinks: [],
    photo: "",
    whatsappAlerts: true,
    nearestLocation: "",
    latitude: null,
    longitude: null,
    pricing: "",
    pricingType: "",
    location: null,
    profileName: "",
    phone: "",
    resumeUrl: "",
    pricingReason: "",
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleAiAutoFillApply = (data) => {
    setForm((prev) => ({
      ...prev,
      ...data,
    }));
    toast.success(
      "Profile fields updated from AI! Please review and save your changes.",
    );
  };

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const isDirty = useMemo(() => {
    if (!profileData) return false;

    const areArraysEqual = (a, b) => {
      const arrA = Array.isArray(a) ? a : [];
      const arrB = Array.isArray(b) ? b : [];
      if (arrA.length !== arrB.length) return false;
      const sortedA = [...arrA].sort();
      const sortedB = [...arrB].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };

    const arePortfolioLinksEqual = (a, b) => {
      const arrA = Array.isArray(a) ? a : [];
      const arrB = Array.isArray(b) ? b : [];
      if (arrA.length !== arrB.length) return false;

      const serializeLink = (l) => {
        if (!l) return "";
        if (typeof l === "string") return l.toLowerCase();
        return `${l.platform || ""}|${l.url || ""}`.toLowerCase();
      };

      const sortedA = arrA.map(serializeLink).sort();
      const sortedB = arrB.map(serializeLink).sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };

    let initialLocs = [];
    if (
      Array.isArray(profileData.serviceLocations) &&
      profileData.serviceLocations.length > 0
    ) {
      initialLocs = profileData.serviceLocations
        .map((l) => l.formattedAddress || l.name || String(l))
        .filter(Boolean);
    } else if (
      Array.isArray(profileData.locations) &&
      profileData.locations.length > 0
    ) {
      initialLocs = profileData.locations;
    } else {
      if (profileData.city) initialLocs.push(profileData.city);
      if (profileData.state && profileData.state !== profileData.city)
        initialLocs.push(profileData.state);
    }

    const displayPhoto = profileData.photo || profileData.profilePhoto || "";
    const initialPhoto = toAbsoluteMediaUrl(
      profileData.user?.profilePhotoApproval?.status === "pending" &&
        profileData.user?.profilePhotoApproval?.pendingUrl
        ? profileData.user.profilePhotoApproval.pendingUrl
        : displayPhoto,
    );

    return (
      form.name !== (profileData.user?.name || "") ||
      form.profileName !== (profileData.profileName || "") ||
      form.phone !== (profileData.user?.phone || "") ||
      form.tier !== (profileData.tier || "unskilled") ||
      form.experience !== (profileData.experience || "") ||
      form.description !== (profileData.description || "") ||
      String(form.pricing) !== String(profileData.pricing || "") ||
      form.pricingType !== (profileData.pricingType || "") ||
      form.whatsappAlerts !== (profileData.whatsappAlerts !== false) ||
      form.nearestLocation !== (profileData.nearestLocation || "") ||
      form.photo !== initialPhoto ||
      !areArraysEqual(form.skills, profileData.skills || []) ||
      !areArraysEqual(
        form.locations
          .map((l) => l.formattedAddress || l.name || String(l))
          .filter(Boolean),
        initialLocs,
      ) ||
      !areArraysEqual(form.languages, profileData.languages || []) ||
      !arePortfolioLinksEqual(
        form.portfolioLinks,
        profileData.portfolioLinks || [],
      )
    );
  }, [form, profileData]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes on your profile. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown === 0) {
      navigate("/provider/plans");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  useEffect(() => {
    const shouldRefreshCoverage =
      location.state?.paymentSuccess || location.state?.refreshSubscription;
    if (!shouldRefreshCoverage) return;

    let isActive = true;

    const refreshCoverage = async () => {
      setCoverageRefreshLoading(true);
      try {
        await fetchProfile();
        if (typeof fetchUser === "function") {
          await fetchUser();
        }
        toast.success(
          "Plan upgraded successfully. Your service coverage has been expanded.",
        );
      } catch (error) {
        toast.error(
          "Subscription refreshed, but the latest limits could not be loaded yet.",
        );
      } finally {
        if (!isActive) return;
        setCoverageRefreshLoading(false);
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    refreshCoverage();

    return () => {
      isActive = false;
    };
  }, [fetchUser, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (hasInitialized.current && isDirty) {
      const userId = profileData?.user?._id || user?._id || "";
      const draftKey = userId ? `lucohire_profile_draft_${userId}` : "lucohire_profile_draft";
      localStorage.setItem(draftKey, JSON.stringify(form));
    }
  }, [form, isDirty, profileData, user]);

  // Calculate max locations allowed by plan
  const maxLocations = (() => {
    if (
      !profileData ||
      profileData.currentPlan === "free" ||
      !profileData.currentPlan
    )
      return 1;
    return Math.max(
      1,
      Number(profileData.allowedPincodesCount || 1),
      Number(profileData.allowedCitiesCount || 1),
    );
  })();

  const usedCoverageCount = Math.max(0, form.locations.length || 0);
  const allowedCoverageCount = Math.max(
    1,
    Number(
      subscriptionSummary?.allowedPincodes ||
        profileData?.allowedPincodesCount ||
        1,
    ),
    Number(
      subscriptionSummary?.allowedCities ||
        profileData?.allowedCitiesCount ||
        1,
    ),
  );
  const remainingCoverageCount = Math.max(
    0,
    allowedCoverageCount - usedCoverageCount,
  );
  const isCoverageLocked = usedCoverageCount >= allowedCoverageCount;
  const coveragePlanName =
    subscriptionSummary?.planName || profileData?.currentPlan || "Free";

  const handleCoverageUpgradeClick = () => {
    if (coverageUpgradeLoading || coverageRefreshLoading) return;

    const returnTo = safeReturnPath("/provider/profile");
    sessionStorage.setItem("paymentReturnTo", returnTo);
    sessionStorage.setItem("paymentReturnSource", "location-coverage-upgrade");
    setCoverageUpgradeLoading(true);

    navigate("/provider/plans", {
      state: {
        returnTo,
        source: "location-coverage-upgrade",
        reason: "coverage-limit-reached",
      },
    });
  };

  const fetchProfile = async () => {
    try {
      const { data } = await providerAPI.getProfile();
      setPlan(data.currentPlan || "free");
      setProfileData(data);
      try {
        const subscriptionResponse = await providerAPI.getCurrentSubscription();
        setSubscriptionSummary(subscriptionResponse?.data || null);
      } catch (subscriptionError) {
        setSubscriptionSummary(null);
      }
      setCompletion(data.profileCompletion || 0);

      // Only set initial form state once to prevent browser back button or re-renders from overwriting dirty edits
      if (!hasInitialized.current) {
        let locs = [];
        if (
          Array.isArray(data.serviceLocations) &&
          data.serviceLocations.length > 0
        ) {
          locs = data.serviceLocations;
        } else {
          const sourceLocs =
            Array.isArray(data.locations) && data.locations.length > 0
              ? data.locations
              : [data.city, data.state].filter(Boolean);
          locs = sourceLocs.map((l) => ({
            placeId: "",
            name: typeof l === "string" ? l : l.name || "",
            formattedAddress:
              typeof l === "string" ? l : l.formattedAddress || "",
            isLegacy: true,
          }));
        }

        let displayPhoto = data.photo || data.profilePhoto || "";
        // If there's a pending photo, show that as preview
        if (
          data.user?.profilePhotoApproval?.status === "pending" &&
          data.user?.profilePhotoApproval?.pendingUrl
        ) {
          displayPhoto = data.user.profilePhotoApproval.pendingUrl;
        }

        const defaultForm = {
          name: data.user?.name || "",
          skills: data.skills || [],
          locations: locs,
          city: data.city || "",
          state: data.state || "",
          tier: data.tier || "unskilled",
          experience: data.experience || "",
          languages: data.languages || [],
          description: data.description || "",
          portfolioLinks: data.portfolioLinks || [],
          photo: toAbsoluteMediaUrl(displayPhoto),
          whatsappAlerts: data.whatsappAlerts !== false,
          nearestLocation: data.nearestLocation || "",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          pricing: data.pricing || "",
          pricingType: data.pricingType || "",
          location: data.location || null,
          profileName: data.profileName || "",
          phone: data.user?.phone || "",
          resumeUrl: data.resumeUrl || "",
          pricingReason: data.pricingReason || "",
        };

        const userId = data.user?._id || user?._id || "";
        const draftKey = userId ? `lucohire_profile_draft_${userId}` : "lucohire_profile_draft";
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            setForm({
              ...defaultForm,
              ...parsedDraft,
            });
            toast.success("Recovered unsaved draft changes!");
          } catch (e) {
            console.error("Failed to parse profile draft", e);
            setForm(defaultForm);
          }
        } else {
          setForm(defaultForm);
        }

        if (displayPhoto) setPhotoPreview(toAbsoluteMediaUrl(displayPhoto));
        hasInitialized.current = true;
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const addLocation = (loc) => {
    if (!loc) return;
    const normalizedName =
      typeof loc === "string"
        ? loc.trim()
        : (loc.formattedAddress || loc.name || "").trim();
    if (!normalizedName) return;

    // Build the geocoded location object
    const newLoc =
      typeof loc === "string"
        ? {
            placeId: "",
            name: normalizedName,
            formattedAddress: normalizedName,
            isLegacy: true,
          }
        : {
            placeId: loc.placeId || "",
            name: loc.name || "",
            formattedAddress: loc.formattedAddress || "",
            city: loc.city || "",
            state: loc.state || "",
            country: loc.country || "",
            lat: loc.lat ?? loc.latitude ?? null,
            lng: loc.lng ?? loc.longitude ?? null,
            source: loc.source || "google",
          };

    if (
      form.locations.some(
        (l) =>
          (newLoc.placeId && l.placeId === newLoc.placeId) ||
          l.formattedAddress === newLoc.formattedAddress,
      )
    ) {
      return; // Deduplicate
    }

    if (form.locations.length >= maxLocations) {
      if (plan === "free") {
        if (redirectCountdown !== null) return;
        setShowUpgradePrompt(true);
        setRedirectCountdown(3);
        toast.error(
          "Free tier is limited to 1 location. Redirecting to plans...",
        );
      } else {
        toast.error(
          `Your plan allows max ${maxLocations} location${maxLocations > 1 ? "s" : ""}. Upgrade to add more.`,
        );
      }
      return;
    }

    setForm((prev) => {
      const updated = [...prev.locations, newLoc];
      return {
        ...prev,
        locations: updated,
        city: updated[0]?.city || updated[0]?.name || "",
        state: "",
      };
    });
  };

  const removeLocation = (loc) => {
    setForm((prev) => {
      const updated = prev.locations.filter(
        (l) =>
          (loc.placeId && l.placeId !== loc.placeId) ||
          (!loc.placeId && l.formattedAddress !== loc.formattedAddress),
      );
      return {
        ...prev,
        locations: updated,
        city: updated[0]?.city || updated[0]?.name || "",
        state: "",
      };
    });
  };

  const addSkill = (skill) => {
    if (String(plan).toLowerCase() === "free" && form.skills.length >= 1) {
      setShowUpgradePrompt(true);
      toast.error("for free plan you can only use one skill");
      return;
    }
    setForm({ ...form, skills: [...form.skills, skill] });
  };
  const removeSkill = (skill) => {
    const updated = form.skills.filter((s) => s !== skill);
    setForm({ ...form, skills: updated });
    if (String(plan).toLowerCase() === "free" && updated.length <= 1) {
      setShowUpgradePrompt(false);
    }
  };

  const toggleLanguage = (lang) => {
    const langs = form.languages.includes(lang)
      ? form.languages.filter((l) => l !== lang)
      : [...form.languages, lang];
    setForm({ ...form, languages: langs });
  };

  const handleTierChange = (nextTier) => {
    setForm((prev) => ({
      ...prev,
      tier: nextTier,
      skills: prev.skills.filter((skill) =>
        isSkillAllowedForTier(skill, nextTier),
      ),
    }));
    setAiSuggestion(null);
    setPricingSuggestion(null);
  };

  const handleAISuggest = async () => {
    if (!aiInput.trim()) {
      toast.error("Enter a short profile intro for AI suggestions");
      return;
    }

    setAiLoading(true);
    try {
      const payload = {
        userId: user?._id,
        freeText: aiInput,
        skillLevel: form.tier,
        experience: form.experience,
        selectedSpecialities: form.skills,
        selectedLocations: form.locations,
        preferredLocation:
          form.location || form.locations?.[0] || form.city || "",
        payoutType: form.pricingType || "hourly",
        planContext: {
          skillLevel: form.tier,
          baseSpecialityPrice: Number(form.pricing || 0) || 0,
          demandMultiplier: form.city ? 1.1 : 1,
          locationMultiplier: 1,
        },
      };

      if (import.meta.env.DEV) {
        console.log("[AIProfileAssistant] request payload", payload);
      }

      const { data } = await providerAPI.providerBuilderSuggestion(payload);

      if (import.meta.env.DEV) {
        console.log("[AIProfileAssistant] response payload", data);
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.message || "Invalid AI response");
      }

      const profile = data.data;
      setAiSuggestion({ ...profile, aiInput });
      setAiMeta({
        headline: profile.title || "",
        category: profile.skillLevel || "",
        detectedLocation:
          profile.suggestedLocations?.[0]?.city ||
          profile.suggestedLocations?.[0]?.formattedAddress ||
          "",
        skills: profile.suggestedSpecialities?.map((item) => item.name) || [],
        suggestedPricingRange: profile.pricing
          ? `₹${profile.pricing.perHour} / ₹${profile.pricing.perDay} / ₹${profile.pricing.perMonth}`
          : "",
        experienceLabel: form.experience || "",
        missingFields: [],
        status: data.source || "ai",
      });
      toast.success("AI suggestion ready for preview");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[AIProfileAssistant] error", err);
      }
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate AI suggestions",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestPricing = async () => {
    const activeSkill = form.skills?.[0];
    const activeCity =
      form.city || form.locations?.[0]?.city || form.locations?.[0]?.name;

    if (!activeSkill) {
      toast.error("Please select at least one Speciality first");
      return;
    }
    if (!activeCity) {
      toast.error("Please specify your Location or City first");
      return;
    }

    setAiLoading(true);
    try {
      const { data } = await providerAPI.getPricingSuggestion({
        skill: activeSkill,
        city: activeCity,
        skillLevel: form.tier,
        experience: form.experience,
      });

      if (data?.pricing) {
        setPricingSuggestion(data);
        toast.success("AI pricing suggestion ready for preview");
      } else {
        toast.error(
          "Could not determine suggested pricing. Please set manually.",
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to suggest pricing",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;

    const suggestedSpecialities = Array.isArray(
      aiSuggestion.suggestedSpecialities,
    )
      ? aiSuggestion.suggestedSpecialities
      : [];
    const suggestedLocations = Array.isArray(aiSuggestion.suggestedLocations)
      ? aiSuggestion.suggestedLocations
      : [];
    const nextMode = aiSuggestion.mode === "append" ? "append" : "replace";

    const nextSkills =
      nextMode === "append"
        ? [
            ...new Set([
              ...form.skills,
              ...suggestedSpecialities.map((item) => item.name),
            ]),
          ]
        : suggestedSpecialities.map((item) => item.name);
    const nextLocations =
      nextMode === "append"
        ? [...form.locations, ...suggestedLocations]
        : suggestedLocations;

    const firstLocation = nextLocations[0] || null;
    const selectedPricingType = form.pricingType || "hourly";
    const pricingValue = aiSuggestion.pricing
      ? String(
          Math.round(
            Number(
              selectedPricingType === "daily"
                ? aiSuggestion.pricing.perDay
                : selectedPricingType === "monthly"
                  ? aiSuggestion.pricing.perMonth
                  : aiSuggestion.pricing.perHour,
            ) || 0,
          ),
        )
      : form.pricing;

    setForm((prev) => ({
      ...prev,
      skills: nextSkills.slice(
        0,
        String(plan).toLowerCase() === "free" ? 1 : nextSkills.length,
      ),
      locations: nextLocations.slice(
        0,
        String(plan).toLowerCase() === "free" ? 1 : maxLocations,
      ),
      city: firstLocation?.city || prev.city,
      state: firstLocation?.state || prev.state,
      nearestLocation:
        firstLocation?.formattedAddress ||
        firstLocation?.city ||
        prev.nearestLocation,
      latitude: firstLocation?.lat ?? prev.latitude,
      longitude: firstLocation?.lng ?? prev.longitude,
      pricing: pricingValue,
      pricingType: selectedPricingType,
      description: aiSuggestion.description || prev.description,
    }));

    setAiSuggestion(null);
    setPricingSuggestion(null);
    toast.success("AI suggestion applied to your profile draft");
  };

  const applyPricingSuggestion = () => {
    if (!pricingSuggestion?.pricing) return;

    const selectedType = form.pricingType || "hourly";
    const amount =
      selectedType === "daily"
        ? pricingSuggestion.pricing.perDay
        : selectedType === "monthly"
          ? pricingSuggestion.pricing.perMonth
          : pricingSuggestion.pricing.perHour;

    setForm((prev) => ({
      ...prev,
      pricing: String(Math.round(Number(amount) || 0)),
      pricingType: selectedType,
    }));
    setPricingSuggestion(null);
    toast.success("AI pricing suggestion applied to your draft");
  };

  const handleAISuggestVisibility = () => {
    toast.success(
      "Upgrade your visibility plan for premium placements and direct recruiter leads!",
    );
    const banner = document.getElementById("visibility-banner");
    if (banner) {
      banner.scrollIntoView({ behavior: "smooth", block: "center" });
      banner.classList.add("ring-4", "ring-violet-400", "scale-[1.02]");
      setTimeout(() => {
        banner.classList.remove("ring-4", "ring-violet-400", "scale-[1.02]");
      }, 1500);
    } else {
      navigate("/provider/plans");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      fileInputRef.current?.click();
      return;
    }
    if (uploading) return; // Early guard — already uploading

    // Validate size & MIME type
    const validation = validateUploadFile(photoFile, { maxSizeMB: 5 });
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    let finalFile = photoFile;
    const toastId = toast.loading("Optimizing image...");

    try {
      const compressionResult = await compressImage(photoFile, {
        maxSizeKB: 300,
      });
      if (compressionResult.optimized) {
        finalFile = compressionResult.compressedFile;
        const originalKB = (compressionResult.originalSize / 1024).toFixed(0);
        const compressedKB = (compressionResult.compressedSize / 1024).toFixed(
          0,
        );
        toast.success(
          `Image optimized! Size reduced from ${originalKB}KB to ${compressedKB}KB`,
          { id: toastId },
        );
      } else {
        toast.success("Uploading optimized image...", { id: toastId });
      }
    } catch (compressErr) {
      console.warn("Compression failed, uploading original:", compressErr);
      toast.error("Optimization skipped, uploading original...", {
        id: toastId,
      });
    }

    const fd = new FormData();
    fd.append("profilePhoto", finalFile);
    try {
      const { data } = await providerAPI.uploadProfilePhoto(fd);
      setPhotoFile(null);
      if (data?.url) {
        // Use cache-busted URL so browser doesn't serve stale cached photo
        const absoluteUrl = toAbsoluteMediaUrl(data.url);
        const freshUrl = cacheBustedUrl(absoluteUrl);
        setPhotoPreview(freshUrl);
        setForm((prev) => ({ ...prev, photo: absoluteUrl })); // store clean URL in form
      }
      await fetchUser();
      hasInitialized.current = false;
      await fetchProfile();
      toast.success("Profile photo updated successfully!");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Photo upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPreview("");
    setPhotoFile(null);
    setForm((f) => ({ ...f, photo: "" }));
    try {
      await providerAPI.deleteProfilePhoto();
      await fetchUser();
      hasInitialized.current = false;
      await fetchProfile();
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo from server");
    }
  };

  const handleSave = withSaveLock(async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!form.city && form.locations.length === 0) {
      return toast.error(
        "Please add at least one service location / city (Location is mandatory)",
      );
    }
    if (form.skills.length === 0) {
      return toast.error("Please select at least one role (Role is mandatory)");
    }
    const cleanPhone = String(form.phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return toast.error(
        "Please enter a valid 10-digit WhatsApp/Contact number (Contact number is mandatory)",
      );
    }
    if (!form.pricing || Number(form.pricing) <= 0) {
      return toast.error(
        "Please enter a valid payout / pricing rate (Payout is mandatory)",
      );
    }
    if (!form.pricingType) {
      return toast.error(
        "Please select a pricing unit (Pricing Unit is mandatory)",
      );
    }
    if (
      !form.tier ||
      !["unskilled", "semi-skilled", "skilled"].includes(form.tier)
    ) {
      return toast.error(
        "Please select a skill tier (Skill tier is mandatory)",
      );
    }

    if (String(plan).toLowerCase() === "free" && form.skills.length > 1) {
      const card = document.getElementById("role-skills-card");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return toast.error(
        "For free plan you can only use one skill. Please upgrade your plan or remove extra roles.",
      );
    }

    setSaving(true);
    try {
      const cleanLocations = form.locations
        .map((l) => l.formattedAddress || l.name || String(l))
        .filter(Boolean);
      const cleanServiceLocations = form.locations.map((l) => ({
        placeId: l.placeId || l.googlePlaceId || "",
        googlePlaceId: l.googlePlaceId || l.placeId || "",
        inputText: l.inputText || l.formattedAddress || l.name || "",
        name: l.name || l.locality || "",
        formattedAddress: l.formattedAddress || "",
        city: l.city || "",
        state: l.state || "",
        country: l.country || "",
        locality: l.locality || l.name || l.city || "",
        postalCode: l.postalCode || "",
        lat: l.lat ?? null,
        lng: l.lng ?? null,
        viewport: l.viewport || null,
        source: l.source || "google",
      }));

      // Build payload and sanitize string fields only
      const rawPayload = {
        name: form.name,
        skills: form.skills,
        tier: form.tier,
        experience: form.experience,
        city: form.city,
        state: form.state,
        locations: cleanLocations,
        serviceLocations: cleanServiceLocations,
        languages: form.languages,
        description: form.description,
        portfolioLinks: form.portfolioLinks,
        whatsappAlerts: form.whatsappAlerts,
        nearestLocation: form.nearestLocation,
        latitude: form.latitude,
        longitude: form.longitude,
        pricing: form.pricing,
        pricingType: form.pricingType,
        profileName: form.profileName,
        phone: cleanPhone,
        resumeUrl: form.resumeUrl,
      };
      // sanitizePayload only touches string fields, leaves arrays/numbers intact
      const payload = sanitizePayload(rawPayload);
      // Restore non-string array/object fields after sanitize
      payload.skills = rawPayload.skills;
      payload.languages = rawPayload.languages;
      payload.portfolioLinks = rawPayload.portfolioLinks;
      payload.locations = rawPayload.locations;
      payload.serviceLocations = rawPayload.serviceLocations;

      const { data } = await providerAPI.updateProfile(payload);
      setCompletion(data.profileCompletion || completion);
      const userId = profileData?.user?._id || user?._id || "";
      const draftKey = userId ? `lucohire_profile_draft_${userId}` : "lucohire_profile_draft";
      localStorage.removeItem(draftKey);
      toast.success("Profile updated successfully!");
      hasInitialized.current = false;
      await fetchProfile();
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  });

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      toast.error("Please choose a document first");
      return;
    }

    // Validate document file size and type constraints
    const validation = validateUploadFile(documentFile, { maxSizeMB: 5 });
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploadingDocument(true);
    let finalFile = documentFile;
    const toastId = toast.loading("Uploading document...");

    // If the document is an image format, optimize it safely to target under 1MB
    if (documentFile.type?.startsWith("image/")) {
      try {
        toast.loading("Optimizing document image...", { id: toastId });
        const compressResult = await compressImage(documentFile, {
          maxSizeKB: 1000,
        });
        if (compressResult.optimized) {
          finalFile = compressResult.compressedFile;
        }
      } catch (err) {
        console.warn("Document image optimization skipped:", err);
      }
    }

    toast.loading("Uploading...", { id: toastId });

    const formData = new FormData();
    formData.append("document", finalFile);

    try {
      const { data } = await providerAPI.uploadDocument(formData);
      setDocumentVerification(data.verification || null);
      setDocumentFile(null);
      toast.success(
        "Document uploaded successfully. OCR verification started.",
        { id: toastId },
      );
      await fetchProfile();
    } catch (err) {
      const msg = err?.response?.data?.message || "Document upload failed";
      toast.error(msg, { id: toastId });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleOcrTest = async () => {
    if (!documentFile) {
      toast.error("Please choose a document image first");
      return;
    }

    if (!documentFile.type?.startsWith("image/")) {
      toast.error("OCR test supports image files only (JPG/PNG/WEBP)");
      return;
    }

    const formData = new FormData();
    formData.append("image", documentFile);
    setOcrTesting(true);
    setOcrError("");
    setOcrResult(null);

    try {
      const response =
        ocrTestType === "text"
          ? await aiAPI.ocrText(formData)
          : await aiAPI.ocrDocument(formData);

      setOcrResult(response.data?.data || {});
      toast.success("OCR test completed");
    } catch (err) {
      const message = err?.response?.data?.message || "OCR test failed";
      setOcrError(message);
      toast.error(message);
    } finally {
      setOcrTesting(false);
    }
  };

  if (loading) return <RouteLoader />;

  const avatarSrc = photoPreview || form.photo;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Manage Profile
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Customise your public listing, service areas, and AI optimizations.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Plan:
            </span>
            <span className="text-xs text-violet-700 font-black uppercase tracking-wider bg-violet-50 px-3 py-1 rounded-xl border border-violet-100">
              {plan ? plan.toUpperCase() : "FREE"}
            </span>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {isDirty && hasInitialized.current && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-4 rounded-[20px] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-400/50 animate-fade-in backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <p className="font-extrabold text-sm tracking-wide">
                  Unsaved Profile Changes
                </p>
                <p className="text-xs text-amber-55 mt-0.5">
                  You have unsaved edits in your profile draft. Click save in the footer below to update your public details.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-white text-orange-600 font-extrabold rounded-xl hover:bg-slate-50 active:scale-95 transition text-xs shrink-0 shadow-md"
            >
              {saving ? "Saving..." : "Save Draft Now"}
            </button>
          </div>
        )}

        {/* ── Section 1: Compact Hero Profile Row ── */}
        <div className="bg-white rounded-[15px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden min-h-[130px] md:h-[130px] mb-8 flex flex-col md:flex-row items-stretch">
          {/* Left Area: AI Resume Upload (70% Width) */}
          <div className="w-full md:w-[70%] p-6 flex flex-col justify-center">
            <ProviderAIChat
              inline={true}
              profileContext={{
                userId: user?._id,
                name: form.name,
                phone: form.phone,
                city: form.city,
                category: form.skills?.[0] || "",
                experience: form.experience,
                experienceMonths: inferExperienceMonths(form.experience),
                skillTier: form.tier,
                languages: form.languages,
                skills: form.skills,
                pricing: form.pricing,
                pricingType: form.pricingType,
                description: form.description,
                locations: form.locations,
                portfolioLinks: form.portfolioLinks,
                whatsappAlerts: form.whatsappAlerts,
                resumeApproval: profileData?.user?.resumeApproval,
              }}
              missingFields={(() => {
                const missing = [];
                if (!form.city && form.locations.length === 0)
                  missing.push("Location / City");
                if (form.skills.length === 0)
                  missing.push("Speciality / Skill");
                const cleanPhone = String(form.phone || "").replace(
                  /\D/g,
                  "",
                );
                if (!cleanPhone || cleanPhone.length < 10)
                  missing.push("WhatsApp / Contact Number");
                if (!form.pricing || Number(form.pricing) <= 0)
                  missing.push("Payout / Pricing Rate");
                if (!form.pricingType) missing.push("Pricing Unit");
                if (
                  !form.description ||
                  String(form.description).trim().length < 20
                )
                  missing.push("Profile Bio / Description");
                return missing;
              })()}
              onUpdateField={(field, value) => {
                setForm((prev) => {
                  const next = { ...prev };
                  if (field === "city" || field === "location") {
                    next.city = value;
                    next.nearestLocation = value;
                    if (value) {
                      const maxLocs = plan === "free" ? 1 : maxLocations;
                      if (!next.locations.includes(value)) {
                        const combined = [...next.locations, value];
                        next.locations = combined.slice(-maxLocs);
                      }
                    }
                  } else if (field === "skills") {
                    let combined = [];
                    if (Array.isArray(value)) {
                      combined = [...new Set([...next.skills, ...value])];
                    } else if (typeof value === "string" && value) {
                      combined = [...new Set([...next.skills, value])];
                    }
                    const maxSkills =
                      String(plan).toLowerCase() === "free"
                        ? 1
                        : combined.length;
                    next.skills = combined.slice(0, maxSkills);
                  } else if (field === "phone") {
                    next.phone = value;
                  } else if (field === "pricing") {
                    next.pricing = String(value);
                  } else if (field === "pricingType") {
                    next.pricingType = value;
                  } else if (field === "name" || field === "profileName") {
                    next.name = value;
                    next.profileName = value;
                  } else if (field === "experience") {
                    next.experience = value;
                  } else if (field === "description") {
                    next.description = value;
                  } else if (field === "languages") {
                    next.languages = value;
                  } else if (field === "portfolioLinks") {
                    next.portfolioLinks = value;
                  } else if (field === "bulk" && value && typeof value === "object") {
                    Object.keys(value).forEach((k) => {
                      next[k] = value[k];
                    });
                  }
                  return next;
                });
              }}
            />
          </div>

          {/* Right Area: Profile Strength (30% Width) */}
          <div className="w-full md:w-[30%] p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-slate-100 ">
            <div className="flex items-center gap-4 my-1">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    className="text-slate-100"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    className="text-violet-600 transition-all duration-500"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={
                      2 * Math.PI * 30 -
                      (completion / 100) * (2 * Math.PI * 30)
                    }
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute font-black text-slate-800 text-sm">
                  {completion}%
                </div>
              </div>
              <div className="text-left flex flex-col gap-1 shrink-0">
                <span className="font-extrabold text-slate-800 text-xs">Profile Strength</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide text-center w-fit ${
                    completion >= 80
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : completion >= 50
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  {completion >= 80
                    ? "Excellent"
                    : completion >= 50
                      ? "Good"
                      : "Weak"}
                </span>
               
              </div>
            </div>

            {/* Strength Checklist */}
            <div className="space-y-1 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-2 w-full flex flex-row flex-wrap justify-between gap-x-2 gap-y-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                {form.skills.length > 0 ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                <span>Roles</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {documentVerification?.status === "approved" ||
                profileData?.user?.approvalStatus === "approved" ||
                profileData?.isApproved ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                <span>Docs</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {form.portfolioLinks.length > 0 ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                <span>Links</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {form.pricing && form.pricingType ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                <span>Rates</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Auto-Fill Modal ── */}
        <AIProfileAutoFillModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApply={handleAiAutoFillApply}
        />

        {/* ── SECTION 2: 2-Column Desktop Grid with Equal Heights ── */}
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
        >
          {/* Row 1 Card 1: Basic Information */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
              <UserIcon className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Basic Information</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Personal contact details</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      profileName: e.target.value,
                    })
                  }
                  placeholder="e.g. Sujit"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-slate-50/50 shadow-inner transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  WhatsApp / Contact Number
                </label>
                <div className="flex gap-2">
                  <div className="w-24 shrink-0 relative">
                    <select
                      value={
                        form.phone?.startsWith("+")
                          ? form.phone.substring(0, 3)
                          : "+91"
                      }
                      onChange={(e) => {
                        const currentVal = form.phone || "";
                        const cleanNum = currentVal.replace(/^\+\d+\s*/, "");
                        setForm({
                          ...form,
                          phone: `${e.target.value} ${cleanNum}`,
                        });
                      }}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 appearance-none shadow-inner"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={form.phone?.replace(/^\+\d+\s*/, "")}
                    onChange={(e) => {
                      const cleanPhone = e.target.value
                        .replace(/\D/g, "")
                        .substring(0, 10);
                      const prefix = form.phone?.startsWith("+")
                        ? form.phone.split(" ")[0]
                        : "+91";
                      setForm({ ...form, phone: `${prefix} ${cleanPhone}` });
                    }}
                    placeholder="7410258963"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-slate-50/50 shadow-inner transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 1 Card 2: Profile Photo */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
              <Camera className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Profile Photo</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Upload your profile portrait</p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-violet-100 shadow-md overflow-hidden bg-slate-50 flex items-center justify-center relative shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-xs">
                    <RefreshCw className="w-4 h-4 text-violet-600 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-slate-800 text-xs truncate">
                  Upload Profile Portrait
                </p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  JPG/PNG, max size 5MB
                </p>
                {profileData?.user?.profilePhotoApproval?.status === "pending" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase border border-amber-200 mt-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending
                  </span>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={
                      photoFile
                        ? handlePhotoUpload
                        : () => fileInputRef.current?.click()
                    }
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-violet-700 hover:shadow-md transition duration-200 disabled:opacity-50"
                  >
                    {photoFile ? "Save" : "Change"}
                  </button>

                  {(avatarSrc || photoFile) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 Card 1: Location (Service Area) */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full relative transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
              <MapPin className="w-5 h-5 text-violet-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Location (Service Area)</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  {allowedCoverageCount > 1
                    ? `Max ${allowedCoverageCount} service locations allowed`
                    : "1 service location allowed"}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative z-30">
                  <LocationSearch
                    value={form.nearestLocation || form.city}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, city: value }))
                    }
                    onSelect={(item) => {
                      if (!item) return;

                      const newLoc = {
                        placeId: item.placeId || "",
                        name: item.city || item.name || "",
                        formattedAddress:
                          item.formattedAddress || item.name || "",
                        city: item.city || "",
                        state: item.state || "",
                        country: item.country || "",
                        lat: item.latitude ?? item.lat ?? null,
                        lng: item.longitude ?? item.lng ?? null,
                        source: "google",
                      };

                      const displayLabel =
                        newLoc.formattedAddress || newLoc.name;

                      // Duplicate Check
                      const isDuplicate = form.locations.some(
                        (l) =>
                          (newLoc.placeId && l.placeId === newLoc.placeId) ||
                          l.formattedAddress === newLoc.formattedAddress,
                      );

                      if (isDuplicate) {
                        setForm((prev) => ({
                          ...prev,
                          nearestLocation: displayLabel,
                          latitude: newLoc.lat ?? prev.latitude,
                          longitude: newLoc.lng ?? prev.longitude,
                          location: item,
                        }));
                        return;
                      }

                      // Plan Limit Check
                      if (form.locations.length >= maxLocations) {
                        toast.error(
                          `Your plan allows max ${maxLocations} location${maxLocations > 1 ? "s" : ""}. Upgrade to add more.`,
                        );
                        setForm((prev) => ({
                          ...prev,
                          nearestLocation: displayLabel,
                          latitude: newLoc.lat ?? prev.latitude,
                          longitude: newLoc.lng ?? prev.longitude,
                          location: item,
                        }));
                        return;
                      }

                      setForm((prev) => {
                        const updated = [...prev.locations, newLoc];
                        return {
                          ...prev,
                          locations: updated,
                          city: newLoc.city || newLoc.name,
                          state: newLoc.state || "",
                          nearestLocation: displayLabel,
                          latitude: newLoc.lat ?? prev.latitude,
                          longitude: newLoc.lng ?? prev.longitude,
                          location: item,
                        };
                      });
                    }}
                    placeholder="Search service location..."
                  />
                </div>

                {/* Compact auto-wrapped location chips */}
                {form.locations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.locations.slice(0, 2).map((loc) => {
                      const displayLabel =
                        loc.formattedAddress || loc.name || String(loc);
                      const key = loc.placeId || displayLabel;
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs shrink-0"
                        >
                          <MapPin className="w-3 h-3 text-violet-400 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {displayLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLocation(loc)}
                            className="text-violet-400 hover:text-red-500 transition leading-none text-base font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {form.locations.length > 2 && (
                      <span className="inline-flex items-center bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-xs">
                        + {form.locations.length - 2} More
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-[10px] italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No service areas added.
                  </div>
                )}
              </div>

              {isCoverageLocked && !coverageUpgradeLoading && (
                <div className="flex items-center justify-end mt-4">
                  <div className="flex items-center gap-2 text-[10px] text-amber-800 bg-red-50/90 px-2.5 py-1.5 rounded-lg border border-red-200/40 font-bold max-w-full">
                    <span>⚡ Max location selected:</span>
                    <button
                      type="button"
                      onClick={handleCoverageUpgradeClick}
                      className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition shrink-0 shadow-xs"
                    >
                      Upgrade your plan to expand your reach
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2 Card 2: Role & Skill Level */}
          <div id="role-skills-card" className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-violet-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Role</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {String(plan).toLowerCase() === "free"
                      ? "First Role is Free"
                      : "Unlimited Roles Unlocked"}
                  </p>
                </div>
              </div>

              {String(plan).toLowerCase() === "free" && (form.skills.length > 1 || showUpgradePrompt) && (
                <div className="flex items-center gap-2 text-[10px] text-amber-800 bg-red-50/90 px-2.5 py-1.5 rounded-lg border border-red-200/40 font-bold max-w-full">
                  <span>for free plan you can only use one skill</span>
                  <button
                    type="button"
                    onClick={() => navigate("/provider/plans")}
                    className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition shrink-0 shadow-xs"
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="relative">
                <SkillSearchSelect
                  selected={form.skills}
                  onAdd={addSkill}
                  onRemove={removeSkill}
                  tier={form.tier}
                  maxAllowed={999}
                  plan={plan}
                  onTriggerUpgrade={null}
                />

                {String(plan).toLowerCase() === "free" && showUpgradePrompt && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl animate-pulse">
                    <p className="text-[10px] text-amber-800 font-bold leading-normal">
                      {redirectCountdown !== null
                        ? `Redirecting in ${redirectCountdown}s...`
                        : "Upgrade to select multiple roles."}
                    </p>
                  </div>
                )}
              </div>



              {/* Smart Skill Level (AI Recommended) */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span className="font-extrabold text-slate-800 text-xs">
                    Smart Skill Level (AI Recommended)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "unskilled",
                      label: "Unskilled",
                      desc: "Basic help",
                    },
                    {
                      value: "semi-skilled",
                      label: "Semi Skilled",
                      desc: "Some experience",
                    },
                    {
                      value: "skilled",
                      label: "Skilled",
                      desc: "Experienced",
                    },
                  ].map((card) => {
                    const isActive = form.tier === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => handleTierChange(card.value)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[75px] relative transition-all duration-300 w-full hover:scale-[1.02] active:scale-98 ${
                          isActive
                            ? "border-violet-600 bg-violet-50/30 shadow-xs"
                            : "border-slate-200/60 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 bg-violet-600 text-white rounded-full p-0.5 animate-scale-up shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <h4 className="font-extrabold text-slate-800 text-[10px] leading-tight">
                          {card.label}
                        </h4>
                        <p className="text-[8px] text-slate-400 font-semibold leading-tight mt-1">
                          {card.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3 Card 1: Languages Spoken (Max height 250px) */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col h-[250px] max-h-[250px] overflow-y-auto transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 mb-3 shrink-0">
              <Globe className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Languages Spoken</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Recruiter preferred languages</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between text-left">
              <p className="text-[11px] font-extrabold text-slate-650 mt-1 mb-3 leading-normal shrink-0">
                Select native / preferred languages to connect with Recruiters better.
              </p>

              <div className="flex-1">
                <SmartMultiSelect
                  selectedValues={form.languages}
                  onChange={(nextLangs) => {
                    setForm((prev) => ({ ...prev, languages: nextLangs }));
                  }}
                  allowCustom
                  placeholder="Search language..."
                />
              </div>
            </div>
          </div>

          {/* Row 3 Card 2: Rate & Payout */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-violet-600 font-black text-base">₹</span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Rate & Payout</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Configure your charges</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAISuggestPricing}
                disabled={aiLoading}
                className="text-[10px] font-black text-violet-700 hover:text-violet-900 transition flex items-center gap-1 bg-violet-50 border border-violet-100 px-2 py-1 rounded-full disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-3 h-3 text-violet-600 ${aiLoading ? "animate-spin" : "animate-pulse"}`} />
                <span>{aiLoading ? "Wait..." : "AI Pricing"}</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              {/* Segmented Control */}
              <div className="bg-slate-100/80 p-1 rounded-xl flex items-center justify-between gap-1 w-full border border-slate-200/30 mb-3 shrink-0">
                {[
                  { value: "hourly", label: "Per Hour" },
                  { value: "daily", label: "Per Day" },
                  { value: "monthly", label: "Per Month" },
                ].map((type) => {
                  const isActive = form.pricingType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, pricingType: type.value })
                      }
                      className={`flex-1 py-1.5 px-3 rounded-lg text-center font-extrabold text-xs transition-all duration-200 ${
                        isActive
                          ? "bg-white text-violet-700 shadow-sm border border-slate-200/10"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative mb-3 shrink-0">
                <div className="absolute left-4 top-2.5 font-extrabold text-slate-400 text-xs">
                  ₹
                </div>
                <input
                  type="text"
                  value={form.pricing}
                  onChange={(e) =>
                    setForm({ ...form, pricing: e.target.value })
                  }
                  placeholder="Enter your rate amount"
                  className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-slate-50/50 shadow-inner transition font-bold"
                />
              </div>

              {form.pricingReason && (
                <div className="mb-3 bg-violet-50/75 p-2 rounded-xl border border-violet-100/40 text-left animate-fadeIn shrink-0">
                  <p className="text-[10px] font-bold text-violet-750 flex items-center gap-1.5 leading-normal">
                    <Sparkles className="w-3 h-3 text-violet-600 shrink-0 animate-pulse" />
                    <span>{form.pricingReason}</span>
                  </p>
                </div>
              )}

              {pricingSuggestion?.pricing && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-2 shrink-0">
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <p className="font-black text-emerald-900">AI Pricing Preview</p>
                    <span className="font-bold text-emerald-700 truncate max-w-[200px]" title={pricingSuggestion.reasoning}>
                      {pricingSuggestion.reasoning}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="rounded-lg bg-white border border-emerald-100 p-1.5">
                      <p className="text-emerald-600 font-bold">Hour</p>
                      <p className="font-extrabold text-emerald-900">₹{pricingSuggestion.pricing.perHour}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-1.5">
                      <p className="text-emerald-600 font-bold">Day</p>
                      <p className="font-extrabold text-emerald-900">₹{pricingSuggestion.pricing.perDay}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-1.5">
                      <p className="text-emerald-600 font-bold">Month</p>
                      <p className="font-extrabold text-emerald-900">₹{pricingSuggestion.pricing.perMonth}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={applyPricingSuggestion}
                    className="w-full py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700 transition"
                  >
                    Apply AI Pricing
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 4 Card 1: Aadhaar Verification */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
              <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Aadhaar Verification</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Identity Verification Status</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-3">
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Verify identity to unlock premium leads and recruiter trust badge opportunities.
              </p>

              <div className="flex flex-col gap-2">
                {/* 35% height reduced compact horizontal dropzone */}
                <div className="border border-dashed border-slate-200 bg-white rounded-xl p-3 flex items-center justify-center gap-3 relative cursor-pointer hover:bg-slate-50 transition h-14 shrink-0 shadow-sm">
                  <UploadCloud className="w-5 h-5 text-slate-400 shrink-0 animate-bounce" />
                  <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                    {documentFile
                      ? documentFile.name
                      : "Select Aadhaar File (PDF/JPG/PNG)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      setDocumentFile(e.target.files?.[0] || null);
                      setOcrResult(null);
                      setOcrError("");
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={uploadingDocument || !documentFile}
                  className="w-full py-2 rounded-xl text-[10px] font-black text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition shadow-sm"
                >
                  {uploadingDocument ? "Uploading..." : "Upload & Verify Aadhaar"}
                </button>
              </div>

              <div className="shrink-0">
                <DocumentVerificationStatusCard verification={documentVerification} />
              </div>
            </div>
          </div>

          {/* Row 4 Card 2: Portfolio / Links */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between min-h-[250px] h-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
              <Link2 className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Portfolio & Links</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Social and website profiles</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <PortfolioLinksManager
                value={form.portfolioLinks}
                onChange={(nextLinks) =>
                  setForm((prev) => ({ ...prev, portfolioLinks: nextLinks }))
                }
              />
            </div>
          </div>

          {/* Row 5 Card 1: Years of Experience (exactly 140px) */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between h-[140px] w-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 shrink-0">
              <Calendar className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Years of Experience</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total experience</p>
              </div>
            </div>
            
            <div className="relative flex-1 flex items-center">
              <select
                value={
                  [
                    "Fresher",
                    "0-1 years",
                    "1-3 years",
                    "3-5 years",
                    "5+ years",
                  ].includes(form.experience)
                    ? form.experience
                    : "3-5 years"
                }
                onChange={(e) =>
                  setForm({ ...form, experience: e.target.value })
                }
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 appearance-none shadow-inner text-slate-700 font-bold"
              >
                <option value="Fresher">Fresher (Entry-level)</option>
                <option value="0-1 years">0-1 years (Junior)</option>
                <option value="1-3 years">1-3 years (Intermediate)</option>
                <option value="3-5 years">3-5 years (Experienced)</option>
                <option value="5+ years">5+ years (Senior Expert)</option>
              </select>
              <div className="absolute right-4 top-[18px] pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Row 5 Card 2: WhatsApp Alerts (exactly 140px) */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between h-[140px] w-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100 shrink-0">
              <svg className="w-5 h-5 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.79 9.79 0 0 0-6.979-2.879C5.036 1.961.612 6.331.608 11.76c-.001 1.673.454 3.305 1.319 4.717L1.139 21.03l4.733-1.229c1.603.953 3.193 1.453 4.832 1.454z" />
              </svg>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">WhatsApp Alerts</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Push Notifications</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between flex-1">
              <span className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-[70%] text-left">
                Get instant real-time notification alerts for job leads.
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    whatsappAlerts: !f.whatsappAlerts,
                  }))
                }
                className={`relative w-11 h-5.5 rounded-full transition-colors duration-200 shrink-0 outline-none ${form.whatsappAlerts ? "bg-emerald-500" : "bg-slate-200"}`}
              >
                <span
                  className={`block w-4.5 h-4.5 bg-white rounded-full shadow absolute top-0.5 transition-transform duration-200 ${form.whatsappAlerts ? "translate-x-5.5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          </div>

          {/* ── Premium Subscription Row ── */}
          <div className="md:col-span-2 space-y-6 pt-4">
            {/* Unlock More Visibility Banner (exactly 70px) */}
            <div
              id="visibility-banner"
              className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 rounded-[20px] px-6 py-3 text-white flex items-center justify-between gap-4 shadow-md h-[70px] shrink-0"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                  <Compass className="w-5 h-5 animate-spin-slow text-violet-100" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-sm tracking-wide truncate">
                    Unlock Premium Search Placements
                  </h4>
                  <p className="text-violet-100 text-[10px] mt-0.5 leading-none truncate">
                    {plan === "free"
                      ? "Showcase multiple specialities, secure top ranks, and unlock unlimited service locations."
                      : `Active: Premium ${plan.toUpperCase()} Plan. High visibility priority active.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/provider/plans")}
                className="bg-white text-violet-700 hover:bg-slate-50 font-black px-4 py-2 rounded-xl transition shadow-sm text-xs shrink-0 active:scale-95"
              >
                {plan === "free" ? "Upgrade Plan →" : "Manage Subscription"}
              </button>
            </div>

            {/* Sticky Footer Save Bar */}
            <div className="sticky bottom-[20px] z-40 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4 max-w-7xl mx-auto w-full mt-8 animate-fadeIn">
              <div className="hidden sm:block text-left">
                <h5 className="font-black text-slate-800 text-xs tracking-tight">Profile Submissions</h5>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Immediate refresh for search results</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    isDirty
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {saving ? "Saving Draft..." : "Save Draft"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Profile</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Premium feature benefit icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-slate-100/60">
              <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <Sparkles className="w-6 h-6 text-violet-600 mb-2" />
                <h5 className="font-extrabold text-slate-800 text-xs">
                  AI Powered
                </h5>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Smart profile optimization recommendations
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-violet-600 mb-2" />
                <h5 className="font-extrabold text-slate-800 text-xs">
                  Verified Badges
                </h5>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  OCR document verified profile trust boosts
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <Compass className="w-6 h-6 text-violet-600 mb-2" />
                <h5 className="font-extrabold text-slate-800 text-xs">
                  Maximum Exposure
                </h5>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Rank at the top in recruiter searches
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <Zap className="w-6 h-6 text-violet-600 mb-2" />
                <h5 className="font-extrabold text-slate-800 text-xs">
                  Instant Opportunities
                </h5>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Get immediate WhatsApp push alerts
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderProfile;
