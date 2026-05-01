import { useState, useEffect, useRef } from 'react';
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
const ALL_SKILLS = [
  'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Driver', 'Cook',
  'Welder', 'Mason', 'AC Technician', 'CCTV Installer', 'Tiler',
  'Interior Designer', 'UI/UX Designer', 'Graphic Designer', 'Web Developer',
  'Mobile Developer', 'Content Writer', 'Digital Marketer', 'Accountant',
  'Data Entry Operator', 'Receptionist', 'Security Guard', 'Housekeeping',
  'Nurse', 'Caretaker', 'Tailor', 'Beautician', 'Yoga Trainer', 'Tutor',
];
const LANGUAGE_OPTIONS = [
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
  'Gujarati', 'Kannada', 'Punjabi', 'Urdu',
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
            {filtered.length === 0 && query && (
              <li onClick={addCustom}
                className="px-4 py-2.5 text-sm text-blue-600 cursor-pointer hover:bg-blue-50">
                Add &ldquo;{query}&rdquo;
              </li>
            )}
            {filtered.map(s => (
              <li key={s} onClick={() => { onAdd(s); setQuery(''); }}
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
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await providerAPI.getProfile();
      setPlan(data.currentPlan || 'free');
      setCompletion(data.profileCompletion || 0);
      const locs = [];
      if (data.city) locs.push(data.city);
      if (data.state && data.state !== data.city) locs.push(data.state);
      const existingPhoto = data.photo || data.profilePhoto || '';
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
        photo: toAbsoluteMediaUrl(existingPhoto),
        whatsappAlerts: data.whatsappAlerts !== false,
        nearestLocation: data.nearestLocation || '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      });
      if (existingPhoto) setPhotoPreview(toAbsoluteMediaUrl(existingPhoto));
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const addLocation = (loc) => {
    const normalized = String(loc || '').trim();
    if (!normalized) return;
    // Enforce single selected location.
    setForm({ ...form, locations: [normalized], city: normalized, state: '' });
  };
  const removeLocation = (loc) => {
    const updated = form.locations.filter(l => l !== loc);
    setForm({ ...form, locations: updated, city: updated[0] || '', state: '' });
  };

  const addSkill = (skill) => {
    if (plan === 'free' && form.skills.length >= 4) {
      toast.error('Free plan allows up to 4 skills. Upgrade to add more!');
      return;
    }
    setForm({ ...form, skills: [...form.skills, skill] });
  };
  const removeSkill = (skill) => setForm({ ...form, skills: form.skills.filter(s => s !== skill) });

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

      const combinedSkills = [...new Set([...form.skills, ...incomingSkills])];
      const maxSkills = plan === 'free' ? 4 : combinedSkills.length;

      const nextCity = String(profile.detectedLocation || '').trim();
      const nextLocations = nextCity ? [nextCity] : form.locations;

      const nextExperience = profile.experienceLabel
        || (Number(profile.experienceMonths || 0) > 0 ? `${profile.experienceMonths} months` : form.experience);

      setForm((prev) => ({
        ...prev,
        skills: combinedSkills.slice(0, maxSkills),
        description: profile.description || prev.description,
        languages: [...new Set([...prev.languages, ...incomingLanguages])],
        city: nextCity || prev.city,
        nearestLocation: nextCity || prev.nearestLocation,
        locations: nextLocations,
        experience: nextExperience,
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
      await fetchUser();
      toast.success('Photo submitted for admin approval. Your current photo will remain until approved.');
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
    e.preventDefault();
    if (!form.city) return toast.error('Add at least one service location');
    if (form.skills.length === 0) return toast.error('Add at least one speciality');
    setSaving(true);
    try {
      const payload = {
        name: form.name, skills: form.skills, tier: form.tier, experience: form.experience,
        city: form.city, state: form.state, languages: form.languages,
        description: form.description, portfolioLinks: form.portfolioLinks,
        whatsappAlerts: form.whatsappAlerts,
        nearestLocation: form.nearestLocation,
        latitude: form.latitude,
        longitude: form.longitude,
      };
      const { data } = await providerAPI.updateProfile(payload);
      setCompletion(data.profileCompletion || completion);
      toast.success('Profile updated successfully!');
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

        <form onSubmit={handleSave} className="space-y-4">
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>


            {/* ── Basic Info Card ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-600 w-44 whitespace-nowrap">Full Name</td>
                    <td className="px-5 py-4">
                      <input value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300 border-b border-transparent focus:border-blue-300 transition" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-600 align-top pt-4 whitespace-nowrap">
                      WhatsApp /<br />Contact Number
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {user?.phone
                        ? <span className="font-medium">{user.phone}</span>
                        : <span className="text-gray-400 italic text-xs">Not linked — sign in via WhatsApp to link</span>
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-600 align-top pt-4 whitespace-nowrap">Your Profession</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
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
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Photo Upload ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-6 flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-md overflow-hidden bg-blue-50 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Upload Photo</p>
                <p className="text-xs text-gray-400">JPG/PNG, max 5MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handlePhotoChange} className="hidden" />
              <div className="flex gap-3">
                <button type="button"
                  onClick={photoFile ? handlePhotoUpload : () => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 shadow-sm">
                  {uploading ? 'Uploading…' : 'Upload / Change'}
                </button>
                <button type="button" onClick={handleRemovePhoto}
                  className="px-5 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                  Remove
                </button>
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
              <p className="text-xs text-gray-400 mt-3">
                {plan === 'free'
                  ? 'First 2 specialities are free. Add more with a plan.'
                  : 'Your plan allows unlimited specialities.'}
              </p>
            </div>

            {/* ── Location ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <div className="mb-1">
                <p className="font-semibold text-gray-800">
                  Location <span className="text-gray-400 font-normal text-sm">(Service Area)</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 mb-3 italic">Choose one service location.</p>
              <div className="mb-3">
                <LocationSearch
                  value={form.city}
                  onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
                  onSelect={(item) => {
                    const nextName = item?.name || '';
                    if (!nextName) return;
                    addLocation(nextName);
                    setForm((prev) => ({
                      ...prev,
                      city: nextName,
                      nearestLocation: nextName,
                      latitude: item?.lat ?? prev.latitude,
                      longitude: item?.lon ?? prev.longitude,
                    }));
                  }}
                  placeholder="Search and add a service location"
                />
              </div>
              <TagPicker
                available={INDIAN_CITIES}
                selected={form.locations}
                onAdd={addLocation}
                onRemove={removeLocation}
                placeholder="Location"
              />
            </div>

            {/* ── Experience & About ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5 space-y-4">
              <AIProfileAssistant
                aiInput={aiInput}
                onAiInputChange={setAiInput}
                onGenerate={handleAISuggest}
                aiLoading={aiLoading}
                aiMeta={aiMeta}
              />

              <div className="mt-3">
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
            </div>

            {/* ── Languages ── */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-5">
              <p className="font-semibold text-gray-800 mb-3">Languages Spoken</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${form.languages.includes(lang)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }`}>{lang}</button>
                ))}
              </div>
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
      />
    </div>
  );
};

export default ProviderProfile;