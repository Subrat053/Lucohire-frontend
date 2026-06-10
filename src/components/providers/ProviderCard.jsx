import { memo } from 'react';
import { MapPin, Phone, MessageCircle, Star, CheckCircle2 } from 'lucide-react';
import { HiBadgeCheck } from 'react-icons/hi';
import { toOptimizedMediaUrl } from '../../utils/media';
import useTranslation from '../../hooks/useTranslation';

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

const ProviderCard = ({ provider = {}, variant = 'search', badge = '', onClick, index = 0 }) => {
  // Respect the provider's WhatsApp notification preference.
  // whatsappAlerts defaults to true in normalizeProviderData, so false means explicitly disabled.
  const whatsappEnabled = provider.whatsappAlerts !== false;
  const { t } = useTranslation();
  const image = provider.image || provider.profilePhoto || provider.photo || provider.avatar || provider.user?.avatar;
  const name = provider.name || provider.user?.name || 'Service Provider';
  const initials = provider.initials || getInitials(name);
  const rating = provider.rating || provider.averageRating || 0;
  const reviews = provider.totalReviews || provider.reviews || 0;
  const location = provider.location || provider.city || provider.locationLabel || '';
  const skills = Array.isArray(provider.skills) ? provider.skills : [];
  const ratePerHour = provider.ratePerHour || provider.rate || 0;
  const available = provider.isAvailable !== false;
  const planBadge = provider.planBadge || (provider.isBoosted ? 'Boosted' : '');
  const visibilityLevel = provider.visibilityLevel || '';
  const badgeStyleByLevel = {
    country_top: 'bg-[#E6F2FF] text-[#0B6BFF] border border-[#CFE2FF]',
    city_top: 'bg-[#EAF7F0] text-[#16A34A] border border-[#CDEEDB]',
    pincode_top: 'bg-[#FFF4E6] text-[#D97706] border border-[#FAD7A0]',
    custom: 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]',
    basic: 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]',
  };
  const planBadgeStyle = badgeStyleByLevel[visibilityLevel] || 'bg-[#E6F2FF] text-[#0B6BFF] border border-[#CFE2FF]';

  // Limit skills to 2 or 3
  const maxSkillsToShow = 2;
  const visibleSkills = skills.slice(0, maxSkillsToShow);
  const remainingSkills = skills.length - maxSkillsToShow;

  if (variant === 'landing') {
    const roleText = provider.role || provider.category || provider.headline || t('common.professional', 'Professional');
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl border border-[#E7ECF4] p-5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition cursor-pointer flex flex-col h-full gap-3 justify-between"
      >
        {/* Header section */}
        <div className="flex items-center gap-3 min-h-[44px]">
          {image ? (
            <img
              src={toOptimizedMediaUrl(image, { width: 88, height: 88, crop: 'fill', dpr: 'auto' })}
              alt={name}
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              className="w-11 h-11 rounded-full object-cover border border-[#E7ECF4] shrink-0"
            />
          ) : (
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${provider.avatarBg || landingAvatarColors[index % landingAvatarColors.length]}`}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[#081B3A] text-sm truncate" title={name}>{name}</h3>
              {provider.isVerified !== false && <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />}
            </div>
            <p className="text-xs text-[#6B7280] truncate" title={roleText}>{roleText}</p>
          </div>
        </div>

        {/* Rating section */}
        <div className="flex items-center gap-1.5 text-xs h-4">
          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] shrink-0" />
          <span className="font-bold text-[#081B3A]">{rating}</span>
          <span className="text-[#6B7280]">({reviews} {t('common.reviews', 'reviews')})</span>
        </div>

        {/* Location section */}
        <div className="flex items-center gap-1 text-xs text-[#6B7280] h-4 truncate">
          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{location || t('common.locationUnavailable', 'Location N/A')}</span>
        </div>

        {/* Skills section (fixed height) */}
        <div className="flex flex-wrap items-center gap-1.5 h-7 overflow-hidden">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="text-[11px] font-medium text-[#374151] bg-[#F3F6FB] border border-[#E7ECF4] px-2 py-0.5 rounded-md truncate max-w-[100px]"
            >
              {skill}
            </span>
          ))}
          {remainingSkills > 0 && (
            <span className="text-[11px] font-medium text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md shrink-0">
              +{remainingSkills} more
            </span>
          )}
        </div>

        {/* Price and distance section */}
        <div className="flex items-baseline justify-between pt-1 border-t border-[#F3F6FB] mt-auto">
          <div>
            <span className="text-lg font-extrabold text-[#081B3A]">₹{ratePerHour}</span>
            <span className="text-xs text-[#6B7280]"> /hr</span>
          </div>
          <span className="text-xs text-[#6B7280]">
            {provider.distanceKm != null ? `~${provider.distanceKm}m` : ''}
          </span>
        </div>

        {/* CTA buttons row */}
        <div className="flex gap-2 pt-1 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // If WhatsApp is enabled and a number is available → open WhatsApp directly.
              // Otherwise navigate to the provider's profile so the user can unlock contact details.
              const waNum = provider.whatsappNumber || provider.user?.whatsappNumber;
              if (whatsappEnabled && waNum) {
                const cleanNum = String(waNum).replace(/\D/g, '');
                window.open(`https://wa.me/${cleanNum}`, '_blank');
              } else {
                onClick?.();
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 border border-[#E7ECF4] text-[#374151] text-xs font-semibold py-2 rounded-xl hover:bg-[#F7F9FC] transition h-9"
          >
            <MessageCircle className="w-3.5 h-3.5" /> {t('common.whatsapp', 'WhatsApp')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1677FF] hover:bg-[#0E5FCC] text-white text-xs font-bold py-2 rounded-xl transition h-9"
          >
            <Phone className="w-3.5 h-3.5" /> {t('common.callNow', 'Call Now')}
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

  const roleText = provider.role || provider.category || provider.headline || t('common.professional', 'Professional');
  const experienceText = provider.experience ? provider.experience : 'N/A';
  const displayRole = `${roleText} • ${experienceText}`;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border hover:shadow-md transition-all duration-200 cursor-pointer group p-5 flex flex-col h-full gap-3 justify-between ${badge==='rotation'?'border-amber-300 ring-2 ring-amber-100':badge==='featured'?'border-indigo-200':'border-stone-200'}`}
    >
      <div>
        {(badge || planBadge) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {badge && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge==='rotation'?'bg-amber-100 text-amber-700':'bg-indigo-100 text-indigo-700'}`}>
                {badge==='rotation' ? t('search.topProvider') : t('search.featured')}
              </span>
            )}
            {planBadge && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${planBadgeStyle}`}>
                {planBadge}
              </span>
            )}
          </div>
        )}
        
        {/* Header section */}
        <div className="flex items-center gap-3 min-h-[44px]">
          {image ? (
            <img
              src={toOptimizedMediaUrl(image, { width: 88, height: 88, crop: 'fill', dpr: 'auto' })}
              alt={name}
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              className="w-11 h-11 rounded-full object-cover border border-[#E7ECF4] shrink-0"
            />
          ) : (
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${provider.avatarBg || landingAvatarColors[index % landingAvatarColors.length]}`}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[#081B3A] text-sm truncate" title={name}>{name}</h3>
              {provider.isVerified && <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />}
            </div>
            <p className="text-xs text-[#6B7280] truncate" title={displayRole}>{displayRole}</p>
          </div>
        </div>
      </div>

      {/* Rating section */}
      <div className="flex items-center gap-1.5 text-xs h-4">
        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] shrink-0" />
        <span className="font-bold text-[#081B3A]">{rating}</span>
        <span className="text-[#6B7280]">({reviews} {t('common.reviews', 'reviews')})</span>
      </div>

      {/* Location section */}
      <div className="flex items-center gap-1 text-xs text-[#6B7280] h-4 truncate">
        <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{location || t('common.locationUnavailable', 'Location N/A')}</span>
      </div>

      {/* Skills section (fixed height) */}
      <div className="flex flex-wrap items-center gap-1.5 h-7 overflow-hidden">
        {visibleSkills.map((skill) => (
          <span
            key={skill}
            className="text-[11px] font-medium text-[#374151] bg-[#F3F6FB] border border-[#E7ECF4] px-2 py-0.5 rounded-md truncate max-w-[100px]"
          >
            {skill}
          </span>
        ))}
        {remainingSkills > 0 && (
          <span className="text-[11px] font-medium text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md shrink-0">
            +{remainingSkills}
          </span>
        )}
      </div>

      {/* Price and distance section */}
      <div className="flex items-baseline justify-between pt-1 border-t border-[#F3F6FB] mt-auto">
        <div>
          {ratePerHour ? (
            <span className="text-lg font-extrabold text-[#081B3A]">
              ₹{ratePerHour}
              <span className="text-xs font-normal text-[#6B7280]">/hr</span>
            </span>
          ) : (
            <span className="text-xs text-[#6B7280]">Rate N/A</span>
          )}
        </div>
        <span className="text-xs text-[#6B7280]">
          {provider.distanceKm != null ? `~${provider.distanceKm}m` : ''}
        </span>
      </div>

      {/* CTA buttons row */}
      <div className="flex gap-2 pt-1 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Open WhatsApp only if the provider has given consent (whatsappAlerts = true)
            // AND a WhatsApp number is available (contact is accessible).
            // In all other cases silently navigate to the provider's profile.
            const waNum = provider.whatsappNumber || provider.user?.whatsappNumber;
            if (whatsappEnabled && waNum) {
              const cleanNum = String(waNum).replace(/\D/g, '');
              window.open(`https://wa.me/${cleanNum}`, '_blank');
            } else {
              onClick?.();
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-[#E7ECF4] text-[#ffffff] text-xs font-semibold py-2 rounded-xl bg-[#128C7E] hover:bg-[#075E54] transition h-9"
        >
          <MessageCircle className="w-3.5 h-3.5" /> {t('common.whatsapp', 'WhatsApp')}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#0096FF] hover:bg-[#0E5FCC] text-white text-xs font-bold py-2 rounded-xl transition h-9"
        >
          <Phone className="w-3.5 h-3.5" /> {t('common.callNow', 'Call Now')}
        </button>
      </div>
    </div>
  );
};

export default memo(ProviderCard);
