import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendChatMessage, uploadResume } from '../../services/providerAIService';
import { ALL_SKILLS } from '../../pages/provider/Profile';
import ProviderAIDebugPanel from './ProviderAIDebugPanel';
import toast from 'react-hot-toast';

const QUICK_CHIPS = [
  'Client ka message polite aur effective kaise reply karu?',
  'Mujhe pricing kaise set karni chahiye?',
  'Profile improve kaise karu?',
];

function makeId(prefix = 'm') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProviderAIChat({ profileContext = {}, missingFields = [], onUpdateField, inline = false }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(inline);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [debugState, setDebugState] = useState({
    lastApiStatus: 'idle',
    lastIntent: '',
    lastSkill: '',
    lastCity: '',
    usedLLM: false,
    fallbackReason: '',
  });

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeLoadingState, setResumeLoadingState] = useState(''); // 'uploading', 'extracting text', 'analyzing'
  const [resumeError, setResumeError] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB cap)
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size must be under 5 MB.');
      toast.error('File size must be under 5 MB.');
      return;
    }

    // Validate extension
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setResumeError('16. Invalid file. Allowed formats: PDF, JPG, JPEG, PNG, WEBP.');
      toast.error('Only PDF and standard images are allowed.');
      return;
    }

    // Block exe/js/html/svg
    const blockedExtensions = ['.exe', '.js', '.html', '.htm', '.svg'];
    if (blockedExtensions.includes(fileExt)) {
      setResumeError('Unsupported file type.');
      toast.error('Malicious or executable files are blocked.');
      return;
    }

    setResumeError('');
    setResumeLoading(true);
    setResumeLoadingState('uploading');

    const formData = new FormData();
    formData.append('resume', file);

    const toastId = toast.loading('Uploading resume...');

    try {
      // Step-by-step loading state animations
      setTimeout(() => setResumeLoadingState('extracting text'), 1500);
      setTimeout(() => setResumeLoadingState('analyzing'), 3500);

      const { data } = await uploadResume(formData);
      
      toast.success('Resume parsed successfully!', { id: toastId });
      
      // Open editable preview before applying, smart merge suggestions with non-empty existing profileContext values
      const rawAi = data.data || {};
      const merged = {
        fullName: rawAi.fullName || profileContext.name || '',
        contactNumber: rawAi.contactNumber || profileContext.phone || '',
        bio: rawAi.bio || profileContext.description || '',
        skills: (rawAi.skills && rawAi.skills.length > 0) ? rawAi.skills : (profileContext.skills || []),
        specialities: (rawAi.specialities && rawAi.specialities.length > 0) ? rawAi.specialities : (profileContext.skills || []),
        skillLevel: rawAi.skillLevel || profileContext.skillTier || 'unskilled',
        experienceYears: rawAi.experienceYears || profileContext.experience || '',
        serviceCategory: rawAi.serviceCategory || profileContext.category || '',
        city: rawAi.city || profileContext.city || '',
        serviceLocations: (rawAi.serviceLocations && rawAi.serviceLocations.length > 0)
          ? rawAi.serviceLocations
          : (profileContext.serviceLocations?.map(l => l.formattedAddress || l.name) || profileContext.locations || []),
        languages: (rawAi.languages && rawAi.languages.length > 0) ? rawAi.languages : (profileContext.languages || []),
        pricing: rawAi.pricing || profileContext.pricing || '',
        pricingType: rawAi.pricingType || profileContext.pricingType || 'hourly',
        pricingReason: rawAi.pricingReason || '',
        portfolioLinks: (rawAi.portfolioLinks && rawAi.portfolioLinks.length > 0)
          ? rawAi.portfolioLinks
          : (profileContext.portfolioLinks || []),
        availability: rawAi.availability || profileContext.availability || 'full-time',
        whatsappAlerts: rawAi.whatsappAlerts !== null ? rawAi.whatsappAlerts : (profileContext.whatsappAlerts ?? true)
      };
      setParsedPreview(merged);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || '16. AI parsing failed. Failed to parse resume details.';
      setResumeError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setResumeLoading(false);
      setResumeLoadingState('');
    }
  };

  const applyResumeChanges = () => {
    if (!parsedPreview) return;

    const suggestions = parsedPreview;

    // Apply all reviewed fields directly from the modal's suggestions
    const bulkData = {
      // 1. fullName -> name, profileName
      name: suggestions.fullName || '',
      profileName: suggestions.fullName || '',
      
      // 2. contactNumber -> phone
      phone: suggestions.contactNumber || '',
      
      // 3. bio -> description
      description: suggestions.bio || '',
      
      // 4. skills & specialities -> skills
      skills: (suggestions.specialities && suggestions.specialities.length > 0)
        ? suggestions.specialities
        : (suggestions.skills || []),
      
      // 5. skillLevel -> tier
      tier: suggestions.skillLevel || 'unskilled',
      
      // 6. experienceYears -> experience
      experience: suggestions.experienceYears || '',
      
      // 7. city & serviceLocations -> city, nearestLocation, locations
      city: suggestions.city || '',
      nearestLocation: suggestions.city || '',
      locations: (suggestions.serviceLocations || []).map(loc => {
        if (typeof loc === 'string') {
          return {
            placeId: '',
            name: loc,
            formattedAddress: loc,
            isLegacy: true,
          };
        }
        return loc;
      }),
      
      // 8. languages -> languages
      languages: suggestions.languages || [],
      
      // 9. pricing & pricingType -> pricing, pricingType
      pricing: suggestions.pricing ? String(suggestions.pricing) : '',
      pricingType: suggestions.pricingType || 'hourly',
      
      // 10. portfolioLinks -> portfolioLinks (with pending approval status)
      portfolioLinks: (suggestions.portfolioLinks || []).map(link => ({
        platform: String(link.platform || 'Personal Website').trim(),
        url: String(link.url || '').trim(),
        status: link.status || 'pending',
        isPublic: link.isPublic || false,
        approvedAt: link.approvedAt || null
      })).filter(l => l.url),

      // 11. whatsappAlerts
      whatsappAlerts: suggestions.whatsappAlerts !== null ? suggestions.whatsappAlerts : true
    };

    if (onUpdateField) {
      onUpdateField('bulk', bulkData);
    }

    toast.success('Resume details successfully applied to your draft! Please save draft below.');
    setParsedPreview(null);
  };

  const listRef = useRef(null);
  const isDev = import.meta.env.DEV;

  // Skill -> Speciality mapping rules
  const SKILL_TO_SPECIALITY = {
    'web development': 'Web Developer',
    'full stack development': 'Full Stack Developer',
    'plumbing': 'Plumber',
    'ac repair': 'AC Mechanic',
    'ac technician': 'AC Mechanic',
    'digital marketing': 'Digital Marketer',
  };

  const mapSkillToSpeciality = (skill) => {
    if (!skill) return skill;
    const lower = String(skill).toLowerCase().trim();
    return SKILL_TO_SPECIALITY[lower] || skill;
  };

  const generateAutoBio = (ctx) => {
    const name = ctx.name || (user && user.name) || 'The provider';
    const skills = Array.isArray(ctx.skills) && ctx.skills.length > 0 ? ctx.skills : (ctx.category ? [ctx.category] : []);
    const skillLabel = skills.join(', ');
    const tier = ctx.skillTier || '';
    const exp = ctx.experience || (ctx.experienceMonths ? `${Math.round(ctx.experienceMonths/12)} years` : 'some experience');
    const city = ctx.city || '';
    const pricing = ctx.pricing ? `₹${ctx.pricing}/${ctx.pricingType || 'hr'}` : '';
    const parts = [];
    parts.push(`${name} is${tier ? ' a ' + tier + ' ' : ' '}professional`);
    if (skillLabel) parts.push(`specialising in ${skillLabel}`);
    if (exp) parts.push(`with ${exp} of experience`);
    if (city) parts.push(`based in ${city}`);
    if (pricing) parts.push(`and typically charges around ${pricing}`);
    return parts.join(' ') + '.';
  };

  const recentMessages = useMemo(
    () => messages.slice(-8).map((item) => ({ author: item.author, text: item.text })),
    [messages]
  );

  useEffect(() => {
    if (!isOpen) return;
    const container = listRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isOpen]);

  // Initial passive inference: map skills -> speciality and auto-generate bio when appropriate
  useEffect(() => {
    // Map existing skills to speciality labels without asking the user
    try {
      if (profileContext && Array.isArray(profileContext.skills) && profileContext.skills.length > 0 && onUpdateField) {
        const mapped = profileContext.skills.map(s => mapSkillToSpeciality(s));
        // Only update if mapping changed something
        const changed = mapped.some((m, idx) => m !== profileContext.skills[idx]);
        if (changed) {
          onUpdateField('skills', mapped);
        }
      }

      // Auto-generate a bio if missing or too short
      const hasDescription = profileContext.description && String(profileContext.description).trim().length >= 20;
      if (!hasDescription && onUpdateField) {
        const bio = generateAutoBio(profileContext);
        if (bio) {
          onUpdateField('description', bio);
          // Prepend an assistant message to preview generated bio
          setMessages((prev) => [
            ...prev,
            { id: makeId('assistant-bio'), author: 'assistant', text: `Suggested Bio:\n${bio}` },
          ]);
        }
      }
    } catch (e) {
      if (isDev) console.error('[ProviderAIChat] passive inference error', e);
    }
    // We only want to run this on mount/profileContext change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileContext]);

  const welcomeText = useMemo(() => {
    if (Array.isArray(missingFields) && missingFields.length > 0) {
      return `Namaste! Main aapka AI Profile Assistant hoon. Mujhe lagta hai aapki profile me kuch details missing hain:\n- ${missingFields.join('\n- ')}\n\nChaliye inhein complete karte hain! Sabse pehle, aap apna **${missingFields[0]}** bataiye?`;
    }
    return 'Namaste! Main aapka AI Profile Assistant hoon. Aapki profile complete hai! Aap mujhse pricing, client reply ya general queries me help le sakte hain.';
  }, [missingFields]);

  useEffect(() => {
    setMessages((prev) => {
      const hasUserMessages = prev.some((m) => m.author === 'user');
      if (!hasUserMessages) {
        return [
          {
            id: 'ai-welcome',
            author: 'assistant',
            text: welcomeText,
          },
        ];
      }
      return prev;
    });
  }, [welcomeText]);

  const updateMessage = (id, next) => {
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

  const askAssistant = async (text) => {
    const message = String(text || '').trim();
    if (!message || isLoading) return;

    // Local Regex extraction heuristics
    const localExtracted = {};
    const updates = [];

    // 1. Phone number (10-digit number sequence)
    const phoneMatch = message.match(/\b\d{10}\b/);
    if (phoneMatch && onUpdateField) {
      onUpdateField('phone', phoneMatch[0]);
      localExtracted.phone = phoneMatch[0];
      updates.push(`WhatsApp/Contact: ${phoneMatch[0]}`);
    }

    // 2. Pricing unit (Hourly, Monthly, Daily, Fixed)
    const msgLower = message.toLowerCase();
    let localPricingType = '';
    if (msgLower.includes('hour') || msgLower.includes('ghante') || msgLower.includes('per hour') || msgLower.includes('/hr')) {
      localPricingType = 'hourly';
    } else if (msgLower.includes('month') || msgLower.includes('mahina') || msgLower.includes('monthly') || msgLower.includes('/mo')) {
      localPricingType = 'monthly';
    } else if (msgLower.includes('day') || msgLower.includes('din') || msgLower.includes('daily') || msgLower.includes('/day')) {
      localPricingType = 'daily';
    } else if (msgLower.includes('fixed')) {
      localPricingType = 'fixed';
    }
    if (localPricingType && onUpdateField) {
      onUpdateField('pricingType', localPricingType);
      localExtracted.pricingType = localPricingType;
      updates.push(`Pricing Unit: per ${localPricingType}`);
    }

    // 3. Pricing rate (3-6 digits that are not the 10-digit phone number)
    const numbers = message.match(/\b\d{3,6}\b/g);
    if (numbers && (!phoneMatch || numbers.every(num => !phoneMatch[0].includes(num)))) {
      const rate = numbers[0];
      if (rate && onUpdateField) {
        onUpdateField('pricing', rate);
        localExtracted.pricing = rate;
        updates.push(`Payout Rate: ₹${rate}`);
      }
    }

    // 4. Name (My name is ..., I am ..., name ... hai, etc.)
    let nameMatch = message.match(/(?:my name is|i am|this is)\s+([a-zA-Z]{3,15}(?:\s+[a-zA-Z]{3,15}){1,2})/i);
    if (!nameMatch) nameMatch = message.match(/(?:naam|name)\s+([a-zA-Z]{3,15}(?:\s+[a-zA-Z]{3,15}){1,2})\s+(?:hai|hu|hoon)/i);
    if (!nameMatch) nameMatch = message.match(/\b([a-zA-Z]{3,15}(?:\s+[a-zA-Z]{3,15}){1,2})\s+here\b/i);
    if (nameMatch && onUpdateField) {
      const parsedName = nameMatch[1].trim();
      onUpdateField('name', parsedName);
      onUpdateField('profileName', parsedName);
      localExtracted.name = parsedName;
      updates.push(`Full Name: ${parsedName}`);
    }

    // 5. Experience (X years, Y months, X saal, etc.)
    const expYearsMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:saal|sal|year|years|yr|yrs)\b/i);
    const expMonthsMatch = message.match(/(\d+)\s*(?:mahina|mahine|month|months|mo|mos)\b/i);
    let parsedExperience = null;
    if (expYearsMatch) {
      parsedExperience = `${expYearsMatch[1]} years`;
    } else if (expMonthsMatch) {
      parsedExperience = `${expMonthsMatch[1]} months`;
    }
    if (parsedExperience && onUpdateField) {
      onUpdateField('experience', parsedExperience);
      localExtracted.experience = parsedExperience;
      updates.push(`Experience: ${parsedExperience}`);
    }

    // 6. Skills extraction (checking ALL_SKILLS from imported list)
    const localSkills = [];
    ALL_SKILLS.forEach(skill => {
      let keyword = skill.toLowerCase();
      if (keyword === 'cctv installer') {
        if (msgLower.includes('cctv')) {
          localSkills.push(skill);
        }
      } else if (keyword === 'ac technician') {
        if (/\bac\b/i.test(msgLower) || msgLower.includes('ac technician')) {
          localSkills.push(skill);
        }
      } else {
        if (msgLower.includes(keyword)) {
          localSkills.push(skill);
        }
      }
    });
    if (localSkills.length > 0 && onUpdateField) {
      onUpdateField('skills', localSkills);
      localExtracted.skills = localSkills;
      updates.push(`Specialities / Skills: ${localSkills.join(', ')}`);
    }

    const userMessageId = makeId('user');
    const loadingId = makeId('loading');

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, author: 'user', text: message },
      { id: loadingId, author: 'assistant', text: 'Thinking...', status: 'loading' },
    ]);
    setInput('');
    setIsLoading(true);

    const payload = {
      message,
      providerId: user?._id,
      profileContext,
      recentMessages,
      conversationId,
    };

    if (isDev) {
      console.log('[ProviderAIChat] sending message', { message });
      console.log('[ProviderAIChat] request payload', payload);
    }

    try {
      const { data } = await sendChatMessage(payload);
      const responseData = data?.data || {};

      if (isDev) {
        console.log('[ProviderAIChat] response payload', data);
      }

      const extracted = responseData.extracted || {};
      if (extracted.city && onUpdateField) {
        onUpdateField('city', extracted.city);
        updates.push(`Location/City: ${extracted.city}`);
      }
      if (extracted.skill && onUpdateField) {
        onUpdateField('skills', [extracted.skill]);
        updates.push(`Speciality/Skill: ${extracted.skill}`);
      }
      if (extracted.budget && !localExtracted.pricing && onUpdateField) {
        const cleanBudget = extracted.budget.replace(/[^\d]/g, '');
        if (cleanBudget) {
          onUpdateField('pricing', cleanBudget);
          updates.push(`Payout Rate: ₹${cleanBudget}`);
        }
      }
      // AI extracts complete fields
      if (extracted.name && onUpdateField) {
        onUpdateField('name', extracted.name);
        onUpdateField('profileName', extracted.name);
        updates.push(`Full Name: ${extracted.name}`);
      }
      if (extracted.tier && onUpdateField) {
        onUpdateField('tier', extracted.tier);
        updates.push(`Skill Tier: ${extracted.tier}`);
      }
      if (extracted.experience && onUpdateField) {
        onUpdateField('experience', extracted.experience);
        updates.push(`Experience: ${extracted.experience}`);
      }
      if (extracted.phone && onUpdateField) {
        onUpdateField('phone', extracted.phone);
        updates.push(`WhatsApp Phone: ${extracted.phone}`);
      }
      if (extracted.pricingType && onUpdateField) {
        onUpdateField('pricingType', extracted.pricingType);
        updates.push(`Pricing Unit: per ${extracted.pricingType}`);
      }
      if (extracted.description && onUpdateField) {
        onUpdateField('description', extracted.description);
        updates.push(`Description: ${extracted.description.slice(0, 40)}...`);
      }
      if (Array.isArray(extracted.languages) && extracted.languages.length > 0 && onUpdateField) {
        onUpdateField('languages', extracted.languages);
        updates.push(`Languages: ${extracted.languages.join(', ')}`);
      }

      let assistantReply = responseData.reply || 'Assistant reply unavailable.';
      if (updates.length > 0) {
        assistantReply = `✅ **Maine aapki profile update kar di hai!**\n` +
          updates.map((u) => `- ${u}`).join('\n') +
          `\n\n` + assistantReply;
      }

      // Calculate remaining missing fields dynamically
      const updatedFieldsList = [];
      if (extracted.city) updatedFieldsList.push('Location / City');
      if (extracted.skill) updatedFieldsList.push('Speciality / Skill');
      if (localExtracted.phone || extracted.phone) updatedFieldsList.push('WhatsApp / Contact Number');
      if (localExtracted.pricing || extracted.pricing || (extracted.budget && extracted.budget.replace(/[^\d]/g, ''))) {
        updatedFieldsList.push('Payout / Pricing Rate');
      }
      if (localExtracted.pricingType || extracted.pricingType) {
        updatedFieldsList.push('Pricing Unit');
      }
      if (extracted.tier) {
        updatedFieldsList.push('Skill Tier');
      }

      const remainingMissing = missingFields.filter((field) => {
        if (field.includes('Location') && updatedFieldsList.includes('Location / City')) return false;
        if (field.includes('Speciality') && updatedFieldsList.includes('Speciality / Skill')) return false;
        if (field.includes('WhatsApp') && updatedFieldsList.includes('WhatsApp / Contact Number')) return false;
        if (field.includes('Payout') && updatedFieldsList.includes('Payout / Pricing Rate')) return false;
        if (field.includes('Pricing Unit') && updatedFieldsList.includes('Pricing Unit')) return false;
        if (field.includes('Skill Tier') && updatedFieldsList.includes('Skill Tier')) return false;
        return true;
      });

      if (remainingMissing.length > 0) {
        assistantReply += `\n\nAb please apna next missing detail **${remainingMissing[0]}** bataiye?`;
      } else if (missingFields.length > 0) {
        assistantReply += `\n\n🎉 **Shabash! Aapki sabhi mandatory details fill ho chuki hain.** Profile ko submit karne ke liye niche scroll karein aur **Save Profile** button pe click karein.`;
      }

      updateMessage(loadingId, {
        text: assistantReply,
        status: 'sent',
      });

      if (responseData.conversationId) {
        setConversationId(String(responseData.conversationId));
      }

      setDebugState({
        lastApiStatus: 'success',
        lastIntent: responseData.detectedIntent || '',
        lastSkill: responseData.extracted?.skill || '',
        lastCity: responseData.extracted?.city || '',
        usedLLM: Boolean(responseData.debug?.usedLLM),
        fallbackReason: responseData.debug?.fallbackReason || '',
      });
    } catch (error) {
      if (isDev) {
        console.error('[ProviderAIChat] API error', error);
      }

      updateMessage(loadingId, {
        text: error?.response?.data?.message || 'Assistant unavailable. Please try again.',
        status: 'error',
      });

      setDebugState((prev) => ({
        ...prev,
        lastApiStatus: 'error',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (inline) {
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8 animate-fadeIn font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <p className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              Interactive AI Profile Assistant
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Talk to complete your profile fields dynamically or ask questions.</p>
          </div>
          {missingFields.length > 0 && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-amber-100">
              {missingFields.length} field{missingFields.length > 1 ? 's' : ''} left
            </span>
          )}
        </div>

        {/* 1. Resume Upload Dropzone */}
        <div className="mb-6 p-6 rounded-3xl bg-indigo-50/30 border-2 border-dashed border-indigo-200/80 flex flex-col items-center justify-center text-center transition hover:bg-indigo-50/60 relative overflow-hidden">
          {resumeLoading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
              <p className="text-sm font-extrabold text-indigo-700 capitalize animate-pulse">
                {resumeLoadingState === 'uploading' && '📤 Uploading resume...'}
                {resumeLoadingState === 'extracting text' && '🔍 OCR extracting text...'}
                {resumeLoadingState === 'analyzing' && '🤖 AI parsing & analyzing...'}
                {!resumeLoadingState && 'Processing...'}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Please keep this page open</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl mb-3 shadow-xs">
                📄
              </div>
              <p className="text-sm font-extrabold text-slate-800">Fill Profile in 1-Click via Resume ✨</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Upload PDF, JPG, JPEG, PNG, or WEBP (Max 5MB)</p>
              
              {resumeError && (
                <p className="mt-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 animate-fadeIn">
                  ⚠️ {resumeError}
                </p>
              )}

              <input
                type="file"
                id="resume-file-input"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleResumeUpload}
              />
              <button
                type="button"
                onClick={() => document.getElementById('resume-file-input').click()}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100"
              >
                Select Resume File
              </button>
            </>
          )}
        </div>

        {/* 9. Editable Resume Preview Modal */}
        {parsedPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-zoomIn">
              {/* Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Review AI Extracted Details</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Please review and edit details extracted from your resume before applying.</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setParsedPreview(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left font-sans">
                {/* Name & Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      value={parsedPreview.fullName || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp / Contact Number</label>
                    <input
                      type="text"
                      value={parsedPreview.contactNumber || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, contactNumber: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Professional Bio</label>
                  <textarea
                    value={parsedPreview.bio || ''}
                    onChange={(e) => setParsedPreview({ ...parsedPreview, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition resize-none shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills (Comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(parsedPreview.skills) ? parsedPreview.skills.join(', ') : parsedPreview.skills || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>

                  {/* Specialities */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialities (Comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(parsedPreview.specialities) ? parsedPreview.specialities.join(', ') : parsedPreview.specialities || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, specialities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">City</label>
                    <input
                      type="text"
                      value={parsedPreview.city || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, city: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>

                  {/* Service Locations */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Locations (Comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(parsedPreview.serviceLocations) ? parsedPreview.serviceLocations.join(', ') : parsedPreview.serviceLocations || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, serviceLocations: e.target.value.split(',').map(l => l.trim()).filter(Boolean) })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Smart Skill Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Smart Skill Level (AI Recommended)</label>
                    <div className="relative">
                      <select
                        value={parsedPreview.skillLevel || 'unskilled'}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, skillLevel: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition appearance-none shadow-inner"
                      >
                        <option value="unskilled">Unskilled</option>
                        <option value="semi_skilled">Semi Skilled</option>
                        <option value="skilled">Skilled</option>
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Experience Years */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience Years</label>
                    <input
                      type="text"
                      value={parsedPreview.experienceYears || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, experienceYears: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Category</label>
                    <input
                      type="text"
                      value={parsedPreview.serviceCategory || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, serviceCategory: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Availability</label>
                    <input
                      type="text"
                      value={parsedPreview.availability || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, availability: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pricing */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payout Amount (₹)</label>
                    <input
                      type="text"
                      value={parsedPreview.pricing || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, pricing: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>

                  {/* Pricing Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pricing Unit</label>
                    <div className="relative">
                      <select
                        value={parsedPreview.pricingType || 'hourly'}
                        onChange={(e) => setParsedPreview({ ...parsedPreview, pricingType: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition appearance-none shadow-inner"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="fixed">Fixed</option>
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Languages */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Languages (Comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(parsedPreview.languages) ? parsedPreview.languages.join(', ') : parsedPreview.languages || ''}
                      onChange={(e) => setParsedPreview({ ...parsedPreview, languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean) })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 transition shadow-inner"
                    />
                  </div>

                  {/* WhatsApp Alerts */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-inner">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">WhatsApp Alerts</label>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Receive job matches on WhatsApp</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setParsedPreview({ ...parsedPreview, whatsappAlerts: !parsedPreview.whatsappAlerts })}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 outline-none ${parsedPreview.whatsappAlerts ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${parsedPreview.whatsappAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Portfolio Links Section */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🌐</span> Portfolio & Social Links
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLinks = [...(parsedPreview.portfolioLinks || [])];
                        nextLinks.push({ platform: 'Personal Website', url: '', status: 'pending', isPublic: false });
                        setParsedPreview({ ...parsedPreview, portfolioLinks: nextLinks });
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                    >
                      <span>➕</span> Add Link
                    </button>
                  </div>
                  {(!parsedPreview.portfolioLinks || parsedPreview.portfolioLinks.length === 0) ? (
                    <p className="text-xs text-slate-400 font-medium italic py-3 bg-slate-50/50 rounded-xl text-center border border-dashed border-slate-200">
                      No portfolio links extracted. Click "Add Link" to add your websites or social profiles.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {parsedPreview.portfolioLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-200 shadow-inner">
                          <div className="w-1/3 relative">
                            <select
                              value={link.platform}
                              onChange={(e) => {
                                const nextLinks = [...parsedPreview.portfolioLinks];
                                nextLinks[idx].platform = e.target.value;
                                setParsedPreview({ ...parsedPreview, portfolioLinks: nextLinks });
                              }}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 bg-white outline-none"
                            >
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="GitHub">GitHub</option>
                              <option value="Behance">Behance</option>
                              <option value="Dribbble">Dribbble</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Personal Website">Personal Website</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => {
                              const nextLinks = [...parsedPreview.portfolioLinks];
                              nextLinks[idx].url = e.target.value;
                              setParsedPreview({ ...parsedPreview, portfolioLinks: nextLinks });
                            }}
                            placeholder="URL (e.g. https://github.com/username)"
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 bg-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextLinks = parsedPreview.portfolioLinks.filter((_, i) => i !== idx);
                              setParsedPreview({ ...parsedPreview, portfolioLinks: nextLinks });
                            }}
                            className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove Link"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setParsedPreview(null)}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-700 text-xs font-bold transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyResumeChanges}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-200"
                >
                  Apply Changes to Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* <div ref={listRef} className="p-4 h-64 overflow-y-auto space-y-3 bg-slate-50/50 rounded-2xl mb-4 border border-slate-100/50">
          {messages.map((item) => (
            <div key={item.id} className={`flex ${item.author === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                  item.author === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                    : item.status === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_CHIPS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => askAssistant(text)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-100 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold disabled:opacity-60 shadow-xs"
              >
                {text}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              askAssistant(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., main AC mechanic hu Delhi me, 3 saal ka experience hai..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-60 shrink-0"
            >
              Send
            </button>
          </form>
        </div> */}
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-900 text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Provider AI Assistant</p>
              <p className="text-[11px] text-gray-300">Context-aware AI chat</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="text-xs text-gray-300 hover:text-white">Close</button>
          </div>

          <div ref={listRef} className="p-3 h-96 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((item) => (
              <div key={item.id} className={`flex ${item.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    item.author === 'user'
                      ? 'bg-blue-600 text-white'
                      : item.status === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_CHIPS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => askAssistant(text)}
                  disabled={isLoading}
                  className="text-[11px] px-2 py-1 rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-60"
                >
                  {text}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAssistant(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask assistant..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Send
              </button>
            </form>

            {isDev ? <ProviderAIDebugPanel debugState={debugState} /> : null}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
      >
        AI Chat
      </button>
    </div>
  );
}
