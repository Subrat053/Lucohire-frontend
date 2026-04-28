import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiStar, HiLocationMarker, HiBadgeCheck, HiPhone, HiMail, HiExternalLink } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { recruiterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewSection from '../components/common/ReviewSection';
import toast from 'react-hot-toast';
import { toAbsoluteMediaUrl } from '../utils/media';
import { DUMMY_PROVIDERS } from '../data/skillsData';
import { findProviderById, normalizeProviderData } from '../utils/providerData';
import { getProviderById as fetchProviderById } from '../services/providerService';

const ProviderPublicProfile = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

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
    if (!isAuthenticated) return toast.error('Please login first');
    if ((user?.activeRole || user?.role) !== 'recruiter') return toast.error('Only recruiters can unlock contacts');
    setUnlocking(true);
    try {
      const { data } = await recruiterAPI.unlockContact(id);
      setContactUnlocked(true);
      setContactInfo(data.contact || data.contactInfo);
      toast.success('Contact unlocked!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to unlock';
      if (msg.includes('unlock') || msg.includes('plan') || msg.includes('credits')) {
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!profile) return <div className="text-center py-20"><h2 className="text-xl font-bold">Provider not found</h2></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-indigo-500 to-purple-600 h-22"></div>
        <div className="px-6 pb-6 -mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              {profile.photo ? (
                <img src={toAbsoluteMediaUrl(profile.photo)} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-3xl font-bold text-indigo-600">{profile.user?.name?.[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.user?.name}</h1>
                {profile.isVerified && <HiBadgeCheck className="w-6 h-6 text-blue-500" />}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center text-gray-500"><HiLocationMarker className="w-4 h-4 mr-1" />{profile.city}</span>
                <span className="flex items-center text-gray-500"><HiStar className="w-4 h-4 text-yellow-400 mr-1" />{profile.rating} ({profile.totalReviews} reviews)</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full capitalize">{profile.currentPlan} plan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600">{profile.description || 'No description provided.'}</p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">{skill}</span>
              ))}
            </div>
          </div>

          {(profile.services || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {(profile.services || []).map((service, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">{service}</span>
                ))}
              </div>
            </div>
          )}

          {/* Experience & Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><span className="text-sm text-gray-500">Experience</span><p className="font-medium">{profile.experience || 'N/A'}</p></div>
              <div><span className="text-sm text-gray-500">Languages</span><p className="font-medium">{(profile.languages || []).join(', ') || 'N/A'}</p></div>
              <div><span className="text-sm text-gray-500">City</span><p className="font-medium">{profile.city}</p></div>
              <div><span className="text-sm text-gray-500">Profile Views</span><p className="font-medium">{profile.profileViews || 0}</p></div>
            </div>
          </div>

          {/* Portfolio */}
          {profile.portfolioLinks?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Portfolio</h2>
              <div className="space-y-2">
                {profile.portfolioLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-indigo-600 hover:underline">
                    <HiExternalLink className="w-4 h-4" /><span>{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
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
        </div>

        {/* Sidebar - Contact Card */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Contact {profile.user?.name?.split(' ')[0]}</h3>
            {profile.isDummy && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 mb-4 text-sm">
                Contact is unavailable for demo providers.
              </div>
            )}
            {contactUnlocked && contactInfo ? (
              <div className="space-y-3">
                {(contactInfo.phone || contactInfo.whatsappNumber) && (
                  <a href={`tel:${contactInfo.phone || contactInfo.whatsappNumber}`}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition">
                    <HiPhone className="w-5 h-5" /><span>Call: {contactInfo.phone || contactInfo.whatsappNumber}</span>
                  </a>
                )}
                <a href={`https://wa.me/${(contactInfo.whatsappNumber || contactInfo.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition">
                  <FaWhatsapp className="w-5 h-5" /><span>WhatsApp</span>
                </a>
                {contactInfo.email && (
                  <a href={`mailto:${contactInfo.email}`}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition">
                    <HiMail className="w-5 h-5" /><span>{contactInfo.email}</span>
                  </a>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <p className="text-sm text-gray-600">
                    {profile.isDummy
                      ? 'Demo provider contact is intentionally hidden.'
                      : 'Contact info is hidden. Unlock to view phone & WhatsApp.'}
                  </p>
                </div>
                <button onClick={handleUnlock} disabled={unlocking || profile.isDummy}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {unlocking ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Unlocking...</>
                  ) : profile.isDummy ? 'Contact Unavailable' : 'Unlock Contact'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPublicProfile;
