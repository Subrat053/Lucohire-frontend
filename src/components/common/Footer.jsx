import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useTranslation from '../../hooks/useTranslation';
import { useState } from 'react';
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";

const Footer = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  if (user && user.role === 'admin') return null;

  const sections = [
    {
      title: t('footer.recruiters', 'Recruiters'),
      links: [
        { label: t('footer.postJob', 'Post a Job'), href: '/recruiter/job-postings' },
        { label: t('footer.findProviders', 'Find Providers'), href: '/search' },
        { label: t('footer.pricing', 'Pricing'), href: '/pricing?tab=recruiter' },
        { label: t('footer.support', 'Help Center'), href: '/contact' },
      ],
    },
    {
      title: t('footer.providers', 'Providers'),
      links: [
        { label: t('footer.registerProvider', 'Create Profile'), href: '/signup' },
        { label: t('footer.pricing', 'Pricing'), href: '/pricing?tab=provider' },
        { label: t('footer.faq', 'Faq'), href: '/faq' },
        { label: t('footer.renewal', 'Renewal'), href: '/renewal-policy' },
      ],
    },
    {
      title: t('footer.company', 'Company'),
      links: [
        { label: t('footer.about', 'About Us'), href: '/about' },
        { label: t('footer.privacy', 'Privacy Policy'), href: '/privacy' },
        { label: t('footer.terms', 'Terms & Conditions'), href: '/terms' },
        { label: t('footer.refund', 'Refund Policy'), href: '/refund-policy' },
        { label: t('footer.contact', 'Contact Us'), href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#E7ECF4] bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#081B3A] flex items-center justify-center">
              {/* <Plus className="w-5 h-5 text-white" /> */}
              <span className="text-white font-bold text-lg scale-125">L</span>

            </div>
            <div className="leading-none">
              <p className="font-extrabold text-[#081B3A] tracking-tight">Lucohire</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-[#6B7280] mt-0.5">AI HIRING</p>
            </div>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            {t('footer.description', 'India\'s AI-powered hiring platform. Verified providers, fair distribution, WhatsApp-first.')}
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#1677FF] mb-4">{section.title}</p>
            <ul className="space-y-2.5">
              {section.links.map((item) => {
                return (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-[#374151] hover:text-[#1677FF] cursor-pointer">
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

          </div>
        ))}


        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#1677FF] mb-4">
            {t('footer.support', 'Stay Updated')}
          </p>

          <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">
            {t('footer.newsletter', 'Product news & city launches — once a month.')}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmail("");
            }}
            className="flex gap-2 mb-5"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.emailPlaceholder', 'you@email.com')}
              className="flex-1 min-w-0 border border-[#E7ECF4] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1677FF]"
            />

            <button className="bg-[#081B3A] text-white text-xs font-bold px-4 rounded-lg hover:bg-[#0B254F] transition">
              {t('footer.go', 'Go')}
            </button>
          </form>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com/lucohire"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Lucohire on Facebook"
              className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#081B3A] hover:bg-[#1677FF] hover:text-white hover:border-[#1677FF] transition-all duration-300"
            >
              <FaFacebookF size={14} />
            </a>

            <a
              href="https://instagram.com/lucohire"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Lucohire on Instagram"
              className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#081B3A] hover:bg-[#1677FF] hover:text-white hover:border-[#1677FF] transition-all duration-300"
            >
              <FaInstagram size={14} />
            </a>

            <a
              href="https://linkedin.com/company/lucohire"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Lucohire on LinkedIn"
              className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#081B3A] hover:bg-[#1677FF] hover:text-white hover:border-[#1677FF] transition-all duration-300"
            >
              <FaLinkedinIn size={14} />
            </a>

            <a
              href="https://twitter.com/lucohire"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Lucohire on Twitter"
              className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#081B3A] hover:bg-[#1677FF] hover:text-white hover:border-[#1677FF] transition-all duration-300"
            >
              <FaTwitter size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E7ECF4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-wrap items-center justify-center gap-3 text-xs text-[#6B7280]">
          <span className='text-center font-bold'>{t('footer.copyrightSimple', '© 2026 Lucohire. All rights reserved.')}</span>
          {/* <span>Made with care in India 🇮🇳</span> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
