import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import Seo from '../components/common/Seo';

const PrivacyPage = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getContent('privacy')
      .then(res => {
        setContent(res.data || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const parseDynamicContent = (rawContent) => {
    if (!rawContent || typeof rawContent !== 'string') return '';
    if (/<[a-z][\s\S]*>/i.test(rawContent)) return rawContent;
    let html = rawContent
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-gray-900 mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-gray-900 mt-8 mb-3 border-b border-gray-100 pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-gray-900 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-gray-600 my-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-gray-600 my-1">$1</li>');
    return html
      .split(/\n\s*\n/)
      .map(p => p.trim() ? `<p class="mb-4 leading-relaxed">${p}</p>` : '')
      .join('');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      <Seo
        title={t('static.privacyTitle', 'Privacy Policy | Lucohire')}
        description={t('static.privacyDescription', 'Learn how Lucohire handles data and privacy.')}
        canonicalPath="/privacy"
      />

      {/* Header Banner with Soft Gradient & Illustration */}
      <div className="bg-gradient-to-r from-indigo-900/5 via-indigo-500/10 to-blue-600/10 border-b border-indigo-100/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full tracking-wide">
              {t('privacy.badge', 'Data Protection & Encryption')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">{t('static.privacyTitle', 'Privacy Policy')}</span>
            </h1>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              {t('privacy.subtitle', 'Understanding how we store, protect, and handle your candidate & recruiter data.')}
            </p>
            <p className="text-xs text-indigo-600 font-bold">
              {t('privacy.lastUpdated', 'Last updated: July 2026')}
            </p>
          </div>

          <div className="w-48 sm:w-56 md:w-64 shrink-0 drop-shadow-md hover:scale-105 transition-transform duration-300">
            <img 
              src="/privacy_policy.png" 
              alt="Privacy Policy Shield Illustration" 
              className="w-full h-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600" />
          <div className="p-8 sm:p-12">
            {content ? (
              <div 
                className="prose prose-slate max-w-none text-sm text-gray-700 leading-relaxed font-medium" 
                dangerouslySetInnerHTML={{ __html: parseDynamicContent(content) }} 
              />
            ) : (
              <div className="space-y-6 text-sm text-gray-700 font-medium leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">1. Data We Collect</h2>
                  <p className="text-gray-600">We collect information provided when registering an account, uploading resumes, or applying for jobs.</p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">2. How We Use Information</h2>
                  <p className="text-gray-600">Your data is used to provide job matching, ATS resume scoring, and platform communications.</p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">3. Data Protection</h2>
                  <p className="text-gray-600">We implement industry-standard encryption and security measures to protect your personal details.</p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
