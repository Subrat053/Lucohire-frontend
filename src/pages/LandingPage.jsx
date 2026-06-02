import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, ChevronDown, ArrowRight, Star, ShieldCheck,
  Phone, Check, Sparkles, Zap, Brain, Wrench, ChevronRight,
  Hammer, GraduationCap, Car, Utensils, Brush, Briefcase,
  Paintbrush, Scissors, WashingMachine, MoreHorizontal, Plug,
  Share2, Users, Wallet, Trophy, Medal, Award, Quote, Plus,
  Globe2, ShieldAlert, Repeat, Languages, MessageCircle,
  BarChart3, Lock, CheckCircle2, Flame,
} from "lucide-react";
import { recruiterAPI, localeAPI, planAPI, searchAPI } from "../services/api";
import { filterDummyProviders, DUMMY_PROVIDERS } from "../data/skillsData";
import { toAbsoluteMediaUrl } from "../utils/media";
import { extractProvidersList, normalizeProviderData } from "../utils/providerData";
import { detectNearestLocation } from "../utils/location";
import { getFeaturedProviders } from "../services/providerService";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import SharedProviderCard from "../components/providers/ProviderCard";
import useTranslation from "../hooks/useTranslation";
import Seo from "../components/common/Seo";
import toast from "react-hot-toast";

/* ─────────── Mock data (keeps providers.map dynamic) ─────────── */
// type Provider = {
//   _id: string;
//   initials: string;
//   name: string;
//   role: string;
//   experience: number;
//   rating: number;
//   reviews: number;
//   city: string;
//   distanceKm: number;
//   tags: string[];
//   rate: number;
//   tier: "skilled" | "semi-skilled";
//   avatarBg: string;
// };

const getInitials = (name = "Provider") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";

const avatarColors = [
  "bg-[#DFFBF0] text-[#08905B]",
  "bg-[#EAF2FF] text-[#1677FF]",
  "bg-[#FFF3E6] text-[#E56700]",
  "bg-[#F4E8FF] text-[#8A38D6]",
  "bg-[#FEF3C7] text-[#B45309]",
  "bg-[#DCFCE7] text-[#15803D]",
];

const normalizeProvider = (provider = {}, index = 0) => {
  const normalized = normalizeProviderData(provider, index, { isDummy: provider?.isDummy });
  const skills = Array.isArray(normalized.skills) ? normalized.skills : [];
  const name = normalized.name;
  const rating = Number(normalized.rating || 0);
  const reviews = Number(normalized.totalReviews || 0);
  const rate = Number(normalized.ratePerHour || 0);

  return {
    ...normalized,
    initials: normalized.initials || getInitials(name),
    role: normalized.role || `${normalized.category} • ${normalized.experience}`,
    rating,
    reviews,
    totalReviews: reviews,
    city: normalized.location,
    distanceKm: normalized.distanceKm ?? index + 5,
    tags: normalized.tags || skills.slice(0, 3),
    skills,
    rate,
    ratePerHour: rate,
    tier: normalized.tier || "skilled",
    avatarBg: normalized.avatarBg || avatarColors[index % avatarColors.length],
    isVerified: normalized.isVerified !== false,
    isAvailable: normalized.isAvailable !== false,
    profilePhoto: normalized.profilePhoto,
  };
};

const CATEGORIES = [
  { name: "Maid", Icon: Brush, count: "650+ pros" },
  { name: "Driver", Icon: Car, count: "700+ pros" },
  { name: "Cook", Icon: Utensils, count: "800+ pros" },
  { name: "Electrician", Icon: Plug, count: "320+ pros" },
  { name: "Plumber", Icon: Wrench, count: "380+ pros" },
  { name: "Carpenter", Icon: Hammer, count: "150+ pros" },
  { name: "Tutor", Icon: GraduationCap, count: "440+ pros" },
  { name: "Labour", Icon: Briefcase, count: "200+ pros" },
  { name: "Painter", Icon: Paintbrush, count: "120+ pros" },
  { name: "Salon", Icon: Scissors, count: "180+ pros" },
  { name: "Laundry", Icon: WashingMachine, count: "60+ pros" },
  { name: "More", Icon: MoreHorizontal, count: "All pros" },
];

const SUGGESTIONS = [
  "Maid near me",
  "Driver tomorrow 6am",
  "Electrician AC repair",
  "Cook part-time evening",
];

const CITIES = [
  { name: "Noida", count: "12,400+ pros" },
  { name: "Greater Noida", count: "8,500+ pros" },
  { name: "Delhi", count: "21,300+ pros" },
  { name: "Gurugram", count: "15,700+ pros" },
  { name: "Ghaziabad", count: "9,260+ pros" },
  { name: "Faridabad", count: "5,500+ pros" },
  { name: "Bengaluru", count: "19,400+ pros" },
  { name: "Mumbai", count: "26,800+ pros" },
  { name: "Pune", count: "10,860+ pros" },
  { name: "Hyderabad", count: "11,600+ pros" },
];

/* ─────────── Reusable atoms ─────────── */

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-bold tracking-[0.2em] text-[#1677FF] uppercase mb-3">
    {children}
  </p>
);


