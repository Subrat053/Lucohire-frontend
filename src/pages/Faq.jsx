import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useTranslation from '../hooks/useTranslation';
import Seo from '../components/common/Seo';
import { Search, ChevronDown, HelpCircle } from 'lucide-react';

const FaqPage = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    adminAPI.getContent('faq')
      .then(res => {
        const raw = res.data || '';
        setContent(raw);
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setFaqItems(parsed);
          }
        } catch {
          // If raw HTML legacy fallback
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredFaqs = faqItems.filter(item => {
    return !searchTerm || 
      (item.question && item.question.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (item.answer && item.answer.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const toggleAccordion = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      <Seo
        title={t('static.faqTitle', 'Frequently Asked Questions | Lucohire')}
        description={t('static.faqDescription', 'Find answers to common questions about Lucohire candidate tools, recruiter features, and subscriptions.')}
        canonicalPath="/faq"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900/5 via-teal-500/10 to-indigo-600/10 border-b border-teal-100/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
            <HelpCircle className="w-3.5 h-3.5" /> FAQ & Knowledge Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
            How Can We <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">Help You?</span>
          </h1>
          <p className="text-sm text-gray-600 font-medium max-w-xl mx-auto">
            Find instant answers to popular questions regarding candidate matching, ATS scoring, and recruiter job posts.
          </p>

          {/* Search Input */}
          {faqItems.length > 0 && (
            <div className="relative max-w-md mx-auto pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 mt-1" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions or keywords..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10">
        {/* FAQ Accordion or Raw Content */}
        {faqItems.length > 0 ? (
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item, idx) => {
                const isOpen = expandedIndex === idx;
                return (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition">
                    <button
                      onClick={() => toggleAccordion(idx)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-gray-900 hover:text-teal-700 transition"
                    >
                      <span className="text-sm sm:text-base">{item.question}</span>
                      <ChevronDown className={`w-5 h-5 text-teal-600 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-0 text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-50 mt-1">
                        <p className="pt-3">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No matching questions found for "{searchTerm}".
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sm:p-12">
            <div className="prose max-w-none text-sm text-gray-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FaqPage;
