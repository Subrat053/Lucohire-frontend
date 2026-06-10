import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { HiStar, HiLocationMarker, HiBadgeCheck, HiPhone, HiMail, HiExternalLink, HiBriefcase, HiTranslate, HiCurrencyRupee, HiEye, HiCheckCircle, HiCalendar } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { recruiterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
const ReviewSection = lazy(() => import('../components/common/ReviewSection'));
import toast from 'react-hot-toast';
import { toOptimizedMediaUrl } from '../utils/media';
import { DUMMY_PROVIDERS } from '../data/skillsData';
import { findProviderById, normalizeProviderData } from '../utils/providerData';
import { getProviderById as fetchProviderById } from '../services/providerService';
import useTranslation from '../hooks/useTranslation';
import Seo from '../components/common/Seo';
import SafeExternalLink from '../components/common/SafeExternalLink';

const ProviderPublicProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const reviewsRef = useRef(null);

  const getFallbackProviderPayload = (providerId) => {
    const dummyProvider = findProviderById(DUMMY_PROVIDERS, providerId);
    if (!dummyProvider) return null;

    const normalized = normalizeProviderData(dummyProvider, 0, { isDummy: true });

    return {
      profile: {
        _id: normalized.id,
        id: normalized.id,
        isDummy: true,
        user: {
          _id: normalized.id,
          name: normalized.name,
          avatar: normalized.image,
        },
        photo: normalized.image,
        profilePhoto: normalized.image,
        city: normalized.location,
        rating: normalized.rating || 0,
        totalReviews: dummyProvider.totalReviews || 0,
        currentPlan: 'free',
        isVerified: true,
        category: normalized.category,
        description: normalized.description,
        skills: Array.isArray(normalized.skills) ? normalized.skills : [],
        services: Array.isArray(normalized.services) ? normalized.services : [],
        experience: normalized.experience || 'N/A',
        languages: ['Hindi', 'English'],
        profileViews: 0,
      },
      reviews: [],
      contact: {
        phone: '',
        whatsappNumber: '',
        email: '',
      },
    };
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (!reviewsRef.current || showReviews) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShowReviews(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(reviewsRef.current);
    return () => observer.disconnect();
  }, [showReviews]);

  // Check unlock status when authenticated recruiter visits
  useEffect(() => {
    if (isAuthenticated && (user?.activeRole || user?.role) === 'recruiter' && id) {
      recruiterAPI.checkUnlockStatus(id).then(({ data }) => {
        if (data.isUnlocked) {
          setContactUnlocked(true);
          setContactInfo(data.contactInfo || null);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, user, id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { profile: fetchedProfile, reviews: fetchedReviews } = await fetchProviderById(id);
      if (fetchedProfile) {
        setProfile(fetchedProfile);
        setReviews(fetchedReviews || []);
        return;
      }

      const fallbackPayload = getFallbackProviderPayload(id);
      if (fallbackPayload) {
        setProfile(fallbackPayload.profile);
        setReviews(fallbackPayload.reviews);
        setContactUnlocked(false);
        setContactInfo(null);
        return;
      }

      setProfile(null);
      setReviews([]);
    } catch (err) {
      const fallbackPayload = getFallbackProviderPayload(id);
      if (fallbackPayload) {
        setProfile(fallbackPayload.profile);
        setReviews(fallbackPayload.reviews);
        setContactUnlocked(false);
        setContactInfo(null);
      } else {
        setProfile(null);
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!isAuthenticated) return toast.error(t('common.loginFirst', 'Please login first'));
    if ((user?.activeRole || user?.role) !== 'recruiter') return toast.error(t('recruiter.onlyRecruitersUnlock', 'Only recruiters can unlock contacts'));
    setUnlocking(true);
    try {
      const { data } = await recruiterAPI.unlockContact(id);
      setContactUnlocked(true);
      setContactInfo(data.contact || data.contactInfo);
      toast.success(t('recruiter.contactUnlocked', 'Contact unlocked!'));
    } catch (err) {
      const msg = err.response?.data?.message || t('recruiter.failedUnlock', 'Failed to unlock');
      if (msg.toLowerCase().includes('unlock') || msg.toLowerCase().includes('plan') || msg.toLowerCase().includes('credits') || msg.toLowerCase().includes('upgrade')) {
        toast.error(msg);
        navigate('/recruiter/plans');
      } else {
        toast.error(msg);
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>;
  
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🕵️</span>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t('common.providerNotFound', 'Provider not found')}</h2>
        <p className="text-gray-500 mb-6">The profile you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/search')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition w-full">
          Go back to Search
        </button>
      </div>
    </div>
  );

  const seoTitle = profile.user?.name ? `${profile.user.name} - ${t('common.profile', 'Profile')}` : t('common.profile', 'Profile');
  const seoDescription = profile.description || t('provider.profileDescription', 'View verified provider profile, skills, and reviews on Lucohire.');
  const seoImage = profile.photo || profile.profilePhoto || '';

  const userName = profile.user?.name || 'Service Provider';
  const firstName = (userName || '').split(' ')[0] || 'Provider';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/p/${id}`}
        image={seoImage}
      />
      
      {/* Hero Banner Section */}
      <div className="relative w-full h-[280px] lg:h-[320px] bg-indigo-900 overflow-hidden">
        {/* Abstract Background Patterns */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        
        {/* Header Card */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 border border-white/40 backdrop-blur-xl mb-8 relative">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-2 bg-white shadow-2xl -mt-16 sm:-mt-20 border-4 border-white/50 backdrop-blur-md relative z-20">
                {profile.photo || profile.profilePhoto ? (
                  <img
                    src={toOptimizedMediaUrl(profile.photo || profile.profilePhoto, { width: 300, height: 300, crop: 'fill', dpr: 'auto' })}
                    alt={userName}
                    className="w-full h-full object-cover rounded-full bg-gray-50"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-5xl font-black text-white">{userName[0]}</span>
                  </div>
                )}
              </div>
              {profile.isVerified && (
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white rounded-full p-1 shadow-lg z-30" title="Verified">
                  <HiBadgeCheck className="w-8 h-8 text-blue-500" />
                </div>
              )}
            </div>

            {/* Title Info */}
            <div className="flex-1 text-center md:text-left mt-2 md:mt-0">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{userName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-gray-600 mb-4">
                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full"><HiLocationMarker className="w-4 h-4 text-rose-500" /> {profile.city || 'Location N/A'}</span>
                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full"><HiStar className="w-4 h-4 text-amber-400" /> <strong className="text-gray-900">{profile.rating || '0.0'}</strong> ({profile.totalReviews || 0} reviews)</span>
                {profile.tier && <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full capitalize"><HiCheckCircle className="w-4 h-4"/> {profile.tier.replace('-', ' ')}</span>}
              </div>
              
              {/* Top Skills Summary */}
              {profile.skills?.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {profile.skills.slice(0, 4).map((skill, i) => (
                    <span key={i} className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold tracking-wide">{skill}</span>
                  ))}
                  {profile.skills.length > 4 && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">+{profile.skills.length - 4}</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Call to Action Quick */}
            <div className="hidden lg:flex flex-col gap-3 w-64">
              <button onClick={() => {
                document.getElementById('contact-card')?.scrollIntoView({ behavior: 'smooth' });
              }} className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                <HiPhone className="w-5 h-5" />
                Contact {firstName}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><HiCheckCircle /></span>
                About {firstName}
              </h2>
              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed">
                <p>{profile.description || `${firstName} is a professional ${profile.category || 'service provider'} based in ${profile.city || 'their city'}. They have a track record of providing excellent service and ensuring customer satisfaction.`}</p>
              </div>
            </div>

            {/* Services & Expertise */}
            {profile.services?.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><HiBriefcase /></span>
                  Services Offered
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.services.map((service, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                      <span className="font-medium text-gray-800">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {(() => {
              const approvedLinks = (profile.portfolioLinks || []).filter(link => {
                if (typeof link === 'string') return true;
                return link.status === 'approved';
              });
              
              if (approvedLinks.length === 0) return null;

              return (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><HiExternalLink /></span>
                    Portfolio & Work
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {approvedLinks.map((link, i) => {
                      const platformName = typeof link === 'string' ? 'Link' : link.platform;
                      const linkUrl = typeof link === 'string' ? link : link.url;
                      return (
                        <SafeExternalLink key={i} href={linkUrl} className="group flex flex-col p-5 rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-900 capitalize">{platformName}</span>
                            <HiExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <span className="text-sm text-gray-500 truncate">{linkUrl}</span>
                        </SafeExternalLink>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Reviews Section */}
            <div ref={reviewsRef} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><HiStar /></span>
                Client Reviews
              </h2>
              {showReviews ? (
                <Suspense fallback={<div className="py-10"><LoadingSpinner /></div>}>
                  <ReviewSection
                    revieweeId={profile.user?._id}
                    initialReviews={(reviews || []).map((review) => ({
                      ...review,
                      reviewerId: review.reviewerId || review.recruiter,
                    }))}
                    initialSummary={{
                      avgRating: profile.rating || 0,
                      totalReviews: profile.totalReviews || reviews.length || 0,
                    }}
                  />
                </Suspense>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">Loading reviews...</div>
              )}
            </div>

          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Details Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-5">Profile Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3 text-gray-500"><HiCalendar className="w-5 h-5 text-indigo-400"/> Experience</div>
                  <div className="font-semibold text-gray-900">{profile.experience || 'N/A'}</div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3 text-gray-500"><HiTranslate className="w-5 h-5 text-indigo-400"/> Languages</div>
                  <div className="font-semibold text-gray-900">{(profile.languages || []).join(', ') || 'English, Hindi'}</div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3 text-gray-500"><HiCurrencyRupee className="w-5 h-5 text-indigo-400"/> Pricing</div>
                  <div className="text-right">
                    {profile.pricing ? (
                      <span className="font-bold text-emerald-600">
                        ₹{profile.pricing}
                        <span className="text-sm text-gray-500 font-medium">{profile.pricingType ? `/${profile.pricingType}` : ''}</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400">Upon Request</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 text-gray-500"><HiEye className="w-5 h-5 text-indigo-400"/> Profile Views</div>
                  <div className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{profile.profileViews || 0}</div>
                </div>
              </div>
            </div>

            {/* Contact Card (Sticky) */}
            <div id="contact-card" className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl shadow-xl border border-indigo-800 p-6 sticky top-24 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
              
              <h3 className="font-extrabold text-white text-xl mb-1">Contact {firstName}</h3>
              <p className="text-indigo-200 text-sm mb-6">Get in touch to discuss your requirements</p>

              {profile.isDummy && (
                <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 rounded-xl px-4 py-3 mb-4 text-sm font-medium backdrop-blur-sm">
                  Contact is unavailable for demo providers.
                </div>
              )}

              {contactUnlocked && contactInfo ? (
                <div className="space-y-3">
                  {(contactInfo.phone || contactInfo.whatsappNumber) && (
                    <a href={`tel:${contactInfo.phone || contactInfo.whatsappNumber}`}
                      className="w-full flex items-center justify-center space-x-2 bg-white text-indigo-900 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-gray-50 transition active:scale-95">
                      <HiPhone className="w-5 h-5 text-indigo-600" />
                      <span>{contactInfo.phone || contactInfo.whatsappNumber}</span>
                    </a>
                  )}
                  
                  <button 
                    disabled={profile.whatsappAlerts === false}
                    onClick={() => {
                      if (profile.whatsappAlerts === false) return;
                      navigate('/contact', { state: { subject: `Enquiry for ${userName}`, providerId: profile.user?._id } });
                    }}
                    className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-bold shadow-lg transition
                      ${profile.whatsappAlerts === false 
                        ? "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed select-none pointer-events-none" 
                        : "bg-[#25D366] text-white hover:bg-[#20bd5a] active:scale-95"
                      }`}
                  >
                    <FaWhatsapp className="w-5 h-5" />
                    <span>WhatsApp Message</span>
                  </button>

                  {contactInfo.email && (
                    <a href={`mailto:${contactInfo.email}`}
                      className="w-full flex items-center justify-center space-x-2 bg-indigo-800 text-white border border-indigo-700 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition active:scale-95">
                      <HiMail className="w-5 h-5 text-indigo-300" />
                      <span>{contactInfo.email}</span>
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  <div className="bg-black/20 rounded-2xl p-5 mb-5 text-center border border-white/10 backdrop-blur-sm">
                    <div className="text-4xl mb-3 drop-shadow-md">🔒</div>
                    <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                      {profile.isDummy
                        ? 'Demo provider contact is intentionally hidden.'
                        : 'Contact information is protected. Unlock to view phone number and WhatsApp details.'}
                    </p>
                  </div>
                  <button onClick={handleUnlock} disabled={unlocking || profile.isDummy}
                    className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-extrabold shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
                    {unlocking ? (
                      <><span className="w-5 h-5 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin" /> Unlocking...</>
                    ) : profile.isDummy ? 'Unavailable' : (
                      <>Unlock Full Contact <HiExternalLink className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform"/></>
                    )}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPublicProfile;
