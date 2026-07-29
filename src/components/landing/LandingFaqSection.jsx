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
    <div className="w-full bg-slate-50 py-16 sm:py-24 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-50"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Upper FAQ Header */}
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {t('landingFaq.badge', 'FAQ')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {t("landingFaq.titlePrefix", "Frequently Asked")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t("landingFaq.titleSuffix", "Questions")}</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium max-w-2xl mx-auto">
            {t("landingFaq.subtitle", "Find answers to common questions about Lucohire AI matching and recruiter tools.")}
          </p>
        </div>

        {/* Vertically Stacked Question Cards */}
        <div className="w-full space-y-3 sm:space-y-4">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={item.id || idx} 
                className={`group rounded-2xl transition-all duration-300 overflow-hidden w-full border ${
                  isOpen 
                    ? 'bg-white shadow-xl shadow-blue-900/5 border-blue-200/60 scale-[1.01]' 
                    : 'bg-white/60 hover:bg-white border-transparent hover:border-gray-200/80 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-gray-900 text-base sm:text-lg hover:text-blue-700 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 rotate-12' 
                      : 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50 group-hover:scale-110'
                  }`}>
                    <HelpCircle className="w-5 h-5" />
                  </div>

                  <span className="flex-1 font-bold text-gray-900 leading-tight">{item.question}</span>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen 
                      ? 'bg-blue-100 text-blue-700 rotate-180' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}>
                    <ChevronDown className="w-4.5 h-4.5 transition-transform" />
                  </div>
                </button>

                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-19 text-sm sm:text-base text-gray-700 font-medium leading-relaxed">
                      <p className="pt-2 border-t border-gray-100/80">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingFaqSection;
