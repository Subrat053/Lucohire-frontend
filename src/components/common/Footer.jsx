import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useTranslation from '../../hooks/useTranslation';
import { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { Lock, ShieldCheck, FileCheck } from "lucide-react";
import { ADMIN_API } from '../../services/api';

const Footer = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [socials, setSocials] = useState({
    facebook: 'https://facebook.com/lucohire',
    twitter: 'https://twitter.com/lucohire',
    linkedin: 'https://linkedin.com/company/lucohire',
    instagram: 'https://instagram.com/lucohire'
  });

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const res = await ADMIN_API.get('/admin/content/socials');
        if (res.data) {
          setSocials(res.data);
        }
      } catch (err) {
        console.error('Failed to load socials:', err);
      }
    };
    fetchSocials();
  }, []);

  if (user && user.role === 'admin') return null;

  const sections = [
    {
      title: t('footer.candidates', 'For Candidates'),
      links: [
        { label: t('footer.findJobs', 'Find Jobs'), href: '/candidate-landing' },
        { label: t('footer.createProfile', 'Create Profile'), href: '/signup?role=candidate' },
        { label: t('footer.careerTips', 'Career Tips'), href: '#' },
        { label: t('footer.helpCenter', 'Help Center'), href: '/contact' },
      ],
    },
    {
      title: t('footer.recruiters', 'For Recruiters'),
      links: [
        { label: t('footer.postJob', 'Post a Job'), href: '/recruiter/job-postings' },
        { label: t('footer.findCandidates', 'Find Candidates'), href: '/search' },
        { label: t('footer.pricing', 'Pricing'), href: '/pricing?tab=recruiter' },
        { label: t('footer.resources', 'Resources'), href: '#' },
      ],
    },
    {
      title: t('footer.company', 'Company'),
      links: [
        { label: t('footer.about', 'About Us'), href: '/about' },
        { label: t('footer.privacy', 'Privacy Policy'), href: '/privacy' },
        { label: t('footer.terms', 'Terms & Conditions'), href: '/terms' },
        { label: t('footer.contact', 'Contact Us'), href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="bg-[#081B3A] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <span className="text-[#081B3A] font-bold text-lg scale-125">L</span>
            </div>
            <div className="leading-none">
              <p className="font-extrabold text-white tracking-tight">Lucohire</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-gray-400 mt-0.5">AI HIRING</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {t('footer.description', 'India\'s AI-powered hiring platform. Verified providers, fair distribution, WhatsApp-first.')}
          </p>
          
          {/* Social Icons */}
          <div className="flex items-center gap-4 mt-6">
            {socials?.facebook && <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><FaFacebookF size={18} /></a>}
            {socials?.twitter && <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><FaTwitter size={18} /></a>}
            {socials?.linkedin && <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><FaLinkedinIn size={18} /></a>}
            {socials?.instagram && <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><FaInstagram size={18} /></a>}
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-white mb-6">{section.title}</h4>
            <ul className="space-y-4">
              {section.links.map((item) => {
                return (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}


        <div>
          <h4 className="font-semibold text-white mb-6">
            {t('footer.support', 'Stay Updated')}
          </h4>

          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            {t('footer.newsletter', 'Product news & city launches — once a month.')}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmail("");
            }}
            className="flex items-center bg-[#102A54] rounded-lg p-1 mb-5"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.emailPlaceholder', 'you@email.com')}
              className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:ring-0"
              required
            />

            <button className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[#1C3A66]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>{t('footer.copyrightSimple', '© 2025 Lucohire. All rights reserved.')}</span>
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
