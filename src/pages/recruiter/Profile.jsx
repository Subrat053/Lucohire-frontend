import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiSave, HiCamera, HiUser, HiOfficeBuilding,
  HiLocationMarker, HiInformationCircle, HiArrowLeft,
  HiCheckCircle,
} from 'react-icons/hi';
import { FaUserTie } from 'react-icons/fa';
import { recruiterAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkillPicker from '../../components/common/SkillPicker';
import toast from 'react-hot-toast';
import { toAbsoluteMediaUrl } from '../../utils/media';
import LocationSearch from '../../components/LocationSearch';

const InputField = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm bg-white transition';

const RecruiterProfile = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', companyName: '', companyType: 'individual',
    city: '', state: '', description: '', skillsNeeded: [],
    nearestLocation: '', latitude: null, longitude: null,
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [savedPhoto, setSavedPhoto] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await recruiterAPI.getDashboard();
      const p = data.profile || {};
      setForm({
        name: user?.name || '',
        companyName: p.companyName || '',
        companyType: p.companyType || 'individual',
        city: p.city || '',
        state: p.state || '',
        description: p.description || '',
        skillsNeeded: p.skillsNeeded || [],
        nearestLocation: p.nearestLocation || '',
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
      });
      if (p.profilePhoto) {
        const url = toAbsoluteMediaUrl(p.profilePhoto);
        setSavedPhoto(url);
        setPhotoPreview(url);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5 MB');
    setPhotoPreview(URL.createObjectURL(file));
    handlePhotoUpload(file);
  };

  const handlePhotoUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePhoto', file);
    try {
      const { data } = await recruiterAPI.uploadProfilePhoto(formData);
      const url = toAbsoluteMediaUrl(data.url);
      setSavedPhoto(url);
      setPhotoPreview(url);
      await fetchUser();
      toast.success('Photo uploaded!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload photo';
      toast.error(msg);
      setPhotoPreview(savedPhoto);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPreview('');
    setSavedPhoto('');
    try {
      await recruiterAPI.deleteProfilePhoto();
      await fetchUser();
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo from server');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await recruiterAPI.updateProfile(form);
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const displayPhoto = photoPreview || savedPhoto;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#f8f9ff 60%,#fafafa 100%)' }}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-500">Keep your profile up to date</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* ── Photo + Basic Info ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-5 flex items-center gap-2">
                <HiUser className="w-4 h-4 text-blue-500" /> Basic Information
              </h2>

              {/* Photo upload */}
              <div className="flex items-center gap-5 mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-100 flex items-center justify-center">
                    {displayPhoto ? (
                      <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <FaUserTie className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition"
                  >
                    <HiCamera className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Profile Photo</p>
                  <p className="text-xs text-gray-500 mt-0.5">JPG or PNG, max 5 MB</p>
                  {savedPhoto && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium">
                      <HiCheckCircle className="w-3.5 h-3.5" /> Photo saved
                    </span>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      {uploading ? 'Uploading…' : 'Change Photo'}
                    </button>
                    {displayPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                        className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Full Name" required>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    placeholder="Your full name"
                  />
                </InputField>
                <InputField label="Company / Brand Name">
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </InputField>
              </div>
            </div>

            {/* ── Company Details ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-5 flex items-center gap-2">
                <HiOfficeBuilding className="w-4 h-4 text-indigo-500" /> Company Details
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <InputField label="Type">
                  <select
                    value={form.companyType}
                    onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                    className={inputCls}
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="shop">Shop</option>
                    <option value="home">Home User</option>
                    <option value="other">Other</option>
                  </select>
                </InputField>
                <InputField label="City">
                  <LocationSearch
                    value={form.city}
                    onChange={(value) => setForm({ ...form, city: value })}
                    onSelect={(item) => setForm((prev) => ({
                      ...prev,
                      city: item?.name || prev.city,
                      nearestLocation: item?.name || prev.nearestLocation,
                      latitude: item?.lat ?? prev.latitude,
                      longitude: item?.lon ?? prev.longitude,
                    }))}
                    placeholder="e.g. Mumbai"
                  />
                </InputField>
                <InputField label="State">
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Maharashtra"
                  />
                </InputField>
              </div>
              <div className="mt-3">
              </div>
              <div className="mt-4">
                <InputField label="About / Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Brief description of your company or hiring needs..."
                  />
                </InputField>
              </div>
            </div>
          </div>
          {/* ── Skills Needed ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-extrabold text-gray-900 mb-1 flex items-center gap-2">
              <HiInformationCircle className="w-4 h-4 text-purple-500" /> Skills You&apos;re Looking to Hire
            </h2>
            <p className="text-xs text-gray-500 mb-4">Providers matching these skills will appear in your results.</p>
            <SkillPicker
              selectedSkills={form.skillsNeeded}
              onChange={(skills) => setForm({ ...form, skillsNeeded: skills })}
              maxSkills={0}
              placeholder="Select skills you want to hire for…"
            />
          </div>

          {/* ── Actions ────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/recruiter/dashboard')}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <HiSave className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruiterProfile;
