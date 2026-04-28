import { useState, useEffect } from 'react';
import { HiSave, HiRefresh, HiCog, HiPhotograph, HiDocumentText, HiEye, HiEyeOff, HiCloud, HiChip, HiCheckCircle } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { toAbsoluteMediaUrl } from '../../utils/media';

const TABS = [
  { id: 'general',   label: 'General',   icon: HiCog },
  { id: 'cloudinary',label: 'Cloudinary',icon: HiCloud },
  { id: 'profile',   label: 'Admin Profile', icon: HiPhotograph },
  { id: 'content',   label: 'Page Content',  icon: HiDocumentText },
  { id: 'rotation',  label: 'Rotation Pools',icon: HiChip },
];

const AdminSettings = () => {
  const { fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  // General settings
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState({});

  // Cloudinary
  const [cloudinary, setCloudinary] = useState({ cloudinary_cloud_name: '', cloudinary_api_key: '', cloudinary_api_secret: '' });
  const [cloudinaryLoading, setCloudinaryLoading] = useState(true);
  const [savingCloudinary, setSavingCloudinary] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Rotation
  const [rotation, setRotation] = useState([]);
  const [rotationLoading, setRotationLoading] = useState(false);

  // Admin photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [adminPhoto, setAdminPhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Page content
  const [faqContent, setFaqContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [savingContent, setSavingContent] = useState('');

  useEffect(() => { fetchSettings(); fetchCloudinary(); fetchRotation(); fetchContent(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await adminAPI.getSettings();
      const list = Array.isArray(data) ? data : data.settings || [];
      setSettings(list);
      const vals = {};
      list.forEach(s => { vals[s._id] = s.value; });
      setEditValues(vals);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const fetchCloudinary = async () => {
    try {
      const { data } = await adminAPI.getCloudinarySettings();
      setCloudinary({
        cloudinary_cloud_name: data.cloudinary_cloud_name || '',
        cloudinary_api_key: data.cloudinary_api_key || '',
        cloudinary_api_secret: data.cloudinary_api_secret || '',
      });
    } catch { /* silent */ }
    finally { setCloudinaryLoading(false); }
  };

  const fetchRotation = async () => {
    try {
      setRotationLoading(true);
      const { data } = await adminAPI.getRotationPools();
      setRotation(Array.isArray(data) ? data : data.pools || []);
    } catch { console.error('Failed to load rotation pools'); }
    finally { setRotationLoading(false); }
  };

  const fetchContent = async () => {
    try {
      const [faq, terms, privacy] = await Promise.all([
        adminAPI.getContent('faq'),
        adminAPI.getContent('terms'),
        adminAPI.getContent('privacy'),
      ]);
      setFaqContent(faq.data || '');
      setTermsContent(terms.data || '');
      setPrivacyContent(privacy.data || '');
    } catch { /* silent */ }
  };

  const handleSaveSetting = async (setting) => {
    try {
      await adminAPI.updateSettings({ settings: [{ key: setting.key, value: editValues[setting._id], description: setting.description, category: setting.category }] });
      toast.success(`${setting.key} updated`);
    } catch { toast.error('Failed to update'); }
  };

  const handleSaveCloudinary = async () => {
    setSavingCloudinary(true);
    try {
      await adminAPI.updateCloudinarySettings(cloudinary);
      toast.success('Cloudinary settings saved!');
      fetchCloudinary();
    } catch { toast.error('Failed to save Cloudinary settings'); }
    finally { setSavingCloudinary(false); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return toast.error('Select a photo file');
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('profilePhoto', photoFile);
    try {
      const { data } = await adminAPI.uploadProfilePhoto(formData);
      setAdminPhoto(toAbsoluteMediaUrl(data.url));
      setPhotoFile(null);
      await fetchUser();
      toast.success('Photo uploaded!');
    } catch (err) { const msg = err?.response?.data?.message || err?.message || 'Failed to upload photo'; toast.error(msg); }
    finally { setUploadingPhoto(false); }
  };

  const handleSaveContent = async (type, value) => {
    setSavingContent(type);
    try {
      await adminAPI.updateContent(type, value);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved!`);
    } catch { toast.error('Failed to save content'); }
    finally { setSavingContent(''); }
  };

  const getSettingIcon = (key) => {
    const k = key?.toLowerCase() || '';
    if (k.includes('rotation')) return '🔄';
    if (k.includes('free') || k.includes('limit')) return '⚡';
    if (k.includes('profile')) return '👤';
    if (k.includes('whatsapp')) return '💬';
    if (k.includes('plan') || k.includes('price')) return '💲';
    return '⚙️';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <HiCog className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500">Configure your ServiceHub platform</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── General Settings ── */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {settings.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <HiCog className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No platform settings configured yet.</p>
            </div>
          ) : (
            settings.map((setting) => (
              <div key={setting._id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getSettingIcon(setting.key)}</span>
                      <h3 className="font-semibold text-gray-900 text-sm">{setting.key}</h3>
                      {setting.category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{setting.category}</span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-gray-400 mt-1 ml-7">{setting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {typeof setting.value === 'boolean' ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={editValues[setting._id] || false}
                          onChange={(e) => setEditValues(v => ({ ...v, [setting._id]: e.target.checked }))}
                          className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    ) : (
                      <input
                        type={typeof setting.value === 'number' ? 'number' : 'text'}
                        value={editValues[setting._id] ?? ''}
                        onChange={(e) => {
                          const val = typeof setting.value === 'number' ? Number(e.target.value) : e.target.value;
                          setEditValues(v => ({ ...v, [setting._id]: val }));
                        }}
                        className="w-36 sm:w-44 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    )}
                    <button onClick={() => handleSaveSetting(setting)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium shrink-0">
                      <HiSave className="w-4 h-4" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Cloudinary Settings ── */}
      {activeTab === 'cloudinary' && (
        <div className="space-y-6">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <HiCloud className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-0.5">Cloudinary — Media Storage</p>
              <p>All user profile photos, provider avatars, and documents are stored on Cloudinary. Get your credentials from{' '}
                <a href="https://cloudinary.com/console" target="_blank" rel="noopener noreferrer" className="underline font-medium">cloudinary.com/console</a>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <HiCloud className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold text-gray-900">Cloudinary Configuration</h2>
            </div>

            {cloudinaryLoading ? (
              <div className="p-12 flex justify-center"><LoadingSpinner /></div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Cloud Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cloud Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cloudinary.cloudinary_cloud_name}
                    onChange={e => setCloudinary(c => ({ ...c, cloudinary_cloud_name: e.target.value }))}
                    placeholder="e.g. my-app-cloud"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Found on your Cloudinary Dashboard home page</p>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cloudinary.cloudinary_api_key}
                    onChange={e => setCloudinary(c => ({ ...c, cloudinary_api_key: e.target.value }))}
                    placeholder="e.g. 123456789012345"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Dashboard → Settings → API Keys</p>
                </div>

                {/* API Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    API Secret <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={cloudinary.cloudinary_api_secret}
                      onChange={e => setCloudinary(c => ({ ...c, cloudinary_api_secret: e.target.value }))}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                    />
                    <button type="button" onClick={() => setShowSecret(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showSecret ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Keep this secret — never share it publicly</p>
                </div>

                {/* How it works */}
                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700 text-sm mb-2">How uploads work</p>
                  <p>① Admin saves credentials here → stored securely in the database</p>
                  <p>② Backend reads them at runtime to authenticate with Cloudinary</p>
                  <p>③ Users upload photos/documents → backend streams to Cloudinary → returns a URL</p>
                  <p>④ URLs are saved to user profiles and displayed across the platform</p>
                </div>

                <button onClick={handleSaveCloudinary} disabled={savingCloudinary}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50">
                  <HiSave className="w-5 h-5" />
                  {savingCloudinary ? 'Saving...' : 'Save Cloudinary Settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Admin Profile ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <HiPhotograph className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-gray-900">Admin Profile Photo</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar preview */}
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {photoPreview || adminPhoto ? (
                    <img src={photoPreview || adminPhoto} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    <HiPhotograph className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                {photoPreview && (
                  <p className="text-xs text-amber-600 mt-2 text-center">Preview — not uploaded yet</p>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Select a new photo</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                  <p className="text-xs text-gray-400 mt-1">Recommended: square image, at least 200×200 px. JPG or PNG.</p>
                </div>
                <button onClick={handlePhotoUpload} disabled={!photoFile || uploadingPhoto}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {uploadingPhoto ? <LoadingSpinner size="sm" /> : <HiSave className="w-4 h-4" />}
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {adminPhoto && !photoPreview && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <HiCheckCircle className="w-4 h-4" />
                    <span>Photo is set</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {[
            { key: 'faq', label: 'FAQ Content', value: faqContent, set: setFaqContent, hint: 'Markdown supported. Shown on the public /faq page.' },
            { key: 'terms', label: 'Terms & Conditions', value: termsContent, set: setTermsContent, hint: 'Shown on the public /terms page.' },
            { key: 'privacy', label: 'Privacy Policy', value: privacyContent, set: setPrivacyContent, hint: 'Shown on the public /privacy page.' },
          ].map(({ key, label, value, set, hint }) => (
            <div key={key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5 text-gray-400" />
                  <h2 className="text-base font-bold text-gray-900">{label}</h2>
                </div>
                <button
                  onClick={() => handleSaveContent(key, value)}
                  disabled={savingContent === key}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                >
                  <HiSave className="w-4 h-4" />
                  {savingContent === key ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="p-5">
                <textarea
                  value={value}
                  onChange={e => set(e.target.value)}
                  rows={10}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono resize-y"
                />
                <p className="text-xs text-gray-400 mt-1.5">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rotation Pools ── */}
      {activeTab === 'rotation' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiChip className="w-5 h-5 text-purple-500" />
              <h2 className="text-base font-bold text-gray-900">Active Rotation Pools</h2>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{rotation.length} pools</span>
            </div>
            <button onClick={fetchRotation}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium">
              <HiRefresh className="w-4 h-4" /> Refresh
            </button>
          </div>

          {rotationLoading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : rotation.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <HiChip className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No active rotation pools yet.</p>
              <p className="text-xs mt-1">Pools are created automatically when providers boost their profiles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Skill</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">City</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Pool Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Index</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Max</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rotation.map((pool, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-medium text-gray-900">{pool.skill}</td>
                      <td className="py-3 px-4 text-gray-600">{pool.city}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                          {pool.providers?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{pool.currentIndex || 0}</td>
                      <td className="py-3 px-4 text-gray-600">{pool.maxPoolSize || 5}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(pool.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
