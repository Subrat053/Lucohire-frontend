import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Sparkles, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { planAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import useTranslation from "../hooks/useTranslation";
import Seo from "../components/common/Seo";

const PricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "recruiter" || searchParams.get("role") === "recruiter"
    ? "recruiter"
    : "provider";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, [activeTab]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await planAPI.getPlansByAudience(activeTab);
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCtaClick = (plan) => {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }

    const currentRole = user?.activeRole || user?.role;
    if (activeTab === "provider") {
      if (currentRole === "provider") {
        navigate("/provider/plans");
      } else {
        navigate("/profile/" + user?._id);
      }
    } else if (activeTab === "recruiter") {
      if (currentRole === "recruiter") {
        navigate("/recruiter/plans");
      } else {
        navigate("/profile/" + user?._id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 md:py-20 font-sans">
      <Seo
        title={t("plans.seoTitle", "Pricing Plans")}
        description={t("plans.seoDescription", "Choose the best plan to boost your hires or service leads with transparent rates and premium features.")}
        canonicalPath="/pricing"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" /> {t("plans.headerTag", "Flexible & Transparent")}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            {t("plans.titleText", "Pricing plans for everyone")}
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-500 leading-relaxed">
            {t("plans.subtitleText", "Connect, hire, and grow your business with our clear pay-as-you-go and monthly subscription plans.")}
          </p>

          {/* Toggle Tabs */}
          <div className="mt-8 flex justify-center">
            <div className="relative bg-white border border-gray-100 rounded-2xl p-1.5 flex gap-1 shadow-sm max-w-md w-full">
              <button
                onClick={() => setActiveTab("provider")}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  activeTab === "provider"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t("plans.providerTab", "Service Providers")}
              </button>
              <button
                onClick={() => setActiveTab("recruiter")}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  activeTab === "recruiter"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t("plans.recruiterTab", "Recruiters & Clients")}
              </button>
            </div>
          </div>
        </div>

        {/* Plans Display */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto">
            {plans.map((p, idx) => {
              const isFree = Number(p.price) === 0;
              // Highlight the most popular or second card if none marked popular
              const isPopular = p.isPopular || (plans.length > 2 && idx === 1);

              return (
                <div
                  key={p._id}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 md:p-8 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isPopular
                      ? "bg-slate-900 text-white border-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.15)] ring-2 ring-blue-500/20"
                      : "bg-white border-gray-100 text-gray-800"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                      {t("common.popular", "Recommended")}
                    </span>
                  )}

                  <div>
                    {/* Icon Header */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                      isPopular ? "bg-white/10 text-blue-400" : "bg-blue-50 text-blue-600"
                    }`}>
                      {isPopular ? <Zap className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>

                    {/* Plan Name & Price */}
                    <h3 className={`text-xl font-bold tracking-tight ${isPopular ? "text-white" : "text-gray-900"}`}>
                      {p.name}
                    </h3>
                    
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className={`text-4xl font-extrabold tracking-tight ${isPopular ? "text-white" : "text-gray-900"}`}>
                        {isFree ? t("common.free", "Free") : `₹${p.price}`}
                      </span>
                      {!isFree && (
                        <span className={`text-xs ${isPopular ? "text-gray-400" : "text-gray-500"}`}>
                          /{p.duration === 30 ? t("plans.monthly", "mo") : `${p.duration} ${t("plans.days", "days")}`}
                        </span>
                      )}
                    </div>
                    
                    <p className={`mt-3 text-xs leading-relaxed ${isPopular ? "text-gray-400" : "text-gray-500"}`}>
                      {p.description || (isFree ? t("plans.freePlanDesc", "Get basic features to get started.") : t("plans.premiumPlanDesc", "Unlock full business potential."))}
                    </p>

                    {/* Features List */}
                    <div className={`border-t my-6 ${isPopular ? "border-white/10" : "border-gray-100"}`} />

                    <ul className="space-y-3.5">
                      {p.features?.map((perk, perkIdx) => (
                        <li key={perkIdx} className="flex items-start gap-2.5 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isPopular ? "text-blue-400" : "text-emerald-500"
                          }`} />
                          <span className={isPopular ? "text-gray-300" : "text-gray-600"}>
                            {perk}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-8">
                    <button
                      onClick={() => handleCtaClick(p)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                        isPopular
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {isFree ? t("plans.getStarted", "Get Started") : t("plans.choosePlan", "Choose Plan")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQs / Help Section */}
        <div className="mt-24 max-w-4xl mx-auto border border-gray-100 rounded-3xl bg-white p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">{t("plans.faqHeader", "Pricing & Plans FAQ")}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold text-gray-800 mb-1.5">{t("plans.faq1Q", "Can I upgrade or downgrade later?")}</h4>
              <p className="text-gray-500 leading-relaxed">
                {t("plans.faq1A", "Yes! You can change or cancel your subscription plan at any time through your dashboard page.")}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1.5">{t("plans.faq2Q", "Are there any hidden setup fees?")}</h4>
              <p className="text-gray-500 leading-relaxed">
                {t("plans.faq2A", "No hidden fees. You pay only the list price of the plan plus applicable government GST taxes.")}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1.5">{t("plans.faq3Q", "How do pay-per-unlock credits work?")}</h4>
              <p className="text-gray-500 leading-relaxed">
                {t("plans.faq3A", "Unlocking lets you contact matches directly. Each plan provides a specific amount of unlocks resetting monthly.")}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1.5">{t("plans.faq4Q", "What payment methods are supported?")}</h4>
              <p className="text-gray-500 leading-relaxed">
                {t("plans.faq4A", "We support credit/debit cards, UPI, net banking, and Razorpay/Stripe payment gateways.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
