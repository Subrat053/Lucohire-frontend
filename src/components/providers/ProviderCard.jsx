import { memo } from 'react';
import { MapPin, Phone, MessageCircle, Star, CheckCircle2 } from 'lucide-react';
import { HiBadgeCheck } from 'react-icons/hi';
import { toAbsoluteMediaUrl } from '../../utils/media';

const landingAvatarColors = [
  'bg-[#DFFBF0] text-[#08905B]',
  'bg-[#EAF2FF] text-[#1677FF]',
  'bg-[#FFF3E6] text-[#E56700]',
  'bg-[#F4E8FF] text-[#8A38D6]',
  'bg-[#FEF3C7] text-[#B45309]',
  'bg-[#DCFCE7] text-[#15803D]',
];

const getInitials = (name = 'Provider') =>
  String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';

const ProviderCard = ({ provider = {}, variant = 'search', badge = '', onClick, t = (value) => value, index = 0 }) => {
  const image = provider.image || provider.profilePhoto || provider.photo || provider.avatar || provider.user?.avatar;
  const name = provider.name || provider.user?.name || 'Service Provider';
  const initials = provider.initials || getInitials(name);
  const rating = provider.rating || provider.averageRating || 0;
  const reviews = provider.totalReviews || provider.reviews || 0;
  const location = provider.location || provider.city || provider.locationLabel || '';
  const skills = Array.isArray(provider.skills) ? provider.skills : [];
  const ratePerHour = provider.ratePerHour || provider.rate || 0;
  const available = provider.isAvailable !== false;

  if (variant === 'landing') {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl border border-[#E7ECF4] p-5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition cursor-pointer flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          {image ? (
            <img src={toAbsoluteMediaUrl(image)} alt={name} className="w-11 h-11 rounded-full object-cover border border-[#E7ECF4]" />
          ) : (
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${provider.avatarBg || landingAvatarColors[index % landingAvatarColors.length]}`}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[#081B3A] text-sm truncate">{name}</h3>
              <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
            </div>
            <p className="text-xs text-[#6B7280] truncate">{provider.role || provider.category || provider.headline || 'Professional'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
          <span className="font-bold text-[#081B3A]">{rating}</span>
          <span className="text-[#6B7280]">({reviews} reviews)</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
          <MapPin className="w-3 h-3" /> {location}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[11px] font-medium text-[#374151] bg-[#F3F6FB] border border-[#E7ECF4] px-2 py-0.5 rounded-md"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-lg font-extrabold text-[#081B3A]">₹{ratePerHour}</span>
            <span className="text-xs text-[#6B7280]"> /hr</span>
          </div>
          <span className="text-xs text-[#6B7280]">{provider.distanceKm != null ? `~${provider.distanceKm}m` : ''}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 border border-[#E7ECF4] text-[#374151] text-xs font-semibold py-2 rounded-xl hover:bg-[#F7F9FC] transition"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1677FF] hover:bg-[#0E5FCC] text-white text-xs font-bold py-2 rounded-xl transition"
          >
            <Phone className="w-3.5 h-3.5" /> Call Now
          </button>
        </div>
      </div>
    );
  }

  const tierColors = { unskilled:'bg-emerald-100 text-emerald-700', 'semi-skilled':'bg-amber-100 text-amber-700', skilled:'bg-indigo-100 text-indigo-700' };
  const tierLabels = {
    unskilled: t('search.tierUnskilled'),
    'semi-skilled': t('search.tierSemiSkilled'),
    skilled: t('search.tierSkilled'),
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border hover:shadow-md transition-all duration-200 cursor-pointer group p-5 ${badge==='rotation'?'border-amber-300 ring-2 ring-amber-100':badge==='featured'?'border-indigo-200':'border-stone-200'}`}
    >
      {badge && (
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${badge==='rotation'?'bg-amber-100 text-amber-700':'bg-indigo-100 text-indigo-700'}`}>
          {badge==='rotation' ? t('search.topProvider') : t('search.featured')}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
            {image ? (
              <img src={toAbsoluteMediaUrl(image)} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-600 font-bold text-xl">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <h3 className="font-semibold text-stone-800 text-sm truncate">{name}</h3>
              {provider.isVerified && <HiBadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-stone-700">{rating}</span>
              <span className="text-xs text-stone-400">({reviews})</span>
            </div>
            <p className="text-xs text-stone-400 flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-3 h-3" />{location}
              {provider.distanceKm != null && <span>&bull; {provider.distanceKm} km</span>}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <span className={`w-2 h-2 rounded-full inline-block ${available ? 'bg-emerald-400' : 'bg-stone-300'}`}></span>
            <span className={`text-xs font-medium ${available ? 'text-emerald-600' : 'text-stone-400'}`}>
              {available ? t('search.available') : t('search.busy')}
            </span>
          </div>
          {ratePerHour && <span className="text-sm font-bold text-stone-800">&#8377;{ratePerHour}<span className="text-xs font-normal text-stone-400">/hr</span></span>}
        </div>
      </div>
      {provider.headline && <p className="text-xs text-stone-500 mb-3 line-clamp-1">{provider.headline}</p>}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {skills.slice(0, 4).map((skill, i)=>(
          <span key={i} className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs rounded-full font-medium">{skill}</span>
        ))}
        {skills.length>4&&<span className="px-2.5 py-1 bg-stone-50 text-stone-400 text-xs rounded-full">+{skills.length-4}</span>}
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={(e)=>{e.stopPropagation();onClick&&onClick();}} className="flex-1 bg-stone-900 hover:bg-stone-700 text-white py-2 rounded-xl text-xs font-semibold transition">{t('search.viewProfile')}</button>
        {provider.tier && (
          <span className={`self-center text-xs px-2.5 py-1.5 rounded-xl font-medium capitalize ${tierColors[provider.tier]||'bg-stone-100 text-stone-500'}`}>
            {tierLabels[provider.tier] || provider.tier.replace('-', ' ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(ProviderCard);