const Pill = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition whitespace-nowrap ${
      active
        ? "bg-[#081B3A] text-white border-[#081B3A]"
        : "bg-white text-[#374151] border-[#E7ECF4] hover:border-[#1677FF] hover:text-[#1677FF]"
    }`}
  >
    {children}
  </button>
);

/* ─────────── Provider Card ─────────── */


const ProviderCard = ({ p, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl border border-[#E7ECF4] p-5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition cursor-pointer flex flex-col gap-3"
  >
    <div className="flex items-center gap-3">
      {p.profilePhoto ? (
        <img src={toAbsoluteMediaUrl(p.profilePhoto)} alt={p.name} className="w-11 h-11 rounded-full object-cover border border-[#E7ECF4]" />
      ) : (
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${p.avatarBg}`}>
          {p.initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-[#081B3A] text-sm truncate">{p.name}</h3>
          <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
        </div>
        <p className="text-xs text-[#6B7280] truncate">{p.role}</p>
      </div>
    </div>

    <div className="flex items-center gap-1.5 text-xs">
      <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
      <span className="font-bold text-[#081B3A]">{p.rating}</span>
      <span className="text-[#6B7280]">({p.reviews} reviews)</span>
    </div>

    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
      <MapPin className="w-3 h-3" /> {p.city}
    </div>

    <div className="flex flex-wrap gap-1.5">
      {p.tags.map((t) => (
        <span
          key={t}
          className="text-[11px] font-medium text-[#374151] bg-[#F3F6FB] border border-[#E7ECF4] px-2 py-0.5 rounded-md"
        >
          {t}
        </span>
      ))}
    </div>

    <div className="flex items-baseline justify-between pt-1">
      <div>
        <span className="text-lg font-extrabold text-[#081B3A]">₹{p.rate}</span>
        <span className="text-xs text-[#6B7280]"> /hr</span>
      </div>
      <span className="text-xs text-[#6B7280]">~{p.distanceKm}m</span>
    </div>

    <div className="flex gap-2 pt-1">
      <button
        onClick={(e) => { e.stopPropagation(); navigate('/contact'); }}
        className="flex-1 flex items-center justify-center gap-1.5 border border-[#E7ECF4] text-[#374151] text-xs font-semibold py-2 rounded-xl hover:bg-[#F7F9FC] transition"
      >
        <MessageCircle className="w-3.5 h-3.5" /> Contact Us
      </button>


      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="flex-1 flex items-center justify-center gap-1.5 bg-[#1677FF] hover:bg-[#0E5FCC] text-white text-xs font-bold py-2 rounded-xl transition"
      >
        <Phone className="w-3.5 h-3.5" /> Call Now
      </button>
    </div>
  </div>
);

/* ═══════════════════════ MAIN PAGE ════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { refreshLocationContext, locationPermissionStatus } = useLocationContext();
  const { t } = useTranslation();
  const siteUrl = import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const schema = siteUrl
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Lucohire",
          url: siteUrl,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Lucohire",
          url: siteUrl,
        },
      ]
    : null;

  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("Noida, IN");
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [landingPlans, setLandingPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [activeTier, setActiveTier] = useState("all");
  const [activeCategory, setActiveCategory] = useState("");
  const [openFaq, setOpenFaq] = useState();
  const [email, setEmail] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fallbackCityByCountry = { IN: "Noida", AE: "Dubai", US: "New York", GB: "London", CA: "Toronto", AU: "Sydney", DE: "Berlin", FR: "Paris", JP: "Tokyo", SG: "Singapore" };

    const detectCitySafely = async () => {
      if (isAuthenticated) {
        try {
          const detected = await detectNearestLocation();
          if (isMounted && detected?.city) {
            const label = [detected.city, detected.state].filter(Boolean).join(', ');
            if (label) {
              setLocation(label);
              localStorage.setItem('servicehub:lastSearchLocation', label);
              return;
            }
          }
        } catch (_) {}
      }

      const profileLocation = [profile?.city, profile?.state].filter(Boolean).join(', ');
      if (isMounted && profileLocation) {
        setLocation(profileLocation);
        return;
      }

      const storedLocation = localStorage.getItem('servicehub:lastSearchLocation');
      if (isMounted && storedLocation) {
        setLocation(storedLocation);
        return;
      }

      try {
        const { data } = await localeAPI.detect();
        const country = String(data?.country || "").toUpperCase();
        if (isMounted && fallbackCityByCountry[country]) setLocation(`${fallbackCityByCountry[country]}, ${country || "IN"}`);
      } catch (_) {}
    };

    detectCitySafely();
    return () => { isMounted = false; };
  }, [profile, isAuthenticated]);

  const fetchProviders = useCallback(async (s = "", c = "") => {
    const city = c || location.replace(", IN", "");
    setProvidersLoading(true);
    try {
      const { providers: apiList } = await getFeaturedProviders({ skill: s, location: city, city, limit: 4 });
      const fallbackList = filterDummyProviders(s, city);
      const finalList = apiList.length > 0 ? apiList : fallbackList.length > 0 ? fallbackList : DUMMY_PROVIDERS;
      setProviders(finalList.map(normalizeProviderData));
    } catch (_) {
      const fallbackList = filterDummyProviders(s, city);
      setProviders((fallbackList.length > 0 ? fallbackList : DUMMY_PROVIDERS).map(normalizeProviderData));
    } finally {
      setProvidersLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchProviders("");
  }, [fetchProviders]);

  const fetchLandingPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const { data } = await planAPI.getLandingPlans();
      if (Array.isArray(data)) {
        setLandingPlans(data);
      }
    } catch (err) {
      console.error("Failed to fetch landing plans", err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandingPlans();
  }, [fetchLandingPlans]);

  useEffect(() => {
    if (activeCategory) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => fetchProviders(skill, location.replace(", IN", "")), 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [skill, fetchProviders, activeCategory, location]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!skill.trim()) {
      toast.error(t('landing.enterRequirement', 'Please enter your requirement'));
      return;
    }

    const toastId = toast.loading(t('landing.parsingSearch', 'Analyzing search query...'));
    try {
      const { data } = await searchAPI.parseIntentAI({ query: skill });
      const parsedIntent = data?.parsed || data?.data?.parsed || {};
      const querySkill = parsedIntent.extractedSkill || skill;
      const queryLocation = parsedIntent.extractedCity || "";
      
      toast.success(t('landing.parsingSuccess', 'Match criteria determined!'), { id: toastId });
      
      if (queryLocation) {
        localStorage.setItem('servicehub:lastSearchLocation', queryLocation);
        navigate(`/search?query=${encodeURIComponent(querySkill)}&location=${encodeURIComponent(queryLocation)}`);
      } else {
        navigate(`/search?query=${encodeURIComponent(querySkill)}`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      navigate(`/search?query=${encodeURIComponent(skill)}`);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    setSkill(categoryName === "More" ? "" : categoryName);
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  const displayedProviders = providers.filter(
    (p) => activeTier === "all" || p.tier === activeTier
  );

  return (
    <>
      <Seo
        title={t("landing.homeTitle", "AI Hiring for Providers & Recruiters")}
        description={t("landing.homeDescription", "Find verified service providers fast with AI matching, fair lead distribution, and WhatsApp-first hiring.")}
        canonicalPath="/"
        schema={schema}
      />
      <div className="min-h-screen bg-white text-[#081B3A] font-sans antialiased">
      {/* ━━━━━━━━ NAVBAR ━━━━━━━━ */}
      

      {/* ━━━━━━━━ HERO ━━━━━━━━ */}
      <section className="bg-[#F7F9FC] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 bg-white border border-[#E7ECF4] rounded-full px-3 py-1 text-xs font-semibold text-[#374151] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
              {t('landing.verifiedNow', '1,29,264 verified pros online now')}
            </span>
          </div>

          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-[#E7ECF4] shadow-[0_20px_60px_rgba(8,27,58,0.08)] p-6 sm:p-8 md:p-10">
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-1.5 bg-[#EAF2FF] text-[#1677FF] lg:text-[11px] text-[8px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3" /> {t('landing.aiMatchEngine', 'AI Match Engine')}
              </span>
              <span className="text-[12px] lg:text-sm text-[#6B7280] text-end">{t('landing.averageMatch', 'Average match in ~ 10.2s')}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-[#081B3A]">
              {t('landing.heroTitle', 'Tell us what you need.')}
            </h1>
            <p className="text-[#1677FF] font-semibold mt-2 text-lg">{t('landing.heroSubtitle', 'Get 5 best matches instantly.')}</p>

            <form onSubmit={handleSearch} className="mt-6 lg:my-10">
              <div className="bg-[#F7F9FC] border border-[#E7ECF4] rounded-xl p-1 lg:p-2 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="w-full flex-1 flex items-center gap-2 px-3">
                  {/* <Search className="lg:w-4 lg:h-4 text-[#6B7280]" /> */}
                  <input
                    value={skill}
                    onChange={(e) => {
                      setActiveCategory("");
                      setSkill(e.target.value);
                    }}
                    placeholder={t('landing.searchPrompt', "Type like you speak… e.g 'maid morning time Noida'")}
                    className="flex-1 bg-transparent text-sm text-[#081B3A] placeholder-[#9CA3AF] lg:py-3 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#1677FF] hover:bg-[#0E5FCC] text-white lg:text-sm text-[9px] font-bold px-2 py-1 lg:px-5 lg:py-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-[0_4px_12px_rgba(22,119,255,0.3)]"
                >
                  {t('landing.findMatch', 'Find Match')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {isAuthenticated && locationPermissionStatus !== "granted" && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  {t('landing.locationBannerText', 'Allow location permission to get verified service providers near you automatically.')}
                </span>
                <button
                  type="button"
                  onClick={() => refreshLocationContext(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition shrink-0 ml-2"
                >
                  {t('landing.enableLocation', 'Enable Location')}
                </button>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#6B7280] tracking-wider">{t('landing.try', 'TRY:')}</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setActiveCategory("");
                    setSkill(s);
                  }}
                  className="text-[11px] lg:text-xs text-[#374151] border border-[#E7ECF4] bg-white px-3 py-1 rounded-full hover:border-[#1677FF] hover:text-[#1677FF] transition"
                >
                  {t(`landing.suggestion.${s}`, s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ VERIFIED PROS ━━━━━━━━ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <SectionLabel>{t('landing.topPool', 'Top Pool')}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#081B3A]">
                {t('landing.verifiedReady', 'Verified pros, ready right now')}
              </h2>
              <p className="text-[#6B7280] mt-2 text-sm">{t('landing.topPoolSubtitle', 'Top 5 per skill + city — rotates every 60s for fair lead distribution.')}</p>
            </div>
            <a onClick={() => navigate('/search')} className="text-sm font-semibold text-[#1677FF] hover:underline cursor-pointer">{t('common.viewAll', 'View all →')}</a>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-[#6B7280] mb-6">
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" /> {t('landing.avgRating', '4.8 avg rating')}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#12B76A]" /> {t('landing.aadhaarVerified', 'Aadhaar verified')}</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-[#12B76A]" /> {t('landing.whatsappReplyTime', 'WhatsApp reply ~10 min')}</span>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <Pill active={activeTier === "all"} onClick={() => setActiveTier("all")}>{t('search.all')}</Pill>
            <Pill active={activeTier === "skilled"} onClick={() => setActiveTier("skilled")}>{t('search.tierSkilled')}</Pill>
            <Pill active={activeTier === "semi-skilled"} onClick={() => setActiveTier("semi-skilled")}>{t('search.tierSemiSkilled')}</Pill>
            <Pill active={activeTier === "unskilled"} onClick={() => setActiveTier("unskilled")}>{t('search.tierUnskilled')}</Pill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {providersLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-[#E7ECF4] p-5 animate-pulse">
                    <div className="h-6 bg-[#EEF2F7] rounded w-2/3 mb-4" />
                    <div className="h-4 bg-[#EEF2F7] rounded w-1/2 mb-3" />
                    <div className="h-4 bg-[#EEF2F7] rounded w-1/3" />
                  </div>
                ))
                : displayedProviders.map((p, index) => (
                  <SharedProviderCard key={p._id} provider={p} variant="landing" index={index} onClick={() => navigate(`/p/${p._id}`)} />
                ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ CATEGORY GRID ━━━━━━━━ */}
      <section className="bg-[#F7F9FC] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <SectionLabel>{t('landing.categories', 'Categories')}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {t('landing.everyNeed', 'Every household & business need')}
              </h2>
            </div>
            <a onClick={() => navigate('/search')} className="text-sm font-semibold text-[#1677FF] hover:underline cursor-pointer">{t('common.viewAll', 'View all →')}</a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(({ name, Icon, count }) => (
              <button
                key={name}
                onClick={() => handleCategoryClick(name)}
                className={`bg-white border rounded-2xl p-5 flex flex-col items-center gap-2 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition ${
                  activeCategory === name ? "border-[#1677FF] ring-2 ring-[#EAF2FF]" : "border-[#E7ECF4]"
                }`}
              >
                <Icon className="w-6 h-6 text-[#1677FF]" />
                <p className="font-bold text-sm text-[#081B3A] mt-1">{t(`landing.category.${name}`, name)}</p>
                <p className="text-[11px] text-[#6B7280]">{t(`landing.categoryCount.${name}`, count)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ TWO SIDES ━━━━━━━━ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>{t('landing.howItWorks', 'How it works')}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {t('landing.twoSides', 'Two sides.')} <span className="italic font-serif text-[#1677FF]">{t('landing.oneFlow', 'One simple flow.')}</span>
            </h2>
            <p className="text-[#6B7280] mt-3 text-sm max-w-xl mx-auto">
              {t('landing.howItWorksDesc', "Whether you're hiring or earning — ServiceHub's AI handles matching, alerts and follow-ups.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recruiters */}
            <div className="bg-white border border-[#E7ECF4] rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
              <SectionLabel>{t('landing.forRecruiters', 'For Recruiters')}</SectionLabel>
              <h3 className="text-2xl font-extrabold tracking-tight mb-6">{t('landing.recruiterValue', 'Find. Match. Hire.')}</h3>
              {[
                { Icon: Search, title: t('landing.recruiterStep1Title', "Search or post"), desc: t('landing.recruiterStep1Desc', "Type your need in plain Hinglish — AI parses skill, city, budget.") },
                { Icon: CheckCircle2, title: t('landing.recruiterStep2Title', "Get 5 best matches"), desc: t('landing.recruiterStep2Desc', "Auto-ranked by trust score, distance, response speed.") },
                { Icon: Lock, title: t('landing.recruiterStep3Title', "Unlock & WhatsApp"), desc: t('landing.recruiterStep3Desc', "Pay-per-unlock or plan. Chat directly. Hire same day.") },
              ].map((s, i) => (
                <div key={s.title} className="flex gap-4 py-4 border-t border-[#E7ECF4] first:border-t-0">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] flex items-center justify-center shrink-0">
                    <s.Icon className="w-4.5 h-4.5 text-[#1677FF]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-[#6B7280]">0{i + 1}</p>
                    <p className="font-bold text-[#081B3A]">{s.title}</p>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Providers */}
            <div className="bg-[#081B3A] text-white border border-[#081B3A] rounded-3xl p-8 shadow-[0_20px_60px_rgba(8,27,58,0.25)]">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1677FF] uppercase mb-3">{t('landing.forProviders', 'For Service Providers')}</p>
              <h3 className="text-2xl font-extrabold tracking-tight mb-6">{t('landing.providerValue', 'Get found. Get paid.')}</h3>
              {[
                { Icon: Users, title: t('landing.providerStep1Title', "Sign up in 60s"), desc: t('landing.providerStep1Desc', "WhatsApp / Google / Email. Pick role, add 2-4 skills. Free.") },
                { Icon: BarChart3, title: t('landing.providerStep2Title', "Get rotating leads"), desc: t('landing.providerStep2Desc', "Top pool of 5 rotates every 60s — fair lead distribution.") },
                { Icon: MessageCircle, title: t('landing.providerStep3Title', "Reply, deal, earn"), desc: t('landing.providerStep3Desc', "Lead lands on WhatsApp. Confirm deal — rating unlocks.") },
              ].map((s, i) => (
                <div key={s.title} className="flex gap-4 py-4 border-t border-white/10 first:border-t-0">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <s.Icon className="w-4.5 h-4.5 text-[#1677FF]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-white/50">0{i + 1}</p>
                    <p className="font-bold">{s.title}</p>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ AI ENGINE ━━━━━━━━ */}
      <section className="bg-[#F7F9FC] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>{t('landing.theEngine', 'The Engine')}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {t('landing.engineTitle', 'Not just a directory.')}<br />
              <span className="italic font-serif text-[#1677FF]">{t('landing.engineSubtitle', 'An AI that hires for you.')}</span>
            </h2>
            <p className="text-[#6B7280] mt-3 text-sm max-w-2xl mx-auto">
              {t('landing.engineDesc', 'We replaced manual sorting with a learning system that ranks, routes and follows up — so you spend seconds, not hours.')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { Icon: Globe2, title: t('landing.engineFeature1Title', "AI Best Match"), desc: t('landing.engineFeature1Desc', "Weighted scoring on skill, distance, rating, response speed & boost — picks top 5 instantly.") },
              { Icon: Zap, title: t('landing.engineFeature2Title', "Auto Lead Distribution"), desc: t('landing.engineFeature2Desc', "No manual routing. System rotates leads fairly so every verified pro gets a fair chance.") },
              { Icon: ShieldCheck, title: t('landing.engineFeature3Title', "AI Trust Score"), desc: t('landing.engineFeature3Desc', "Every provider has a 0-100 score from completion, reviews & response time. Fully transparent.") },
              { Icon: Languages, title: t('landing.engineFeature4Title', "Hinglish Search"), desc: t('landing.engineFeature4Desc', "Search the way you speak — 'maid evening part time' just works. No filters needed.") },
              { Icon: ShieldAlert, title: t('landing.engineFeature5Title', "Fraud Detection"), desc: t('landing.engineFeature5Desc', "Spots fake profiles, duplicate accounts and spam patterns automatically.") },
              { Icon: Repeat, title: t('landing.engineFeature6Title', "Repeat Hire Memory"), desc: t('landing.engineFeature6Desc', "Hired before? We remember. One tap to rebook the same provider — or a similar one nearby.") },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-[#E7ECF4] rounded-2xl p-6 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition">
                <f.Icon className="w-5 h-5 text-[#1677FF] mb-4" />
                <h3 className="font-bold text-[#081B3A] mb-1.5">{f.title}</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ STATS DARK BAR ━━━━━━━━ */}
      <section className="bg-[#081B3A] text-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[
            { v: "1,25,000+", l: t('landing.statHouseholds', "Households served") },
            { v: "50,000+", l: t('landing.statJobs', "Jobs posted") },
            { v: "4.8★", l: t('landing.statRating', "Average rating") },
            { v: "~10 min", l: t('landing.statReply', "Avg WhatsApp reply") },
            { v: "24/7", l: t('landing.statSupport', "Verified support") },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl md:text-3xl font-extrabold tracking-tight">{s.v}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-1.5">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[12px] text-white/40">
          {[t('landing.trust1', "Aadhaar Verified"), t('landing.trust2', "Razorpay Secure"), t('landing.trust3', "Meta WhatsApp API"), t('landing.trust4', "MSME Registered"), t('landing.trust5', "ISO 27001 Aligned")].map((b) => (
            <span key={b} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1677FF]" />{b}</span>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━ WHATSAPP NATIVE ━━━━━━━━ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>{t('landing.whatsappNative', 'WhatsApp · Native')}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {t('landing.whatsappTitle', 'Every lead lands where you actually reply —')} <span className="italic font-serif text-[#1677FF]">{t('common.whatsapp', 'WhatsApp.')}</span>
            </h2>
            <p className="text-[#6B7280] mt-4 text-sm leading-relaxed">
              {t('landing.whatsappDesc', "Built on Meta's Cloud API. From signup to renewal, every moment is a clean, branded message with delivery status and opt-out.")}
            </p>

            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              {[
                t('landing.whatsappFeature1', "Signup welcome + verification"),
                t('landing.whatsappFeature2', "Job post confirmation"),
                t('landing.whatsappFeature3', "Plan / credit expiry reminder"),
                t('landing.whatsappFeature4', "Payment success & invoice"),
                t('landing.whatsappFeature5', "New lead alert (skill, city, budget)"),
                t('landing.whatsappFeature6', "Daily performance summary"),
              ].map((b) => (
                <div key={b} className="flex items-start gap-2 text-[#374151]">
                  <Check className="w-4 h-4 text-[#12B76A] mt-0.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#6B7280]">
              <span>● {t('landing.metaApi', 'Meta Cloud API')}</span>
              <span>● {t('landing.multiLang', 'Multi-language')}</span>
              <span>● {t('landing.twoWayReply', 'Two-way replies')}</span>
            </div>
          </div>

          {/* Phone mock */}
          <div className="flex justify-center">
            <div className="relative w-70 bg-[#081B3A] rounded-[42px] p-3 shadow-[0_30px_80px_rgba(8,27,58,0.25)]">
              <div className="bg-[#FAF7F2] rounded-4xl overflow-hidden">
                <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">L</div>
                  <div>
                    <p className="text-sm font-semibold">Lucohire</p>
                    <p className="text-[10px] opacity-70">online</p>
                  </div>
                </div>
                <div className="p-3 space-y-2 min-h-80">
                  {[
                    { t: "🎉 Welcome Anita! Your provider profile is verified.", c: "bg-[#FFF8E1]" },
                    { t: "🔔 New lead — Maid in Gaur City\nBudget ₹6,000/mo · Mornings", c: "bg-[#FFF8E1]" },
                    { t: "Yes, available. Can start Monday.", c: "bg-[#DCF8C6] ml-auto", me: true },
                    { t: "✅ Reply forwarded to client", c: "bg-[#FFF8E1]" },
                    { t: "💰 Payment ₹499 received · Pro Boost active", c: "bg-[#FFF8E1]" },
                  ].map((m, i) => (
                    <div key={i} className={`text-[11px] leading-snug px-2.5 py-1.5 rounded-lg max-w-[80%] whitespace-pre-line text-[#081B3A] shadow-sm ${m.c}`}>
                      {m.t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ PRICING ━━━━━━━━ */}
      <section className="bg-[#F7F9FC] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>{t('plans.title', 'Plans')}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t('landing.pricingTitle', 'Pay only when you grow.')}</h2>
            <p className="text-[#6B7280] mt-2 text-sm">{t('landing.pricingSubtitle', 'Transparent pricing. No hidden fees. Cancel anytime.')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plansLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#E7ECF4] rounded-3xl p-7 animate-pulse h-96" />
              ))
            ) : landingPlans.length > 0 ? (
              landingPlans.map((p, index) => {
                const isFree = Number(p.price) === 0;
                const ctaLink = isFree ? "/signup" : "/login";
                // If exactly 3 plans, highlight the middle one (index 1)
                // If more than 3, highlight index 1 of the first 3, etc.
                // But usually there are 3. Let's stick to index 1 as the primary highlight.
                const isDark = index === 1;
                
                return (
                  <div
                    key={p._id}
                    className={`relative rounded-3xl p-7 border transition-all hover:shadow-lg ${
                      isDark
                        ? "bg-[#081B3A] text-white border-[#081B3A] shadow-[0_30px_70px_rgba(8,27,58,0.25)] md:scale-105 z-10"
                        : "bg-white border-[#E7ECF4]"
                    }`}
                  >
                    {p.isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                        {t('common.popular', 'Most Popular')}
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${isDark ? "bg-white/10" : "bg-[#EAF2FF]"}`}>
                      <Sparkles className="w-5 h-5 text-[#1677FF]" />
                    </div>
                    <p className={`font-bold ${isDark ? "text-white" : "text-[#081B3A]"}`}>{p.name}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight">
                        {isFree ? t('common.free', "Free") : `₹${p.price}`}
                      </span>
                      {!isFree && (
                        <span className={`text-xs ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
                          {t('plans.perMonth', "per month")}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
                      {p.description || (isFree ? t('plans.starterNote', "For first-time providers") : t('plans.proNote', "Most popular"))}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {p.features?.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? "text-[#1677FF]" : "text-[#12B76A]"}`} />
                          <span className={isDark ? "text-white/85" : "text-[#374151]"}>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`mt-7 w-full py-3 rounded-xl font-bold text-sm transition ${
                        isDark
                          ? "bg-white text-[#081B3A] hover:bg-white/90"
                          : "bg-[#1677FF] text-white hover:bg-[#0E5FCC]"
                      }`}
                      onClick={() => navigate(ctaLink)}
                    >
                      {isFree ? t('plans.starterCta', "Start free") : (p.slug === 'business' ? t('plans.businessCta', "Talk to sales") : t('plans.proCta', "Boost my profile"))}
                    </button>
                  </div>
                );
              })
            ) : (
              // Fallback to static if no plans from backend
              [
                { name: t('plans.starterName', "Starter"), price: t('common.free', "Free"), note: t('plans.starterNote', "For first-time providers"), featured: false, perks: [t('plans.starterPerk1', "Profile + 2 skills"), t('plans.starterPerk2', "Basic ranking"), t('plans.starterPerk3', "WhatsApp lead alerts"), t('plans.starterPerk4', "1 city / area")], cta: t('plans.starterCta', "Start free"), ctaLink: "/signup" },
                { name: t('plans.proName', "Pro Boost"), price: "₹499", per: t('plans.perMonth', "per month"), note: t('plans.proNote', "Most popular"), featured: true, perks: [t('plans.proPerk1', "All Starter features"), t('plans.proPerk2', "Top-pool rotation (60s)"), t('plans.proPerk3', "Up to 5 skills"), t('plans.proPerk4', "Priority lead distribution"), t('plans.proPerk5', "AI profile builder")], cta: t('plans.proCta', "Boost my profile"), ctaLink: "/login" },
                { name: t('plans.businessName', "Business"), price: "₹1,999", per: t('plans.perMonth', "per month"), note: t('plans.businessNote', "Teams & agencies"), featured: false, perks: [t('plans.businessPerk1', "Unlimited skills & areas"), t('plans.businessPerk2', "Featured placement"), t('plans.businessPerk3', "Bulk hire & unlocks"), t('plans.businessPerk4', "Team accounts"), t('plans.businessPerk5', "Dedicated success manager")], cta: t('plans.businessCta', "Talk to sales"), ctaLink: "/contact" },
              ].map((p, index) => {
                const isDark = index === 1;
                return (
                  <div
                    key={p.name}
                    className={`relative rounded-3xl p-7 border transition-all hover:shadow-lg ${
                      isDark
                        ? "bg-[#081B3A] text-white border-[#081B3A] shadow-[0_30px_70px_rgba(8,27,58,0.25)] md:scale-105 z-10"
                        : "bg-white border-[#E7ECF4]"
                    }`}
                  >
                    {p.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                        {t('common.popular', 'Most Popular')}
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${isDark ? "bg-white/10" : "bg-[#EAF2FF]"}`}>
                      <Sparkles className="w-5 h-5 text-[#1677FF]" />
                    </div>
                    <p className={`font-bold ${isDark ? "text-white" : "text-[#081B3A]"}`}>{p.name}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                      {p.per && <span className={`text-xs ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>{p.per}</span>}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>{p.note}</p>

                    <ul className="mt-6 space-y-2.5">
                      {p.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? "text-[#1677FF]" : "text-[#12B76A]"}`} />
                          <span className={isDark ? "text-white/85" : "text-[#374151]"}>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`mt-7 w-full py-3 rounded-xl font-bold text-sm transition ${
                        isDark
                          ? "bg-white text-[#081B3A] hover:bg-white/90"
                          : "bg-[#1677FF] text-white hover:bg-[#0E5FCC]"
                      }`}
                      onClick={() => navigate(p.ctaLink)}
                    >
                      {p.cta}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ REFERRAL ━━━━━━━━ */}
      <section id="referral-section" className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-[#EAF2FF] text-[#1677FF] text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5">
            <Share2 className="w-3 h-3" /> Referral Partner Program
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Refer & Earn <span className="text-[#1677FF]">40% Commission</span> 💰
          </h2>
          <p className="text-[#6B7280] mt-3 text-sm max-w-xl mx-auto">
            दूसरों का registration करवाओ और हर paid plan पर <b>40% referral commission</b> कमाओ!
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { Icon: Share2, step: "Step 1", title: "अपना Referral Link शेयर करो", desc: "Sign up करो और WhatsApp, Facebook पर share करो" },
              { Icon: Users, step: "Step 2", title: "लोगों को Register करवाओ", desc: "Friends, family — जो भी worker या employer है" },
              { Icon: Wallet, step: "Step 3", title: "40% Commission कमाओ", desc: "Referred user के paid plan पर तुरंत 40% directly!" },
            ].map((s) => (
              <div key={s.step} className="bg-white border border-[#E7ECF4] rounded-2xl p-6 text-left">
                <s.Icon className="w-6 h-6 text-[#1677FF] mb-4" />
                <p className="text-[10px] font-bold tracking-widest text-[#6B7280] uppercase">{s.step}</p>
                <p className="font-bold mt-1 text-[#081B3A]">{s.title}</p>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-3xl mx-auto bg-white border border-[#E7ECF4] rounded-2xl p-8">
            <p className="text-[11px] font-bold tracking-widest text-[#1677FF] uppercase mb-2">Unlimited Earning Potential</p>
            <p className="text-3xl md:text-4xl font-extrabold tracking-tight">₹10,000 – ₹1,00,000+ <span className="text-[#6B7280] font-bold text-2xl">/ month</span></p>
            <p className="text-xs text-[#6B7280] mt-2">Top referral partners earn lakhs — no limit on referrals.</p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="bg-white border border-[#E7ECF4] text-[#374151] px-5 py-3 rounded-xl text-sm font-semibold hover:border-[#1677FF] hover:text-[#1677FF] transition">Learn More</button>
            <button className="bg-[#1677FF] hover:bg-[#0E5FCC] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-[0_4px_12px_rgba(22,119,255,0.3)]"
              onClick={()=>navigate('/signup')}>
              Become Referral Partner <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ COVERAGE ━━━━━━━━ */}
      <section className="bg-[#F7F9FC] py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <SectionLabel>Coverage</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Live in your city. Growing fast.</h2>
            </div>
            {/* <a className="text-sm font-semibold text-[#1677FF] hover:underline cursor-pointer">Request your city →</a> */}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CITIES.map((c) => (
              <div key={c.name} className="bg-white border border-[#E7ECF4] rounded-2xl p-5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition">
                <p className="font-bold text-[#081B3A]">{c.name}</p>
                <p className="text-xs text-[#6B7280] mt-1">{c.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ TESTIMONIALS ━━━━━━━━ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>Voices</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Real people. Real results.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Priya Sharma", role: "Recruiter · Gaur City, Noida", text: "Maid mil gayi 20 minute me. WhatsApp pe seedha baat hui, agle din join kar liya. Game changer!", initials: "P", bg: "bg-[#FFE4E6] text-[#9F1239]" },
              { name: "Manoj Plumber", role: "Provider · Noida Extension", text: "Pehle din bekar lagta tha. Pro Boost liya, 6-8 hafte me jobs aati hain. Income double ho gayi.", initials: "M", bg: "bg-[#DCFCE7] text-[#15803D]" },
              { name: "Amit Verma", role: "Recruiter · Greater Noida", text: "Verified profiles, fair pricing — trust banta hai. Apartment ke 14 flats ne yahin se hire kiya.", initials: "A", bg: "bg-[#081B3A] text-white" },
            ].map((t) => (
              <div key={t.name} className="bg-white border border-[#E7ECF4] rounded-2xl p-6 relative">
                <Quote className="absolute top-4 right-4 w-7 h-7 text-[#E7ECF4]" />
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />)}
                </div>
                <p className="text-sm text-[#374151] leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#E7ECF4]">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${t.bg}`}>{t.initials}</div>
                  <div>
                    <p className="font-bold text-sm text-[#081B3A]">{t.name}</p>
                    <p className="text-[11px] text-[#6B7280]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FAQ ━━━━━━━━ */}
      <section className="bg-[#F7F9FC] py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything you wanted to ask.</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "Kya providers verified hote hain?", a: "Haan — Aadhaar + phone + selfie verification. Trust score 0-100 publicly visible." },
              { q: "Lead milne ka process kaise kaam karta hai?", a: "AI top 5 matches WhatsApp pe bhejta hai. First reply, first deal. Fair rotation har 60 seconds." },
              { q: "Free plan me kya milta hai?", a: "Profile, 2 skills, basic ranking, WhatsApp alerts, 1 city. Forever free for providers." },
              { q: "Recruiter ke liye kya cost hai?", a: "Search free. Pay-per-unlock ya monthly plan — apni zarurat ke hisaab se chuno." },
              { q: "Payment safe hai?", a: "Razorpay encrypted gateway. UPI, cards, netbanking — sab supported. Invoice WhatsApp pe milta hai." },
              { q: "Refund policy?", a: "7-day money-back on Pro Boost & Business plans if you don't get a single matched lead." },
            ].map((f, i) => (
              <div key={f.q} className="bg-white border border-[#E7ECF4] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-semibold text-sm text-[#081B3A]">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#6B7280] transition ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-sm text-[#6B7280] leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ CONTEST ━━━━━━━━ */}
      <section id="contest-section" className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-[#EAF2FF] text-[#1677FF] text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5">
            <Trophy className="w-3 h-3" /> Registration Champion Contest
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight ">
            Complete Profile & Win Cash Rewards <Flame className="w-9 h-9 text-[#F59E0B] inline-flex items-center gap-3 flex-wrap justify-center" />
          </h2>
          <p className="text-[#6B7280] mt-3 text-sm max-w-xl mx-auto">
            अपने friends, family और जानने वालों का registration करवाओ — जितने ज्यादा profiles, उतना ऊपर rank!
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["1️⃣ अपना account बनाओ", "2️⃣ Friends/Family से register करवाओ", "3️⃣ सबसे ज्यादा = Cash Prize 🏆"].map((s) => (
              <span key={s} className="bg-white border border-[#E7ECF4] text-sm font-semibold text-[#374151] px-4 py-2 rounded-full">{s}</span>
            ))}
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { place: "1st Place", color: "bg-[#FEF3C7] border-[#F59E0B]", Icon: Trophy, iconColor: "text-[#F59E0B]", label: "Most Registrations", prize: "₹10,000" },
              { place: "2nd Place", color: "bg-[#F3F4F6] border-[#9CA3AF]", Icon: Medal, iconColor: "text-[#6B7280]", label: "2nd Highest", prize: "₹5,000" },
              { place: "Next 5", color: "bg-[#FFEDD5] border-[#F59E0B]", Icon: Award, iconColor: "text-[#B45309]", label: "₹2,000 each", prize: "₹10,000" },
            ].map((p) => (
              <div key={p.place} className={`rounded-2xl border-2 ${p.color} p-6`}>
                <span className="inline-block bg-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-[#374151] border border-[#E7ECF4]">{p.place}</span>
                <p.Icon className={`w-12 h-12 ${p.iconColor} mx-auto mt-5`} />
                <p className="text-xs text-[#6B7280] mt-3">{p.label}</p>
                <p className="text-3xl font-extrabold text-[#081B3A] mt-2">{p.prize}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 max-w-3xl mx-auto bg-white border border-[#E7ECF4] rounded-2xl p-6">
            <p className="text-[11px] font-bold tracking-widest text-[#1677FF] uppercase">Annual Grand Champion 🏆</p>
            <p className="text-4xl font-extrabold mt-2 tracking-tight">₹1,00,000</p>
            <p className="text-xs text-[#6B7280] mt-1">Yearly mega prize for the top performer</p>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {[
              { v: "07", l: "Days" }, { v: "11", l: "Hrs" }, { v: "58", l: "Min" }, { v: "27", l: "Sec" },
            ].map((t) => (
              <div key={t.l} className="bg-white border border-[#E7ECF4] rounded-xl px-4 py-2 min-w-15">
                <p className="text-xl font-extrabold text-[#081B3A]">{t.v}</p>
                <p className="text-[9px] tracking-widest uppercase text-[#6B7280]">{t.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="bg-white border border-[#E7ECF4] text-[#374151] px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"><Trophy className="w-4 h-4" /> View Leaderboard</button>
            <button 
            onClick={()=>{navigate('/signup')}}
            className="bg-[#1677FF] hover:bg-[#0E5FCC] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(22,119,255,0.3)]">Register Now <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FINAL CTA ━━━━━━━━ */}
      <section className="px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#0A1B3D 0%,#102A5E 60%,#1E3A8A 100%)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 50%, rgba(22,119,255,0.4), transparent 60%)" }} />
          <div className="relative px-6 py-20 text-center text-white">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-6 backdrop-blur">
              <Users className="w-3 h-3" /> Join 1,25,000+ on Lucohire
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Hire smarter.<br />
              <span className="italic font-serif text-[#1677FF]">Earn faster.</span>
            </h2>
            <p className="text-white/70 text-sm mt-4 max-w-md mx-auto">
              One AI engine for both sides of hiring. Sign up in 60 seconds — your first match arrives on WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button 
              onClick={()=>navigate('/login')}
              className="bg-white/10 border border-white/20 backdrop-blur text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition">
                I'm Hiring <ArrowRight className="w-4 h-4" />
              </button>
              <button 
              onClick={()=>navigate('/signup')}
              className="bg-[#1677FF] hover:bg-[#0E5FCC] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(22,119,255,0.5)] transition">
                I Provide Services <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-white/40 mt-6">No credit card · Free forever plan · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FOOTER ━━━━━━━━ */}
      </div>
    </>
  );
};

export default LandingPage;