import { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, HelpCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import useTranslation from '../../hooks/useTranslation';

const defaultLandingFaqs = [
  {
    id: '1',
    question: 'How does Lucohire AI candidate matching work?',
    answer: 'Our AI algorithm parses candidate profiles, skills, and experience to automatically compute ATS compatibility scores and match them against active job postings in real time.'
  },
  {
    id: '2',
    question: 'Is Lucohire free for job candidates?',
    answer: 'Yes! Job candidates can create profiles, generate resumes, get ATS score checks, and apply to job opportunities completely free of charge.'
  },
  {
    id: '3',
    question: 'How do recruiters post jobs and find talent?',
    answer: 'Recruiters can register, purchase credits or subscriptions, post targeted job openings, and instantly browse AI-scored candidate matches.'
  },
  {
    id: '4',
    question: 'What makes Lucohire different from traditional job boards?',
    answer: 'Unlike static job boards, Lucohire features automated AI matching, verified provider pools, WhatsApp-first alerts, and real-time candidate unlock pipelines.'
  }
];

const LandingFaqSection = () => {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState(defaultLandingFaqs);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    adminAPI.getContent('faq')
      .then(res => {
        const raw = res.data || '';
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFaqs(parsed);
            }
          } catch {
            // keep fallback
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full bg-white pb-12 sm:pb-16 pt-4">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand/Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8 mt-0">
          <img src="/logo.jpg" alt="Lucohire Logo" className="w-32 h-32 sm:w-48 sm:h-48 object-contain shadow-sm rounded-3xl p-3 bg-white border border-gray-100 mb-3" />
          <div className="flex flex-col text-center justify-center">
            <h2 className="font-semibold text-gray-800 text-4xl sm:text-5xl tracking-tight mb-1">
              Lucohire
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-medium text-gray-500 max-w-md mx-auto">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold">AI-Powered</span> Global Jobs & Hiring Platform
            </p>
          </div>
        </div>

        {/* Upper FAQ Header (Borderless & Clean) */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {t('landingFaq.badge', 'FAQ')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("landingFaq.titlePrefix", "Frequently Asked")} <span className="text-blue-600">{t("landingFaq.titleSuffix", "Questions")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl mx-auto">
            {t("landingFaq.subtitle", "Find answers to common questions about Lucohire AI matching and recruiter tools.")}
          </p>
        </div>

        {/* Vertically Stacked Question Cards (Squeezed Bar & Full Width Text) */}
        <div className="w-full space-y-2">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={item.id || idx} 
                className={`group rounded-xl transition-all duration-200 overflow-hidden w-full ${
                  isOpen 
                    ? 'bg-blue-50/60 shadow-xs' 
                    : 'bg-gray-50/80 hover:bg-gray-100/70'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 sm:p-4 px-5 sm:px-6 flex items-center justify-between gap-4 font-bold text-gray-900 text-sm sm:text-base hover:text-blue-600 transition"
                >
                  <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isOpen 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-white text-blue-600 shadow-xs border border-blue-100'
                  }`}>
                    <HelpCircle className="w-4.5 h-4.5" />
                  </div>

                  <span className="flex-1 text-center font-bold text-gray-900 text-sm sm:text-base">{item.question}</span>

                  <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isOpen 
                      ? 'bg-blue-600 text-white rotate-180 shadow-xs' 
                      : 'bg-white text-gray-500 shadow-xs border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                  }`}>
                    <ChevronDown className="w-4 h-4 transition-transform" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-4.5 pt-0 text-xs sm:text-sm text-gray-600 font-normal leading-relaxed text-center">
                    <p className="pt-3 border-t border-blue-100/50 max-w-4xl mx-auto">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LandingFaqSection;
