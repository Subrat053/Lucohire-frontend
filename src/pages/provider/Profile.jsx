import { useState, useEffect, useRef, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import { providerAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { toAbsoluteMediaUrl } from '../../utils/media';
import LocationSearch from '../../components/LocationSearch';
import PricingSuggestionCard from '../../components/provider/PricingSuggestionCard';
import DocumentVerificationStatusCard from '../../components/provider/DocumentVerificationStatusCard';
import AIProfileAssistant from '../../components/provider/AIProfileAssistant';
import ProviderAIChat from '../../components/provider/ProviderAIChat';
import { buildProfile } from '../../services/providerAIService';

// ─── constants ───────────────────────────────────────────────────────────────
const INDIAN_CITIES = [
  'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Noida', 'Gurgaon', 'Delhi NCR',
  'Surat', 'Bhopal', 'Indore', 'Nagpur', 'Patna', 'Chandigarh', 'Coimbatore',
];
export const ALL_SKILLS = [
  'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Driver', 'Cook',
  'Welder', 'Mason', 'AC Technician', 'CCTV Installer', 'Tiler',
  'Interior Designer', 'UI/UX Designer', 'Graphic Designer', 'Web Developer',
  'Mobile Developer', 'Content Writer', 'Digital Marketer', 'Accountant',
  'Data Entry Operator', 'Receptionist', 'Security Guard', 'Housekeeping',
  'Nurse', 'Caretaker', 'Tailor', 'Beautician', 'Yoga Trainer', 'Tutor',
];
export const ALL_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani',
  'Bengali', 'Bhojpuri', 'Bosnian', 'Bulgarian', 'Burmese', 'Cantonese', 'Catalan',
  'Cebuano', 'Chinese (Mandarin)', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English',
  'Esperanto', 'Estonian', 'Farsi (Persian)', 'Finnish', 'French', 'Galician', 'Georgian',
  'German', 'Greek', 'Gujarati', 'Hausa', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic',
  'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kazakh',
  'Khmer', 'Korean', 'Kurdish', 'Lao', 'Latin', 'Latvian', 'Lithuanian', 'Macedonian',
  'Maithili', 'Malay', 'Malayalam', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Odia',
  'Pashto', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Sanskrit', 'Serbian',
  'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Swahili', 'Swedish',
  'Tagalog (Filipino)', 'Tajik', 'Tamil', 'Telugu', 'Thai', 'Tibetan', 'Turkish', 'Ukrainian',
  'Urdu', 'Uzbek', 'Vietnamese', 'Welsh', 'Yoruba', 'Zulu'
];


const OCR_TEST_OPTIONS = [
  { value: 'document', label: 'Document OCR' },
  { value: 'text', label: 'Text OCR' },
];

function inferExperienceMonths(value) {
  const text = String(value || '').toLowerCase().trim();
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
      <button type="button" onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition leading-none text-base">×</button>
    )}
  </span>
);

