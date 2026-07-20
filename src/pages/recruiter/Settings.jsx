import useTranslation from "../../hooks/useTranslation";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiCreditCard, FiFileText, FiLink, 
  FiBell, FiShield, FiHelpCircle, FiCamera, FiCheck, FiArrowRight,
  FiExternalLink, FiUploadCloud, FiMail, FiPhone, FiChevronDown,
  FiChevronRight, FiMapPin, FiMoreVertical, FiPlus, FiClock, FiLock
} from 'react-icons/fi';
import { HiSparkles, HiOfficeBuilding } from 'react-icons/hi';
import LocationAutocomplete from '../../components/common/LocationAutocomplete';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

export default function Settings() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [stats, setStats] = useState({});
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Information Technology',
    companySize: '201 - 500 employees',
    companyWebsite: '',
    headquarters: '',
    foundedYear: '',
    email: '',
    phone: '',
    description: '',
    careerPageSettings: {
      url: '',
      primaryColor: '#4F46E5',
      secondaryColor: '#111827',
      showCompanyLogo: true,
      showCultureSection: true,
      allowResumeDownload: true,
      anonymousApplications: false
    }
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/recruiter/dashboard');
      const p = res.data.profile;
      setProfileData(p);
      setStats(res.data.stats || {});
      setFormData({
        companyName: p.companyName || '',
        industry: p.industry || 'Information Technology',
        companySize: p.companySize || '201 - 500 employees',
        companyWebsite: p.companyWebsite || '',
        headquarters: p.city ? `${p.city}${p.state ? `, ${p.state}` : ''}` : '',
        foundedYear: p.foundedYear || '',
        email: p.email || '',
        phone: p.phone || '',
        description: p.description || '',
        careerPageSettings: p.careerPageSettings || {
          url: '',
          primaryColor: '#4F46E5',
          secondaryColor: '#111827',
          showCompanyLogo: true,
          showCultureSection: true,
          allowResumeDownload: true,
          anonymousApplications: false
        }
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCareerSettingChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      careerPageSettings: {
        ...prev.careerPageSettings,
        [name]: value
      }
    }));
  };

  const handleToggle = (name) => {
    setFormData(prev => ({
      ...prev,
      careerPageSettings: {
        ...prev.careerPageSettings,
        [name]: !prev.careerPageSettings[name]
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parts = formData.headquarters.split(',').map(s => s.trim());
      const city = parts[0] || '';
      const state = parts[1] || '';

      await API.put('/recruiter/profile', {
        companyName: formData.companyName,
        industry: formData.industry,
        companySize: formData.companySize,
        companyWebsite: formData.companyWebsite,
        city,
        state,
        foundedYear: formData.foundedYear,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
        careerPageSettings: formData.careerPageSettings
      });
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success("Password changed successfully");
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formDataObj = new FormData();
    formDataObj.append('profilePhoto', file);
    
    try {
      toast.loading('Uploading logo...', { id: 'upload' });
      await API.post('/recruiter/profile/photo', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Logo uploaded', { id: 'upload' });
      fetchProfile(); 
    } catch (err) {
      console.error(err);
      toast.error('Upload failed', { id: 'upload' });
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("Settings & Billing")}</h1>
              <p className="text-sm font-medium text-gray-500">{t("Manage your account, team, subscriptions and preferences.")}</p>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-70"
            >
              <FiCheck className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {/* Top Tabs */}
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'company-profile', label: 'Company Profile', icon: <HiOfficeBuilding />, active: true },
            ].map((tab) => (
              <button 
                key={tab.id}
                className={`flex items-center gap-2 pb-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                  tab.active 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-900'
                }`}
              >
                {React.cloneElement(tab.icon, { className: 'w-4 h-4' })}
                {t(tab.label)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Column (Forms) */}
            <div className="flex-1 min-w-0 space-y-6">
            
            {/* Company Profile Card */}
            <SCard className="p-6">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t("Company Profile")}</h2>
                <p className="text-[13px] text-gray-500 font-medium">{t("Update your company details and career page settings.")}</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Logo Upload */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center mb-3 relative group overflow-hidden">
                    {profileData?.profilePhotoApproval?.status === 'pending' && profileData?.profilePhotoApproval?.pendingUrl ? (
                      <>
                        <img src={profileData.profilePhotoApproval.pendingUrl} alt="Company Logo" className="w-full h-full object-cover opacity-70" />
                        <div className="absolute top-0 w-full bg-yellow-500 text-white text-[9px] font-bold py-1 text-center">{t("Pending Approval")}</div>
                      </>
                    ) : profileData?.profilePhoto ? (
                      <img src={profileData.profilePhoto} alt="Company Logo" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/lucohire-logo.png" alt="Company Logo" className="w-16 h-16 opacity-50" />
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition z-10"
                    >
                      <FiCamera className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{t("Update Logo")}</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition w-full">{t("Change Logo")}</button>
                </div>
                
                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Company Name")}</label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Industry")}</label>
                    <div className="relative">
                      <select name="industry" value={formData.industry} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-indigo-500 shadow-sm">
                        <option>{t("Information Technology")}</option>
                        <option>{t("Healthcare")}</option>
                        <option>{t("Finance")}</option>
                        <option>{t("Manufacturing")}</option>
                        <option>{t("Retail")}</option>
                        <option>{t("Other")}</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Company Size")}</label>
                    <div className="relative">
                      <select name="companySize" value={formData.companySize} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-indigo-500 shadow-sm">
                        <option>{t("1 - 10 employees")}</option>
                        <option>{t("11 - 50 employees")}</option>
                        <option>{t("51 - 200 employees")}</option>
                        <option>{t("201 - 500 employees")}</option>
                        <option>{t("501 - 1000 employees")}</option>
                        <option>{t("1000+ employees")}</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Website")}</label>
                    <input type="text" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="relative z-10">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Headquarters")}</label>
                    <LocationAutocomplete
                      value={formData.headquarters}
                      onChange={(val) => setFormData(prev => ({ ...prev, headquarters: val }))}
                      onSelect={(loc) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          headquarters: `${loc.city || ''}${loc.city && loc.state ? ', ' : ''}${loc.state || ''}`
                        }));
                      }}
                      placeholder={t("e.g. Bangalore, Karnataka")}
                      inputClassName="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Founded Year")}</label>
                    <input type="text" name="foundedYear" value={formData.foundedYear} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Company Email")}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Phone Number")}</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Company Description")}</label>
                    <textarea rows="3" name="description" value={formData.description} onChange={handleChange} className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-sm custom-scrollbar"></textarea>
                    <div className="flex justify-end mt-1 text-[10px] font-bold text-gray-400">{formData.description.length}/500</div>
                  </div>
                </div>
              </div>


            </SCard>

            {/* Career Page Settings Card */}
            <SCard className="p-6">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t("Career Page Settings")}</h2>
                <p className="text-[13px] text-gray-500 font-medium">{t("Customize your public career page and job application experience.")}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Inputs & Colors */}
                <div className="lg:col-span-1 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Career Page URL")}</label>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                      <input type="text" name="url" value={formData.careerPageSettings.url} onChange={handleCareerSettingChange} placeholder={t("e.g. https://lucohire.com/careers/yourcompany")} className="w-full text-xs font-medium text-indigo-600 bg-transparent border-none focus:outline-none min-w-0" />
                      <button className="text-gray-400 hover:text-indigo-600 ml-2 shrink-0"><FiExternalLink className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Primary Color")}</label>
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-1">
                        <input type="color" name="primaryColor" value={formData.careerPageSettings.primaryColor} onChange={handleCareerSettingChange} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0" />
                        <input type="text" name="primaryColor" value={formData.careerPageSettings.primaryColor} onChange={handleCareerSettingChange} className="w-full text-[11px] font-bold text-gray-700 bg-transparent border-none focus:outline-none uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Secondary Color")}</label>
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-1">
                        <input type="color" name="secondaryColor" value={formData.careerPageSettings.secondaryColor} onChange={handleCareerSettingChange} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0" />
                        <input type="text" name="secondaryColor" value={formData.careerPageSettings.secondaryColor} onChange={handleCareerSettingChange} className="w-full text-[11px] font-bold text-gray-700 bg-transparent border-none focus:outline-none uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="lg:col-span-1 space-y-4 pt-1">
                  {[
                    { title: 'Show company logo on job posts', sub: 'Display your company logo on all job listings', name: 'showCompanyLogo' },
                    { title: 'Show company culture section', sub: 'Highlight your culture on career page', name: 'showCultureSection' },
                    { title: 'Allow resume download', sub: 'Allow recruiters to download resumes', name: 'allowResumeDownload' },
                    { title: 'Anonymous applications', sub: 'Hide candidate identity until screening', name: 'anonymousApplications' },
                  ].map((toggle, i) => {
                    const isOn = formData.careerPageSettings[toggle.name];
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="pr-4">
                          <h4 className="text-[11px] font-bold text-gray-900">{toggle.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{toggle.sub}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleToggle(toggle.name)}
                          className={`w-8 h-4 rounded-full relative shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${isOn ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isOn ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </button>
                      </div>
                    );
                  })}
                </div>

              </div>
            </SCard>

            {/* Change Password Card */}
            <SCard className="p-6">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t("Security Settings")}</h2>
                <p className="text-[13px] text-gray-500 font-medium">{t("Update your password to keep your account secure.")}</p>
              </div>

              <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("New Password")}</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="password" 
                      value={passwordData.newPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                      placeholder={t("Enter new password")}
                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("Confirm Password")}</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="password" 
                      value={passwordData.confirmPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                      placeholder={t("Confirm new password")}
                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" 
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button 
                    type="submit"
                    disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </SCard>
          </div>

          {/* Right Sidebar (Subscription & Links) */}
          <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 space-y-6">
            
            {/* Your Subscription */}
            <SCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">{t("Your Subscription")}</h2>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <HiSparkles className="w-3 h-3" /> {stats?.subscriptionPlan || 'Free Plan'}
                </span>
              </div>
              <div className="mb-4">
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-2xl font-black text-gray-900">
                    {stats?.planPrice ? `$${stats.planPrice}` : '$0'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium mb-1">/ month</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-gray-500 font-medium">
                    {stats?.planEndDate ? `Renews on ${new Date(stats.planEndDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}` : 'No expiration'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${stats?.planStatus === 'active' || !stats?.planStatus ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                    {stats?.planStatus ? stats.planStatus.charAt(0).toUpperCase() + stats.planStatus.slice(1) : 'Active'}
                  </span>
                </div>
              </div>
              <button onClick={() => navigate('/recruiter/plans-billing')} className="w-full bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg text-xs font-bold transition">{t("Manage Subscription")}</button>
            </SCard>

            {/* Credits & Usage */}
            <SCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-gray-900">{t("Credits & Usage")}</h2>
              </div>
              
              <div className="space-y-5">
                {[
                  { label: 'Featured Job Credits', current: stats?.featuredJobsUsed || 0, max: stats?.featuredJobsLimit || 20, color: 'bg-indigo-600', icon: <FiFileText />, iconColor: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Urgent Hiring Credits', current: stats?.urgentHiringUsed || 0, max: stats?.urgentHiringLimit || 10, color: 'bg-orange-500', icon: <HiOfficeBuilding />, iconColor: 'text-orange-500 bg-orange-50' },
                  { label: 'Resume Unlock Credits', current: stats?.totalUnlocks || 0, max: (stats?.totalUnlocks || 0) + (stats?.unlocksRemaining || 500), color: 'bg-emerald-500', icon: <FiUsers />, iconColor: 'text-emerald-500 bg-emerald-50' },
                  { label: 'Outreach Credits', current: stats?.outreachUsed || 0, max: stats?.outreachLimit || 2000, color: 'bg-blue-500', icon: <FiUploadCloud />, iconColor: 'text-blue-500 bg-blue-50' },
                ].map((credit, i) => {
                  const max = credit.max === '∞' ? 100 : (credit.max || 1);
                  const current = credit.max === '∞' ? 0 : credit.current;
                  const percentage = credit.max === '∞' ? 0 : Math.min(100, (current / max) * 100);
                  return (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${credit.iconColor}`}>
                          {React.cloneElement(credit.icon, { className: 'w-3 h-3' })}
                        </div>
                        <span className="text-gray-700">{credit.label}</span>
                      </div>
                      <div className="text-gray-500">
                        <span className="text-gray-900">{credit.current}</span> / {credit.max}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1">
                      <div className={`h-1 rounded-full ${credit.color}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )})}
                
                {/* AI Copilot Usage (Unlimited) */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-purple-600 bg-purple-50">
                        <HiSparkles className="w-3 h-3" />
                      </div>
                      <span className="text-gray-700">{t("AI Copilot Usage")}</span>
                    </div>
                    <span className="text-gray-900">{t("Unlimited")}</span>
                  </div>
                </div>
              </div>
            </SCard>

            {/* Quick Links */}
            <SCard className="p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">{t("Quick Links")}</h2>
              <div className="space-y-1">
                {[
                  { label: 'Download Invoice', icon: <FiFileText /> },
                  { label: 'Payment Methods', icon: <FiCreditCard /> },
                  { label: 'Billing History', icon: <FiClock />, action: () => navigate('/recruiter/plans-billing') },
                  { label: 'GST Details', icon: <FiShield /> },
                  { label: 'Apply Coupon Code', icon: <FiCheck /> },
                ].map((link, i) => (
                  <button key={i} onClick={link.action} className="w-full flex items-center justify-between py-2.5 text-[13px] font-bold text-gray-600 hover:text-indigo-600 group">
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-400 group-hover:text-indigo-600">{link.icon}</span>
                      {link.label}
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            </SCard>

            {/* Need Help? */}
            <SCard className="p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-1">{t("Need Help?")}</h2>
              <p className="text-[11px] font-medium text-gray-500 mb-4">{t("Our support team is here to help you.")}</p>
              
              <button className="w-full flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg text-[13px] font-bold transition mb-4">
                <FiHelpCircle className="w-3.5 h-3.5" />{t("Contact Support")}
              </button>
              
              <div className="space-y-1">
                {[
                  { label: 'Book a Demo', icon: <FiCamera /> },
                  { label: 'Visit Help Center', icon: <FiExternalLink /> },
                ].map((link, i) => (
                  <button key={i} className="w-full flex items-center justify-between py-2.5 text-[13px] font-bold text-gray-600 hover:text-indigo-600 group">
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-400 group-hover:text-indigo-600">{link.icon}</span>
                      {link.label}
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            </SCard>

          </div>
          
          </div>
      </div>
    </div>
  );
}