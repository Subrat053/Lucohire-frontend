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
    adminAPI.getContent('about').then(res => {
      setContent(res.data || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Seo
        title={t('static.aboutTitle', 'About us')}
        description={t('static.aboutDescription', 'About Us')}
        canonicalPath="/about"
      />
      <h1 className="text-3xl font-bold mb-6">{t('static.aboutTitle', 'About Us')}</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default AboutPage;