// ─── TagPicker ───────────────────────────────────────────────────────────────
const TagPicker = ({ available, selected, onAdd, onRemove, placeholder }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = available
    .filter(s => !selected.includes(s))
    .filter(s => s.toLowerCase().includes(query.toLowerCase()));

  const addCustom = () => {
    const val = query.trim();
    if (val && !selected.includes(val)) { onAdd(val); setQuery(''); setOpen(false); }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map(s => <Chip key={s} label={s} onRemove={() => onRemove(s)} />)}
      </div>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-blue-300 text-blue-600 bg-white text-sm font-medium hover:bg-blue-50 transition">
        + Add {placeholder}
      </button>
      {open && (
        <div className="relative z-10 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b">
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
              placeholder={`Search or type ${placeholder}...`}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {query.trim() && !selected.includes(query.trim()) && !filtered.some(f => f.toLowerCase() === query.trim().toLowerCase()) && (
              <li onClick={addCustom}
                className="px-4 py-2.5 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 border-b">
                Add &ldquo;{query.trim()}&rdquo;
              </li>
            )}
            {filtered.map(s => (
              <li key={s} onClick={() => { onAdd(s); setQuery(''); setOpen(false); }}
                className="px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-blue-50">{s}</li>
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
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [plan, setPlan] = useState('free');
  const [profileData, setProfileData] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [newLink, setNewLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMeta, setAiMeta] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentVerification, setDocumentVerification] = useState(null);
  const [ocrTestType, setOcrTestType] = useState('document');
  const [ocrTesting, setOcrTesting] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState('');

  const [form, setForm] = useState({
    name: '', skills: [], locations: [], city: '', state: '',
    tier: 'unskilled', experience: '', languages: [], description: '', portfolioLinks: [],
    photo: '', whatsappAlerts: true, nearestLocation: '', latitude: null, longitude: null,
    pricing: '', pricingType: '',
    location: null,
    profileName: '',
    phone: '',
  });


  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => { fetchProfile(); }, []);

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

    let initialLocs = [];
    if (Array.isArray(profileData.locations) && profileData.locations.length > 0) {
      initialLocs = profileData.locations;
    } else {
      if (profileData.city) initialLocs.push(profileData.city);
      if (profileData.state && profileData.state !== profileData.city) initialLocs.push(profileData.state);
    }

    const displayPhoto = profileData.photo || profileData.profilePhoto || '';
    const initialPhoto = toAbsoluteMediaUrl(
      profileData.user?.profilePhotoApproval?.status === 'pending' && profileData.user?.profilePhotoApproval?.pendingUrl
        ? profileData.user.profilePhotoApproval.pendingUrl
        : displayPhoto
    );

    return (
      form.name !== (profileData.user?.name || '') ||
      form.profileName !== (profileData.profileName || '') ||
      form.phone !== (profileData.user?.phone || '') ||
      form.tier !== (profileData.tier || 'unskilled') ||
      form.experience !== (profileData.experience || '') ||
      form.description !== (profileData.description || '') ||
      String(form.pricing) !== String(profileData.pricing || '') ||
      form.pricingType !== (profileData.pricingType || '') ||
      form.whatsappAlerts !== (profileData.whatsappAlerts !== false) ||
      form.nearestLocation !== (profileData.nearestLocation || '') ||
      form.photo !== initialPhoto ||
      !areArraysEqual(form.skills, profileData.skills || []) ||
      !areArraysEqual(form.locations, initialLocs) ||
      !areArraysEqual(form.languages, profileData.languages || []) ||
      !areArraysEqual(form.portfolioLinks, profileData.portfolioLinks || [])
    );
  }, [form, profileData]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes on your profile. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown === 0) {
      navigate('/provider/plans');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  // Calculate max locations allowed by plan
  const maxLocations = (() => {
    if (!profileData || profileData.currentPlan === 'free' || !profileData.currentPlan) return 1;
    return Math.max(1, Number(profileData.allowedPincodesCount || 1), Number(profileData.allowedCitiesCount || 1));
  })();

  const fetchProfile = async () => {
    try {
      const { data } = await providerAPI.getProfile();
      setPlan(data.currentPlan || 'free');
      setProfileData(data);
      setCompletion(data.profileCompletion || 0);

      // Use the persisted locations array from the backend if available,
      // otherwise fall back to city/state for backwards compat
      let locs = [];
      if (Array.isArray(data.locations) && data.locations.length > 0) {
        locs = data.locations;
      } else {
        if (data.city) locs.push(data.city);
        if (data.state && data.state !== data.city) locs.push(data.state);
      }

      let displayPhoto = data.photo || data.profilePhoto || '';
      // If there's a pending photo, show that as preview
      if (data.user?.profilePhotoApproval?.status === 'pending' && data.user?.profilePhotoApproval?.pendingUrl) {
        displayPhoto = data.user.profilePhotoApproval.pendingUrl;
      }

      setForm({
        name: data.user?.name || '',
        skills: data.skills || [],
        locations: locs,
        city: data.city || '',
        state: data.state || '',
        tier: data.tier || 'unskilled',
        experience: data.experience || '',
        languages: data.languages || [],
        description: data.description || '',
        portfolioLinks: data.portfolioLinks || [],
        photo: toAbsoluteMediaUrl(displayPhoto),
        whatsappAlerts: data.whatsappAlerts !== false,
        nearestLocation: data.nearestLocation || '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        pricing: data.pricing || '',
        pricingType: data.pricingType || '',
        location: data.location || null,
        profileName: data.profileName || '',
        phone: data.user?.phone || '',
      });

      if (displayPhoto) setPhotoPreview(toAbsoluteMediaUrl(displayPhoto));

    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const addLocation = (loc) => {
    const normalized = String(loc || '').trim();
    if (!normalized) return;
    setForm((prev) => {
      // Don't add duplicates
      if (prev.locations.includes(normalized)) return prev;
      // Check plan limit
      if (prev.locations.length >= maxLocations) {
        toast.error(`Your plan allows max ${maxLocations} location${maxLocations > 1 ? 's' : ''}. Upgrade to add more.`);
        return prev;
      }
      const updated = [...prev.locations, normalized];
      return { ...prev, locations: updated, city: updated[0] || '', state: '' };
    });
  };
  const removeLocation = (loc) => {
    setForm((prev) => {
      const updated = prev.locations.filter(l => l !== loc);
      return { ...prev, locations: updated, city: updated[0] || '', state: '' };
    });
  };

  const addSkill = (skill) => {
    if (plan === 'free' && form.skills.length >= 1) {
      if (redirectCountdown !== null) return;
      setShowUpgradePrompt(true);
      setRedirectCountdown(3);
      toast.error('Free tier is limited to 1 speciality. Redirecting to plans...');
      return;
    }
    setForm({ ...form, skills: [...form.skills, skill] });
  };
  const removeSkill = (skill) => {
    const updated = form.skills.filter(s => s !== skill);
    setForm({ ...form, skills: updated });
    if (plan === 'free' && updated.length < 1) {
      setShowUpgradePrompt(false);
      setRedirectCountdown(null);
    }
  };

  const toggleLanguage = (lang) => {
    const langs = form.languages.includes(lang)
      ? form.languages.filter(l => l !== lang)
      : [...form.languages, lang];
    setForm({ ...form, languages: langs });
  };

  const handleAISuggest = async () => {
    if (!aiInput.trim()) {
      toast.error('Enter a short profile intro for AI suggestions');
      return;
    }

    setAiLoading(true);
    try {
      const payload = {
        freeText: aiInput,
        existingSkills: form.skills,
        existingLanguages: form.languages,
        profileContext: {
          city: form.city,
          category: form.skills?.[0] || '',
          skillTier: form.tier,
          experience: form.experience,
          languages: form.languages,
        },
      };

      if (import.meta.env.DEV) {
        console.log('[AIProfileAssistant] request payload', payload);
      }

      const { data } = await buildProfile(payload);

      if (import.meta.env.DEV) {
        console.log('[AIProfileAssistant] response payload', data);
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.message || 'Invalid AI response');
      }

      const profile = data.data;

      const incomingSkills = Array.isArray(profile.skills) ? profile.skills : [];
      const incomingLanguages = profile.language ? [profile.language] : [];
      // Local extraction for name, experience, skills, phone, pricing, and pricingType from the freeText intro
      const localExtracted = {};

      let nameMatch = aiInput.match(/(?:my name is|i am|this is)\s+([a-zA-Z]{3,15}(?:\s+[a-zA-Z]{3,15}){1,2})/i);
      if (!nameMatch) nameMatch = aiInput.match(/(?:naam|name)\s+([a-zA-Z]{3,15}(?:\s+[a-zA-Z]{3,15}){1,2})\s+(?:hai|hu|hoon)/i);
      if (!nameMatch) nameMatch = aiInput.match(/\b([a-zA-Z]{3,15}(?:\s+[a-zA-Z]{3,15}){1,2})\s+here\b/i);
      if (nameMatch) {
        localExtracted.name = nameMatch[1].trim();
      }

      const expYearsMatch = aiInput.match(/(\d+(?:\.\d+)?)\s*(?:saal|sal|year|years|yr|yrs)\b/i);
      const expMonthsMatch = aiInput.match(/(\d+)\s*(?:mahina|mahine|month|months|mo|mos)\b/i);
      if (expYearsMatch) {
        localExtracted.experience = `${expYearsMatch[1]} years`;
      } else if (expMonthsMatch) {
        localExtracted.experience = `${expMonthsMatch[1]} months`;
      }

      const localSkills = [];
      const lowerInput = aiInput.toLowerCase();
      ALL_SKILLS.forEach(skill => {
        let keyword = skill.toLowerCase();
        if (keyword === 'cctv installer') {
          if (lowerInput.includes('cctv')) {
            localSkills.push(skill);
          }
        } else if (keyword === 'ac technician') {
          if (/\bac\b/i.test(lowerInput) || lowerInput.includes('ac technician')) {
            localSkills.push(skill);
          }
        } else {
          if (lowerInput.includes(keyword)) {
            localSkills.push(skill);
          }
        }
      });

      const combinedSkills = [...new Set([...form.skills, ...incomingSkills, ...localSkills])];
      const maxSkills = plan === 'free' ? 1 : combinedSkills.length;

      const nextCity = String(profile.detectedLocation || '').trim();
      let nextLocations = form.locations;
      if (nextCity) {
        if (!form.locations.includes(nextCity)) {
          const combined = [...form.locations, nextCity];
          const maxLocs = plan === 'free' ? 1 : maxLocations;
          nextLocations = combined.slice(-maxLocs);
        }
      }

      const nextExperience = localExtracted.experience || profile.experienceLabel
        || (Number(profile.experienceMonths || 0) > 0 ? `${profile.experienceMonths} months` : form.experience);
      
      const phoneMatch = aiInput.match(/\b\d{10}\b/);
      if (phoneMatch) {
        localExtracted.phone = phoneMatch[0];
      }

      const msgLower = aiInput.toLowerCase();
      if (msgLower.includes('hour') || msgLower.includes('ghante') || msgLower.includes('per hour') || msgLower.includes('/hr')) {
        localExtracted.pricingType = 'hourly';
      } else if (msgLower.includes('month') || msgLower.includes('mahina') || msgLower.includes('monthly') || msgLower.includes('/mo')) {
        localExtracted.pricingType = 'monthly';
      } else if (msgLower.includes('day') || msgLower.includes('din') || msgLower.includes('daily') || msgLower.includes('/day')) {
        localExtracted.pricingType = 'daily';
      } else if (msgLower.includes('fixed')) {
        localExtracted.pricingType = 'fixed';
      }

      const numbers = aiInput.match(/\b\d{3,6}\b/g);
      if (numbers && (!phoneMatch || numbers.every(num => !phoneMatch[0].includes(num)))) {
        localExtracted.pricing = numbers[0];
      }

      setForm((prev) => ({
        ...prev,
        name: localExtracted.name || prev.name,
        profileName: localExtracted.name || prev.profileName,
        skills: combinedSkills.slice(0, maxSkills),
        description: profile.description || prev.description,
        languages: [...new Set([...prev.languages, ...incomingLanguages])],
        city: nextCity || prev.city,
        nearestLocation: nextCity || prev.nearestLocation,
        locations: nextLocations,
        experience: nextExperience,
        phone: localExtracted.phone || prev.phone,
        pricing: localExtracted.pricing || prev.pricing,
        pricingType: localExtracted.pricingType || prev.pricingType,
      }));

      setAiMeta({
        headline: profile.headline || '',
        category: profile.category || '',
        detectedLocation: profile.detectedLocation || '',
        skills: profile.skills || [],
        suggestedPricingRange: profile.suggestedPricingRange || '',
        experienceLabel: profile.experienceLabel || '',
        missingFields: profile.missingFields || [],
        status: data.source || 'rule_based',
      });
      toast.success('AI suggestions applied to your profile draft');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AIProfileAssistant] error', err);
      }
      toast.error(err.response?.data?.message || err.message || 'Failed to generate AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) { fileInputRef.current?.click(); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('profilePhoto', photoFile);
    try {
      const { data } = await providerAPI.uploadProfilePhoto(fd);
      setPhotoFile(null);
      if (data?.url) {
        const absoluteUrl = toAbsoluteMediaUrl(data.url);
        setPhotoPreview(absoluteUrl);
        setForm(prev => ({ ...prev, photo: absoluteUrl }));
      }
      await fetchUser();
      toast.success('Profile photo updated successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Photo upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPreview('');
    setPhotoFile(null);
    setForm(f => ({ ...f, photo: '' }));
    try {
      await providerAPI.deleteProfilePhoto();
      await fetchUser();
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo from server');
    }
  };

  const handleSave = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!form.city && form.locations.length === 0) {
      return toast.error('Please add at least one service location / city (Location is mandatory)');
    }
    if (form.skills.length === 0) {
      return toast.error('Please select at least one speciality / skill (Speciality is mandatory)');
    }
    const cleanPhone = String(form.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return toast.error('Please enter a valid 10-digit WhatsApp/Contact number (Contact number is mandatory)');
    }
    if (!form.pricing || Number(form.pricing) <= 0) {
      return toast.error('Please enter a valid payout / pricing rate (Payout is mandatory)');
    }
    if (!form.pricingType) {
      return toast.error('Please select a pricing unit (Pricing Unit is mandatory)');
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name, skills: form.skills, tier: form.tier, experience: form.experience,
        city: form.city, state: form.state, locations: form.locations,
        languages: form.languages,
        description: form.description, portfolioLinks: form.portfolioLinks,
        whatsappAlerts: form.whatsappAlerts,
        nearestLocation: form.nearestLocation,
        latitude: form.latitude,
        longitude: form.longitude,
        pricing: form.pricing,
        pricingType: form.pricingType,
        profileName: form.profileName,
        phone: cleanPhone,
      };

      const { data } = await providerAPI.updateProfile(payload);
      setCompletion(data.profileCompletion || completion);
      toast.success('Profile updated successfully!');
      await fetchProfile();
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      toast.error('Please choose a document first');
      return;
    }

    const formData = new FormData();
    formData.append('document', documentFile);
    setUploadingDocument(true);

    try {
      const { data } = await providerAPI.uploadDocument(formData);
      setDocumentVerification(data.verification || null);
      setDocumentFile(null);
      toast.success('Document uploaded. OCR verification started.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Document upload failed');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleOcrTest = async () => {
    if (!documentFile) {
      toast.error('Please choose a document image first');
      return;
    }

    if (!documentFile.type?.startsWith('image/')) {
      toast.error('OCR test supports image files only (JPG/PNG/WEBP)');
      return;
    }

    const formData = new FormData();
    formData.append('image', documentFile);
    setOcrTesting(true);
    setOcrError('');
    setOcrResult(null);

    try {
      const response = ocrTestType === 'text'
        ? await aiAPI.ocrText(formData)
        : await aiAPI.ocrDocument(formData);

      setOcrResult(response.data?.data || {});
      toast.success('OCR test completed');
    } catch (err) {
      const message = err?.response?.data?.message || 'OCR test failed';
      setOcrError(message);
      toast.error(message);
    } finally {
      setOcrTesting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-sky-100 via-blue-200 to-blue-500">
      <LoadingSpinner size="lg" />
    </div>
  );

  const avatarSrc = photoPreview || form.photo;

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-100 via-blue-200 to-blue-500 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900">
            ServiceHub&nbsp;
            <span className="font-normal text-blue-700">Service Provider</span>
            &nbsp;Registration
          </h1>
          <div className="h-0.5 bg-linear-to-r from-transparent via-blue-400 to-transparent mt-3 mb-4" />
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
            <span className="text-blue-800 font-medium">Profile {completion}% complete</span>
            <div className="w-28 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {isDirty && (
          <div className="mb-4 bg-amber-500/90 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-pulse border border-amber-400/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-sm">Unsaved Draft Changes</p>
                <p className="text-xs text-amber-50 leading-tight">Your changes are in draft. Refreshing or leaving the page will discard them.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-amber-700 font-semibold px-4 py-1.5 rounded-full hover:bg-amber-50 transition text-xs shrink-0 shadow-sm animate-none"
            >
              {saving ? 'Saving...' : 'Save Now'}
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">

        <div className="mb-4">
          <AIProfileAssistant
            aiInput={aiInput}
            onAiInputChange={setAiInput}
            onGenerate={handleAISuggest}
            aiLoading={aiLoading}
            aiMeta={aiMeta}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>



            {/* ── Basic Info Card ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden p-5 space-y-4">
              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label className="text-sm font-semibold text-gray-600 sm:w-44 shrink-0">Full Name</label>
                <input value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300 border-b border-gray-200 focus:border-blue-400 transition py-2" />
              </div>
              <hr className="border-gray-100" />
              {/* Profile / Display Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label className="text-sm font-semibold text-gray-600 sm:w-44 shrink-0">Profile / Display Name</label>
                <input value={form.profileName}
                  onChange={e => setForm({ ...form, profileName: e.target.value })}
                  placeholder="Publicly visible name"
                  className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300 border-b border-gray-200 focus:border-blue-400 transition py-2" />
              </div>
              <hr className="border-gray-100" />
              {/* WhatsApp / Contact Number */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label className="text-sm font-semibold text-gray-600 sm:w-44 shrink-0">WhatsApp / Contact *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter 10-digit WhatsApp number"
                  className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300 border-b border-gray-200 focus:border-blue-400 transition py-2"
                />
              </div>
              <hr className="border-gray-100" />
              {/* Your Profession */}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                <label className="text-sm font-semibold text-gray-600 sm:w-44 shrink-0 pt-1">Your Profession</label>
                <div className="flex flex-wrap gap-2 py-1">
                  {form.skills.slice(0, 4).map(s => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                  {form.skills.length > 4 && (
                    <span className="text-xs text-blue-500">+{form.skills.length - 4} more</span>
                  )}
                  {form.skills.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Add specialities below ↓</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Photo Upload ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 flex flex-col items-center gap-3 relative">
              <div className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-md overflow-hidden bg-blue-50 flex items-center justify-center relative">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Profile Photo</p>
                <p className="text-xs text-gray-400">JPG/PNG, max 5MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handlePhotoChange} className="hidden" />
              <div className="flex gap-3">
                <button type="button"
                  onClick={photoFile ? handlePhotoUpload : () => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 shadow-sm">
                  {photoFile ? 'Save New Photo' : 'Change Photo'}
                </button>
                {(avatarSrc || photoFile) && (
                  <button type="button" onClick={handleRemovePhoto}
                    className="px-5 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                    Remove
                  </button>
                )}
              </div>
            </div>


            {/* ── Speciality ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <p className="font-semibold text-gray-800 mb-3">Speciality</p>
              <TagPicker
                available={ALL_SKILLS}
                selected={form.skills}
                onAdd={addSkill}
                onRemove={removeSkill}
                placeholder="Speciality"
              />
              {plan === 'free' && showUpgradePrompt && (
                <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-xs text-red-600 font-semibold">
                    {redirectCountdown !== null 
                      ? `First 1 speciality are free. Redirecting to plans page in ${redirectCountdown}s...`
                      : 'First 1 speciality are free. Upgrade to select more.'}
                  </p>
                  {redirectCountdown === null && (
                    <button
                      type="button"
                      onClick={() => navigate('/provider/plans')}
                      className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      Choose Plan
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Location ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <div className="mb-1">
                <p className="font-semibold text-gray-800">
                  Location <span className="text-gray-400 font-normal text-sm">(Service Area)</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 mb-3 italic">
                {maxLocations > 1
                  ? `You can add up to ${maxLocations} service locations.`
                  : 'Choose one service location.'}
              </p>
              <div className="mb-3">
                <LocationSearch
                  value={form.nearestLocation || form.city}
                  onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
                  onSelect={(item) => {
                    if (!item) return;
                    const nextName = item.name || item.formattedAddress || '';
                    // Use a single functional state update to prevent race conditions
                    setForm((prev) => {
                      // Check for duplicate
                      if (prev.locations.includes(nextName)) {
                        return {
                          ...prev,
                          city: item.city || nextName,
                          state: item.state || '',
                          nearestLocation: nextName,
                          latitude: item.latitude ?? prev.latitude,
                          longitude: item.longitude ?? prev.longitude,
                          location: item,
                        };
                      }
                      // Check plan limit
                      if (prev.locations.length >= maxLocations) {
                        toast.error(`Your plan allows max ${maxLocations} location${maxLocations > 1 ? 's' : ''}. Upgrade to add more.`);
                        return {
                          ...prev,
                          nearestLocation: nextName,
                          latitude: item.latitude ?? prev.latitude,
                          longitude: item.longitude ?? prev.longitude,
                          location: item,
                        };
                      }
                      const updated = [...prev.locations, nextName];
                      return {
                        ...prev,
                        locations: updated,
                        city: item.city || nextName,
                        state: item.state || '',
                        nearestLocation: nextName,
                        latitude: item.latitude ?? prev.latitude,
                        longitude: item.longitude ?? prev.longitude,
                        location: item,
                      };
                    });
                  }}
                  placeholder="Search and add a service location"
                />
              </div>

              {/* Location Chips */}
              {form.locations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.locations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-3 py-1.5 rounded-full font-medium shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {loc}
                      <button type="button" onClick={() => removeLocation(loc)}
                        className="text-blue-400 hover:text-red-500 transition leading-none text-base ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Informational hint when at limit */}
              {form.locations.length >= maxLocations && maxLocations === 1 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <span>⚡</span> Upgrade your plan to add multiple service locations.
                </p>
              )}
            </div>

            {/* ── Experience & About ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5 space-y-4">
              <div className="mt-1">
                <PricingSuggestionCard skill={form.skills?.[0]} city={form.city} />
              </div>

              <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3">
                <p className="text-xs font-semibold text-blue-800 mb-2">Aadhaar Verification</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      setDocumentFile(e.target.files?.[0] || null);
                      setOcrResult(null);
                      setOcrError('');
                    }}
                    className="text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleDocumentUpload}
                    disabled={uploadingDocument}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {uploadingDocument ? 'Uploading…' : 'Upload & Verify'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <select
                    value={ocrTestType}
                    onChange={(e) => setOcrTestType(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-blue-200"
                  >
                    {OCR_TEST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleOcrTest}
                    disabled={ocrTesting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {ocrTesting ? 'Testing OCR…' : 'Test OCR'}
                  </button>
                  <p className="text-[11px] text-blue-700">Test OCR works with image files only.</p>
                </div>

                {ocrError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {ocrError}
                  </div>
                )}

                {ocrResult && (
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    <p className="text-xs font-semibold text-blue-800">OCR Test Result</p>
                    {typeof ocrResult.fullText === 'string' && ocrResult.fullText.trim() && (
                      <pre className="mt-1 text-[11px] text-blue-900 whitespace-pre-wrap max-h-24 overflow-auto">{ocrResult.fullText}</pre>
                    )}
                    <pre className="mt-1 text-[11px] text-blue-900 whitespace-pre-wrap max-h-32 overflow-auto">{JSON.stringify(ocrResult, null, 2)}</pre>
                  </div>
                )}

                <div className="mt-2">
                  <DocumentVerificationStatusCard verification={documentVerification} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Skill Tier</label>
                <select value={form.tier}
                  onChange={e => setForm({ ...form, tier: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white">
                  <option value="unskilled">Unskilled</option>
                  <option value="semi-skilled">Semi-Skilled</option>
                  <option value="skilled">Skilled</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Select your skill level category</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                <input value={form.experience}
                  onChange={e => setForm({ ...form, experience: e.target.value })}
                  placeholder="e.g. 5 years"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">About You</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Tell clients about your experience, specialties, and working style…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pricing (₹)</label>
                  <input
                    type="text"
                    value={form.pricing}
                    onChange={e => setForm({ ...form, pricing: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pricing Unit</label>
                  <select
                    value={form.pricingType}
                    onChange={e => setForm({ ...form, pricingType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  >
                    <option value="">Select Unit</option>
                    <option value="hourly">per Hour</option>
                    <option value="daily">per Day</option>
                    <option value="monthly">per Month</option>
                    <option value="fixed">Fixed Rate</option>
                  </select>
                </div>
              </div>
            </div>


            {/* ── Languages ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <p className="font-semibold text-gray-800 mb-3">Languages Spoken</p>
              <TagPicker
                available={ALL_LANGUAGES}
                selected={form.languages}
                onAdd={(lang) => {
                  if (!form.languages.includes(lang)) {
                    setForm(prev => ({ ...prev, languages: [...prev.languages, lang] }));
                  }
                }}
                onRemove={(lang) => {
                  setForm(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
                }}
                placeholder="Language"
              />
            </div>


            {/* ── Portfolio Links ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">Portfolio / Links</p>
                <button type="button" onClick={() => setShowLinkInput(v => !v)}
                  className="text-sm text-blue-600 hover:underline">+ Add Link</button>
              </div>
              {form.portfolioLinks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {form.portfolioLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 text-sm truncate flex-1">{link}</a>
                      <button type="button"
                        onClick={() => setForm({ ...form, portfolioLinks: form.portfolioLinks.filter((_, j) => j !== i) })}
                        className="text-gray-400 hover:text-red-500 ml-3 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
              {showLinkInput && (
                <div className="flex gap-2">
                  <input value={newLink} onChange={e => setNewLink(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newLink.trim()) {
                          setForm({ ...form, portfolioLinks: [...form.portfolioLinks, newLink.trim()] });
                          setNewLink(''); setShowLinkInput(false);
                        }
                      }
                    }}
                    placeholder="https://your-portfolio.com"
                    className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
                  <button type="button"
                    onClick={() => {
                      if (newLink.trim()) {
                        setForm({ ...form, portfolioLinks: [...form.portfolioLinks, newLink.trim()] });
                        setNewLink(''); setShowLinkInput(false);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">Add</button>
                </div>
              )}
            </div>

            {/* ── WhatsApp Toggle ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">WhatsApp Alerts</p>
                  <p className="text-sm text-gray-400">Get instant notifications for new leads</p>
                </div>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, whatsappAlerts: !f.whatsappAlerts }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.whatsappAlerts ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform duration-200 ${form.whatsappAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* ── Plan Banner ── */}
            {plan === 'free' ? (
              <div className="bg-blue-600/90 backdrop-blur-sm rounded-2xl p-5 text-white text-center shadow-lg">
                <p className="font-bold text-lg mb-1">Unlock More Visibility</p>
                <p className="text-blue-100 text-sm mb-4">
                  Upgrade to add unlimited specialities, get top placement &amp; instant job alerts.
                </p>
                <button type="button" onClick={() => navigate('/provider/plans')}
                  className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-full hover:bg-blue-50 transition text-sm shadow">
                  View Plans →
                </button>
              </div>
            ) : (
              <div className="bg-green-500/20 backdrop-blur-sm border border-green-300/40 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-800 capitalize">Active: {plan} Plan</p>
                  <p className="text-sm text-green-700">All premium features unlocked.</p>
                </div>
                <button type="button" onClick={() => navigate('/provider/plans')}
                  className="ml-auto text-sm text-green-700 underline hover:text-green-900">Manage</button>
              </div>
            )}

          </div>
          {/* ── Save Button ── */}
          <button type="submit" disabled={saving}
            className="block mx-auto bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-semibold text-base hover:bg-blue-700 active:scale-[.98] transition disabled:opacity-50 shadow-lg shadow-blue-300/40">
            {saving ? 'Saving…' : 'Save Profile'}
          </button>

          <p className="text-center text-xs text-blue-900/50 pb-6">
            Your profile is visible to recruiters searching in your service area.
          </p>

        </form>
      </div>
      <ProviderAIChat
        profileContext={{
          city: form.city,
          category: form.skills?.[0] || '',
          experienceMonths: inferExperienceMonths(form.experience),
          skillTier: form.tier,
          languages: form.languages,
          skills: form.skills,
        }}
        missingFields={(() => {
          const missing = [];
          if (!form.city && form.locations.length === 0) missing.push('Location / City');
          if (form.skills.length === 0) missing.push('Speciality / Skill');
          const cleanPhone = String(form.phone || '').replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 10) missing.push('WhatsApp / Contact Number');
          if (!form.pricing || Number(form.pricing) <= 0) missing.push('Payout / Pricing Rate');
          if (!form.pricingType) missing.push('Pricing Unit');
          return missing;
        })()}
        onUpdateField={(field, value) => {
          setForm(prev => {
            const next = { ...prev };
            if (field === 'city' || field === 'location') {
              next.city = value;
              next.nearestLocation = value;
              if (value) {
                const maxLocs = plan === 'free' ? 1 : maxLocations;
                if (!next.locations.includes(value)) {
                  const combined = [...next.locations, value];
                  next.locations = combined.slice(-maxLocs);
                }
              }
            } else if (field === 'skills') {
              let combined = [];
              if (Array.isArray(value)) {
                combined = [...new Set([...next.skills, ...value])];
              } else if (typeof value === 'string' && value) {
                combined = [...new Set([...next.skills, value])];
              }
              const maxSkills = plan === 'free' ? 1 : combined.length;
              next.skills = combined.slice(0, maxSkills);
            } else if (field === 'phone') {
              next.phone = value;
            } else if (field === 'pricing') {
              next.pricing = String(value);
            } else if (field === 'pricingType') {
              next.pricingType = value;
            } else if (field === 'name' || field === 'profileName') {
              next.name = value;
              next.profileName = value;
            } else if (field === 'experience') {
              next.experience = value;
            }
            return next;
          });
        }}
      />
    </div>
  );
};

export default ProviderProfile;