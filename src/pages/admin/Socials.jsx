import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiCheck, HiRefresh } from 'react-icons/hi';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';

const Socials = () => {
  const defaultLinks = {
    facebook: 'https://facebook.com/lucohire',
    twitter: 'https://twitter.com/lucohire',
    linkedin: 'https://linkedin.com/company/lucohire',
    instagram: 'https://instagram.com/lucohire',
  };

  const [links, setLinks] = useState(defaultLinks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSocials();
  }, []);

  const fetchSocials = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getContent('socials');
      if (res.data) {
        setLinks({
          facebook: res.data.facebook || defaultLinks.facebook,
          twitter: res.data.twitter || defaultLinks.twitter,
          linkedin: res.data.linkedin || defaultLinks.linkedin,
          instagram: res.data.instagram || defaultLinks.instagram,
        });
      }
    } catch (error) {
      toast.error('Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const formatUrl = (url) => {
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const linksToSave = {
        facebook: formatUrl(links.facebook) || defaultLinks.facebook,
        twitter: formatUrl(links.twitter) || defaultLinks.twitter,
        linkedin: formatUrl(links.linkedin) || defaultLinks.linkedin,
        instagram: formatUrl(links.instagram) || defaultLinks.instagram,
      };
      
      // Keep UI in sync with what was actually saved
      setLinks(linksToSave);
      
      await adminAPI.updateContent('socials', linksToSave);
      toast.success('Social links updated successfully!');
    } catch (error) {
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 flex items-center justify-center"><HiRefresh className="animate-spin w-5 h-5 mr-2" /> Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Links Management</h1>
          <p className="text-sm text-gray-500 mt-1">Update the social media links displayed in the website footer.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? <HiRefresh className="animate-spin" /> : <HiCheck />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {/* Facebook */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FaFacebookF /></div>
            Facebook URL
          </label>
          <input
            type="url"
            value={links.facebook || ''}
            onChange={(e) => setLinks({ ...links, facebook: e.target.value })}
            placeholder="https://facebook.com/lucohire"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Twitter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500"><FaTwitter /></div>
            Twitter (X) URL
          </label>
          <input
            type="url"
            value={links.twitter || ''}
            onChange={(e) => setLinks({ ...links, twitter: e.target.value })}
            placeholder="https://twitter.com/lucohire"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700"><FaLinkedinIn /></div>
            LinkedIn URL
          </label>
          <input
            type="url"
            value={links.linkedin || ''}
            onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
            placeholder="https://linkedin.com/company/lucohire"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Instagram */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600"><FaInstagram /></div>
            Instagram URL
          </label>
          <input
            type="url"
            value={links.instagram || ''}
            onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
            placeholder="https://instagram.com/lucohire"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
          />
        </div>

      </div>
    </div>
  );
};

export default Socials;
