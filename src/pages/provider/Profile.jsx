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
      localStorage.setItem("lucohire_profile_draft", JSON.stringify(form));
    }
  }, [form, isDirty]);

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
        };

        const savedDraft = localStorage.getItem("lucohire_profile_draft");
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
      if (redirectCountdown !== null) return;
      setShowUpgradePrompt(true);
      setRedirectCountdown(3);
      toast.error(
        "Free tier account cannot choose more than 1 role. Redirecting to plan page...",
      );
      return;
    }
    setForm({ ...form, skills: [...form.skills, skill] });
  };
  const removeSkill = (skill) => {
    const updated = form.skills.filter((s) => s !== skill);
    setForm({ ...form, skills: updated });
    if (String(plan).toLowerCase() === "free" && updated.length < 1) {
      setShowUpgradePrompt(false);
      setRedirectCountdown(null);
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
      localStorage.removeItem("lucohire_profile_draft");
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
              Customise your public listing, service areas, and AI
              optimizations.
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
          <div className="mb-6 bg-linear-to-r from-amber-500 to-orange-500 text-white px-5 py-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-400/50 animate-fade-in backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-lg">
                ⚠️
              </div>
              <div>
                <p className="font-extrabold text-sm tracking-wide">
                  Unsaved Profile Changes
                </p>
                <p className="text-xs text-amber-50 leading-normal mt-0.5">
                  You have unsaved edits in your profile draft. Click save below
                  to update your public details.
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

        {/* ── Top Section: AI Profile Assistant & Profile Strength ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* AI Assistant Card Left */}
            <div className="lg:col-span-2">
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

            {/* Profile Strength Right */}
            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-evenly">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Profile Strength
                </h3>
                <p className="text-slate-400 text-xs">
                  Complete your profile to maximize placement rankings.
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 my-2">
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      className="text-violet-600 transition-all duration-500"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 * Math.PI * 40 -
                        (completion / 100) * (2 * Math.PI * 40)
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute font-black text-slate-800 text-lg">
                    {completion}%
                  </div>
                </div>
                <div className="text-left flex flex-col gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide text-center ${
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
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100/50 text-center">
                    Plan: {plan ? plan.toUpperCase() : "FREE"}
                  </span>
                </div>
              </div>

              {/* Strength Checklist */}
              <div className="space-y-2 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  {form.skills.length > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>Add more roles</span>
                </div>
                <div className="flex items-center gap-2">
                  {documentVerification?.status === "approved" ||
                  profileData?.user?.approvalStatus === "approved" ||
                  profileData?.isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>Verify your documents</span>
                </div>
                <div className="flex items-center gap-2">
                  {form.portfolioLinks.length > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>Add portfolio links</span>
                </div>
                <div className="flex items-center gap-2">
                  {form.pricing && form.pricingType ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>Set pricing & services</span>
                </div>
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

        {/* ── Two-Column Main Layout ── */}
        {/* <div className="flex justify-end mb-4">
           <button
             type="button"
             onClick={() => setIsAiModalOpen(true)}
             className="inline-flex items-center gap-2 bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-violet-500/25 transition-all animate-pulse hover:animate-none"
           >
             <Sparkles className="w-4 h-4" />
             Fill with AI ✨
           </button>
        </div> */}

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
        >
          {/* LEFT COLUMN: Basic Information, Location, Languages, Experience, Aadhaar */}
          <div className="space-y-8">
            {/* 1. Basic Information */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <UserIcon className="w-5 h-5 text-violet-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Basic Information
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                    placeholder="e.g. Mritunjay kumar jha"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-slate-50/50 shadow-inner transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none bg-slate-50/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 appearance-none shadow-inner"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+971">+971 (AE)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
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
                      placeholder="08376022337"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-slate-50/50 shadow-inner transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Location (Service Area) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <MapPin className="w-5 h-5 text-violet-600" />
                <div className="flex-1">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Location (Service Area)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {allowedCoverageCount > 1
                      ? `Max ${allowedCoverageCount} service locations allowed`
                      : "1 service location allowed"}
                  </p>
                </div>
              </div>

              {/* <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {coveragePlanName} plan
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      You have used {usedCoverageCount} of{" "}
                      {allowedCoverageCount} service locations in your current
                      plan.
                    </p>
                    <p className="mt-1 text-xs font-semibold text-violet-700">
                      {coverageRefreshLoading
                        ? "Refreshing latest subscription limits..."
                        : `${remainingCoverageCount} location${remainingCoverageCount === 1 ? "" : "s"} remaining.`}
                    </p>
                  </div>

                  {isCoverageLocked && (
                    <button
                      type="button"
                      onClick={handleCoverageUpgradeClick}
                      disabled={
                        coverageUpgradeLoading || coverageRefreshLoading
                      }
                      aria-label="Expand service reach by upgrading your plan"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {coverageUpgradeLoading
                        ? "Opening Plans..."
                        : "Expand Service Reach"}
                    </button>
                  )}
                </div>
              </div> */}

              <div className="space-y-4">
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
                    placeholder="Search and add a service location"
                  />
                </div>

                {/* Location chips */}
                {form.locations.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {form.locations.map((loc) => {
                      const displayLabel =
                        loc.formattedAddress || loc.name || String(loc);
                      const key = loc.placeId || displayLabel;
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-xs"
                        >
                          <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span className="truncate max-w-[200px]">
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
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No service areas added. Search above to boost visibility
                    coverage.
                  </div>
                )}

                {isCoverageLocked && !coverageUpgradeLoading && (
                  <p
                  onClick={()=>navigate('/')} 
                  className="text-[10px] text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100/50 font-semibold flex items-center gap-1">
                    <span>⚡</span> Upgrade your plan to expand your service
                    reach to multiple pincodes or cities.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Languages Spoken */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 min-h-[220px] flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <Globe className="w-5 h-5 text-violet-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Languages Spoken
                </h3>
              </div>

              <p className="text-[15px] font-extrabold text-slate-900 mt-4 mb-5">
                Select your native or preferred languages to help Recruiter
                connect with you better.
              </p>

              <div className="flex-1">
                <SmartMultiSelect
                  selectedValues={form.languages}
                  onChange={(nextLangs) => {
                    setForm((prev) => ({ ...prev, languages: nextLangs }));
                  }}
                  allowCustom
                  placeholder="Search or type language"
                />
              </div>
            </div>

            {/* 4. Aadhaar Verification */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-3 space-y-3.5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <ShieldCheck className="w-5 h-5 text-violet-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Aadhaar Verification
                </h3>
              </div>

              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">
                  Verify your identity to build recruiter trust and unlock
                  premium job opportunities.
                </p>

                <div className="flex flex-col gap-3 justify-center">
                  <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-4 flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-50 transition">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-slate-500">
                      {documentFile
                        ? documentFile.name
                        : "Select Aadhaar Document Image (PDF/JPG/PNG)"}
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
                    className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition shadow-md hover:shadow-violet-200"
                  >
                    {uploadingDocument
                      ? "Uploading Document…"
                      : "Upload & Verify Aadhaar"}
                  </button>
                </div>

                <div className="mt-3">
                  <DocumentVerificationStatusCard
                    verification={documentVerification}
                  />
                </div>

                {/* Collapsible/Hidden Sandbox OCR Test Section (Visible to Admins / Developers in dev mode)
                {import.meta.env.DEV && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setShowLinkInput((v) => !v)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
                    >
                      🛠️ Open Developer OCR Sandbox
                    </button>

                    {showLinkInput && (
                      <div className="mt-2 space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={ocrTestType}
                            onChange={(e) => setOcrTestType(e.target.value)}
                            className="px-2 py-1 text-[11px] rounded border border-slate-200 bg-slate-50"
                          >
                            {OCR_TEST_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleOcrTest}
                            disabled={ocrTesting}
                            className="px-3 py-1 rounded bg-slate-800 text-white text-[10px] font-bold hover:bg-slate-700"
                          >
                            {ocrTesting ? "Running..." : "Execute Test"}
                          </button>
                        </div>
                        {ocrError && (
                          <p className="text-[10px] text-red-500">{ocrError}</p>
                        )}
                        {ocrResult && (
                          <pre className="text-[9px] text-slate-600 bg-slate-50 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                            {JSON.stringify(ocrResult, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )} */}
              </div>
            </div>

            {/* 5. Years of Experience */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <Calendar className="w-5 h-5 text-violet-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Years of Experience
                </h3>
              </div>

              <div className="relative">
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
                      : "3-5 years" // Default or fallback
                  }
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 outline-none bg-slate-50/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 appearance-none shadow-inner text-slate-700 font-semibold"
                >
                  <option value="Fresher">Fresher (Entry-level)</option>
                  <option value="0-1 years">0-1 years (Junior)</option>
                  <option value="1-3 years">1-3 years (Intermediate)</option>
                  <option value="3-5 years">3-5 years (Experienced)</option>
                  <option value="5+ years">5+ years (Senior Expert)</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Profile Photo, Speciality, Rate, WhatsApp Alerts, Portfolio */}
          <div className="space-y-8">
            {/* 1. Profile Photo */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center relative">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50 w-full">
                <Camera className="w-5 h-5 text-violet-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Profile Photo
                </h3>
              </div>

              <div className="w-23 h-23 rounded-full border-4 border-violet-100 shadow-lg overflow-hidden bg-slate-50 flex flex-col items-center justify-center gap-4 relative shadow-inner">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-xs">
                    <RefreshCw className="w-5 h-5 text-violet-600 animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">
                  Upload Profile Portrait
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 mb-2">
                  JPG or PNG formats, maximum size 5MB
                </p>
                {profileData?.user?.profilePhotoApproval?.status ===
                  "pending" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black tracking-wide uppercase border border-amber-200 shadow-sm mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending Approval
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    photoFile
                      ? handlePhotoUpload
                      : () => fileInputRef.current?.click()
                  }
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-full bg-violet-600 text-white text-xs font-black hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200 transition disabled:opacity-50 shadow-md"
                >
                  {photoFile ? "Save New Photo" : "Change Photo"}
                </button>

                {(avatarSrc || photoFile) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-50 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* 2. Role (1 Free) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <Award className="w-5 h-5 text-violet-600" />
                <div className="flex-1">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Role
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {String(plan).toLowerCase() === "free"
                      ? "First Role is Free"
                      : "Unlimited Roles Unlocked"}
                  </p>
                </div>
              </div>

              <SkillSearchSelect
                selected={form.skills}
                onAdd={addSkill}
                onRemove={removeSkill}
                tier={form.tier}
                maxAllowed={(() => {
                  if (!profileData || String(plan).toLowerCase() === "free")
                    return 1;
                  return 999; // Unlimited for upgraded plans
                })()}
                plan={plan}
                onTriggerUpgrade={() => {
                  if (redirectCountdown !== null) return;
                  setShowUpgradePrompt(true);
                  setRedirectCountdown(3);
                  toast.error(
                    "Free tier account cannot choose more than 1 role. Redirecting to plan page...",
                  );
                }}
              />

              {String(plan).toLowerCase() === "free" && showUpgradePrompt && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl animate-pulse">
                  <p className="text-xs text-amber-800 font-bold leading-normal">
                    {redirectCountdown !== null
                      ? `Free tier account cannot choose more than 1 role. Redirecting to plan page in ${redirectCountdown}s...`
                      : "Your free tier allows 1 role boost. Upgrade to select multiple roles."}
                  </p>

                  {redirectCountdown === null && (
                    <button
                      type="button"
                      onClick={() => navigate("/provider/plans")}
                      className="mt-2.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-full shadow-md hover:shadow-violet-200 transition"
                    >
                      Choose Plan
                    </button>
                  )}
                </div>
              )}

              {/* Smart Skill Level (AI Recommended) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="font-extrabold text-slate-800 text-xs">
                    Smart Skill Level (AI Recommended)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      value: "unskilled",
                      label: "Unskilled",
                      desc: "Basic assistance no experience",
                    },
                    {
                      value: "semi-skilled",
                      label: "Semi Skilled",
                      desc: "Some experience in the field",
                    },
                    {
                      value: "skilled",
                      label: "Skilled",
                      desc: "Experienced & capable",
                    },
                  ].map((card) => {
                    const isActive = form.tier === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => handleTierChange(card.value)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-16 relative transition-all ${
                          isActive
                            ? "border-violet-600 bg-violet-50/15 ring-2 ring-violet-600/10"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-3 right-3 bg-violet-600 text-white rounded-full p-0.5 animate-scale-up">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <h4 className="font-extrabold text-slate-800 text-xs">
                          {card.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-2">
                          {card.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Rate (Choose your pricing type) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50 w-full justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-violet-600 font-black text-lg">₹</span>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Rate & Payout
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleAISuggestPricing}
                  disabled={aiLoading}
                  className="text-xs font-black text-violet-700 hover:text-violet-900 transition flex items-center gap-1 bg-violet-50 border border-violet-100 px-2.5 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 text-violet-600 ${aiLoading ? "animate-spin" : "animate-pulse"}`}
                  />
                  <span>{aiLoading ? "Analyzing..." : "AI Suggest"}</span>
                </button>
              </div>

              {/* Pricing Type Cards */}
              <div className="grid grid-cols-3 gap-1">
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
                      className={`py-2 px-3 rounded-xl border text-center font-extrabold text-xs transition-all ${
                        isActive
                          ? "border-violet-600 bg-violet-50/20 text-violet-700 ring-2 ring-violet-600/10"
                          : "border-slate-100 hover:border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <div className="absolute left-4 top-3.5 font-bold text-slate-400 text-sm">
                  ₹
                </div>
                <input
                  type="text"
                  value={form.pricing}
                  onChange={(e) =>
                    setForm({ ...form, pricing: e.target.value })
                  }
                  placeholder="Enter your rate amount"
                  className="w-full pl-8 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-slate-50/50 shadow-inner transition"
                />
              </div>

              {pricingSuggestion?.pricing && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-emerald-900">
                      AI Pricing Preview
                    </p>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {pricingSuggestion.reasoning ||
                        pricingSuggestion.pricing.reason}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-white border border-emerald-100 p-3">
                      <p className="text-emerald-600 font-bold">Per Hour</p>
                      <p className="text-lg font-black text-emerald-900">
                        ₹{pricingSuggestion.pricing.perHour}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white border border-emerald-100 p-3">
                      <p className="text-emerald-600 font-bold">Per Day</p>
                      <p className="text-lg font-black text-emerald-900">
                        ₹{pricingSuggestion.pricing.perDay}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white border border-emerald-100 p-3">
                      <p className="text-emerald-600 font-bold">Per Month</p>
                      <p className="text-lg font-black text-emerald-900">
                        ₹{pricingSuggestion.pricing.perMonth}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={applyPricingSuggestion}
                    className="w-full px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition"
                  >
                    Use AI Pricing
                  </button>
                </div>
              )}
            </div>

            {aiSuggestion && (
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      AI Suggestion Preview
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Review before applying to the draft.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p>
                    <span className="font-bold text-slate-800">Title:</span>{" "}
                    {aiSuggestion.title}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">
                      Description:
                    </span>{" "}
                    {aiSuggestion.description}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">
                      Specialities:
                    </span>{" "}
                    {(aiSuggestion.suggestedSpecialities || [])
                      .map((item) => item.name)
                      .join(", ") || "None"}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Locations:</span>{" "}
                    {(aiSuggestion.suggestedLocations || [])
                      .map((item) => item.formattedAddress || item.city)
                      .join(", ") || "None"}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Tags:</span>{" "}
                    {(aiSuggestion.tags || []).join(", ") || "None"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="w-full px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black hover:bg-violet-700 transition"
                >
                  Apply AI Suggestion
                </button>
              </div>
            )}

            {/* 4. Portfolio / Links */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-violet-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Portfolio / Links
                  </h3>
                </div>
              </div>

              <PortfolioLinksManager
                value={form.portfolioLinks}
                onChange={(nextLinks) =>
                  setForm((prev) => ({ ...prev, portfolioLinks: nextLinks }))
                }
              />
            </div>

            {/* 5. WhatsApp Alerts */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 p-3 rounded-2xl bg-linear-to-br from-emerald-50 to-white border border-emerald-100">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                    <svg
                      className="w-5 h-5 fill-emerald-600"
                      viewBox="0 0 24 24"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.79 9.79 0 0 0-6.979-2.879C5.036 1.961.612 6.331.608 11.76c-.001 1.673.454 3.305 1.319 4.717L1.139 21.03l4.733-1.229c1.603.953 3.193 1.453 4.832 1.454z" />
                    </svg>
                  </div>

                  <div className="flex-1">
                    <p className="font-extrabold text-slate-800 text-sm">
                      WhatsApp Alerts
                    </p>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Get instant real-time notification alerts for job leads.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      whatsappAlerts: !f.whatsappAlerts,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.whatsappAlerts ? "bg-emerald-500" : "bg-slate-200"}`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform duration-200 ${form.whatsappAlerts ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom Section ── */}
          <div className="lg:col-span-2 space-y-6 pt-4">
            {/* Unlock More Visibility Banner */}
            <div
              id="visibility-banner"
              className="bg-linear-to-r from-violet-600 via-indigo-600 to-violet-700 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl transition-all duration-300"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Compass className="w-6 h-6 animate-spin-slow text-violet-100" />
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-wide">
                    Unlock Premium Search Placements
                  </h4>
                  <p className="text-violet-100 text-xs mt-1 leading-relaxed">
                    {plan === "free"
                      ? "Upgrade your plan to showcase multiple specialities, secure top ranks, and unlock unlimited service locations."
                      : `Active: Premium ${plan.toUpperCase()} Plan. Enjoy high visibility priority weighting across your areas.`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/provider/plans")}
                  className="bg-white text-violet-700 hover:bg-slate-50 font-black px-6 py-3 rounded-2xl transition shadow-md hover:shadow-white/20 text-xs shrink-0"
                >
                  {plan === "free" ? "Upgrade Plan →" : "Manage Subscription"}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center flex lg:flex-col items-center justify-center space-y-3 pb-8">
              <button
                type="submit"
                disabled={saving}
                className="w-full block sm:w-80 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-violet-200/50 flex items-center justify-center gap-2 text-base"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Save Profile</span>
                    <span>→</span>
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Your profile will be immediately refreshed for active search
                results
              </p>
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

      {/* Embedded inline AI Chat is at the top of the page */}
    </div>
  );
};

export default ProviderProfile;
