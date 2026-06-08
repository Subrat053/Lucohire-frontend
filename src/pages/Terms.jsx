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
    adminAPI.getContent('terms').then(res => {
      setContent(res.data || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto px-2 lg:px-4 lg:py-4">
      <Seo
        title={t('static.termsTitle', 'Terms & Conditions')}
        description={t('static.termsDescription', 'Read the terms and conditions for using Lucohire.')}
        canonicalPath="/terms"
      />
      {/* <h1 className="text-3xl font-bold mb-6">{t('static.termsTitle')}</h1> */}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default TermsPage;
