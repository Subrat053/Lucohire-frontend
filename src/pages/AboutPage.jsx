import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import Seo from '../components/common/Seo';

const AboutPage = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getContent('about')
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
        title={t('static.aboutTitle', 'About Us | Lucohire')}
        description={t('static.aboutDescription', 'Learn about Lucohire - The AI-Powered Career Platform.')}
        canonicalPath="/about"
      />

      {/* Header Banner with Soft Gradient & Illustration */}
      <div className="bg-gradient-to-r from-teal-900/5 via-teal-500/10 to-indigo-600/10 border-b border-teal-100/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full tracking-wide">
              {t('about.badge', 'AI Career Ecosystem')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              {t('static.aboutTitle', 'About')} <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">Lucohire</span>
            </h1>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              {t('about.subtitle', 'Connecting job seekers, employers, and recruiters through transparent AI technology.')}
            </p>
          </div>

          <div className="w-48 sm:w-56 md:w-64 shrink-0 drop-shadow-md hover:scale-105 transition-transform duration-300">
            <img 
              src="/about_us.png" 
              alt="About Lucohire Illustration" 
              className="w-full h-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600" />
          <div className="p-8 sm:p-12">
            {content ? (
              <div 
                className="prose prose-slate max-w-none text-sm text-gray-700 leading-relaxed font-medium" 
                dangerouslySetInnerHTML={{ __html: parseDynamicContent(content) }} 
              />
            ) : (
              <div className="space-y-6 text-sm text-gray-700 font-medium leading-relaxed">
                <p>
                  Lucohire is an AI-powered employment platform designed to connect talented job seekers with verified employers and recruiters across various industries.
                </p>
                <p>
                  Our mission is to simplify job discovery, streamline application processes, and provide data-driven career tools including ATS resume scoring, smart matching, and automated alerts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
