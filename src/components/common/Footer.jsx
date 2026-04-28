import { Link } from 'react-router-dom';
import { HiHeart } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import useTranslation from '../../hooks/useTranslation';
import { useState } from 'react';

const Footer = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (user && user.role === 'admin') return null;
  const [email, setEmail] = useState("");

  return (
    // <footer className="bg-white text-gray-300">
    //   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    //     <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
    //       {/* Brand */}
    //       <div className="col-span-1 md:col-span-2">
    //         <div className="flex items-center space-x-2 mb-4">
    //           <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
    //             <span className="text-white font-bold text-lg">L</span>
    //           </div>
    //           {/* <span className="text-xl font-bold text-white">ServiceHub</span> */}
    //           <div className="leading-none">
    //           <p className="font-extrabold text-[#081B3A] tracking-tight">Lucohire</p>
    //           <p className="text-[9px] font-semibold tracking-[0.2em] text-[#6B7280] mt-0.5">AI HIRING</p>
    //         </div>
    //         </div>
    //         <p className="text-sm text-gray-400 max-w-md">
    //           {t('footer.description')}
    //         </p>
    //       </div>

    //       {/* Quick Links */}
    //       <div>
    //         <h4 className="font-semibold text-white mb-3">{t('footer.quickLinks')}</h4>
    //         <div className="space-y-2 text-sm">
    //           <Link to="/search" className="block hover:text-indigo-400 transition">{t('footer.findProviders')}</Link>
    //           <Link to="/" className="block hover:text-indigo-400 transition">{t('footer.postJob')}</Link>
    //           <Link to="/" className="block hover:text-indigo-400 transition">{t('footer.registerProvider')}</Link>
    //           <Link to="/" className="block hover:text-indigo-400 transition">{t('footer.pricing')}</Link>
    //         </div>
    //       </div>

    //       {/* Support */}
    //       <div>
    //         <h4 className="font-semibold text-white mb-3">{t('footer.support')}</h4>
    //         <div className="space-y-2 text-sm">
    //           <Link to="/faq" className="block hover:text-indigo-400 transition">{t('footer.faq')}</Link>
    //           <Link to="/privacy" className="block hover:text-indigo-400 transition">{t('footer.privacy')}</Link>
    //           <Link to="/terms" className="block hover:text-indigo-400 transition">{t('footer.terms')}</Link>
    //           <a href="#" className="block hover:text-indigo-400 transition">{t('footer.contact')}</a>
    //         </div>
    //       </div>
    //     </div>

    //     <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
    //       <p className="text-sm text-gray-500">
    //         {t('footer.copyright', { year: new Date().getFullYear() })}
    //       </p>
    //       <p className="text-sm text-gray-500 flex items-center mt-2 md:mt-0">
    //         {t('footer.madeWith')} <HiHeart className="text-red-500 mx-1" /> {t('footer.inIndia')}
    //       </p>
    //     </div>
    //   </div>
    // </footer>
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
              India's AI-powered hiring platform. Verified providers, fair distribution, WhatsApp-first.
            </p>
          </div>

          {[
            { title: "Recruiters", links: ["Post a Job", "Find Providers", "Bulk Hire", "Pricing", "Help Center"] },
            { title: "Providers", links: ["Create Profile", "Get Leads", "Pro Boost", "Success Stories", "Renewal"] },
            { title: "Company", links: ["About", "Careers", "Privacy", "Terms"] },
          ].map((c) => (
            <div key={c.title}>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#1677FF] mb-4">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><a className="text-sm text-[#374151] hover:text-[#1677FF] cursor-pointer">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#1677FF] mb-4">Stay Updated</p>
            <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">Product news & city launches — once a month.</p>
            <form onSubmit={(e) => { e.preventDefault(); setEmail(""); }} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 min-w-0 border border-[#E7ECF4] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1677FF]"
              />
              <button className="bg-[#081B3A] text-white text-xs font-bold px-4 rounded-lg">Go</button>
            </form>
          </div>
        </div>

        <div className="border-t border-[#E7ECF4]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-wrap items-center justify-center gap-3 text-xs text-[#6B7280]">
            <span className='text-center font-bold'>© 2026 Lucohire. All rights reserved.</span>
            {/* <span>Made with care in India 🇮🇳</span> */}
          </div>
        </div>
      </footer>
  );
};

export default Footer;
