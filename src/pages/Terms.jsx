import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import Seo from '../components/common/Seo';

const TermsPage = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getContent('terms')
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
        title={t('static.termsTitle', 'Terms & Conditions | Lucohire')}
        description={t('static.termsDescription', 'Read the terms and conditions for using Lucohire.')}
        canonicalPath="/terms"
      />

      {/* Header Banner with Soft Gradient & Illustration */}
      <div className="bg-gradient-to-r from-emerald-900/5 via-emerald-500/10 to-teal-600/10 border-b border-emerald-100/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full tracking-wide">
              {t('terms.badge', 'Platform User Agreement')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">{t('static.termsTitle', 'Terms & Conditions')}</span>
            </h1>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              {t('terms.subtitle', 'Rules and guidelines for candidate applications, employer postings, and AI matching services.')}
            </p>
            <p className="text-xs text-emerald-700 font-bold">
              {t('terms.effectiveDate', 'Effective date: July 2026')}
            </p>
          </div>

          <div className="w-48 sm:w-56 md:w-64 shrink-0 drop-shadow-md hover:scale-105 transition-transform duration-300">
            <img 
              src="/terms_conditions.png" 
              alt="Terms & Conditions Agreement Illustration" 
              className="w-full h-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          <div className="p-8 sm:p-12">
            {content ? (
              <div 
                className="prose prose-slate max-w-none text-sm text-gray-700 leading-relaxed font-medium" 
                dangerouslySetInnerHTML={{ __html: parseDynamicContent(content) }} 
              />
            ) : (
              <div className="space-y-6 text-sm text-gray-700 font-medium leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">1. Acceptance of Terms</h2>
                  <p className="text-gray-600">By using Lucohire, you agree to these Terms and Conditions. If you do not agree, please do not use our services.</p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">2. User Conduct</h2>
                  <p className="text-gray-600">Users must provide accurate profile details and refrain from posting misleading job or candidate information.</p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">3. Platform Services</h2>
                  <p className="text-gray-600">Lucohire reserves the right to update or modify features, terms, and services as needed.</p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
