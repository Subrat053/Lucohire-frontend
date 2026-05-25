import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendChatMessage } from '../../services/providerAIService';
import { ALL_SKILLS } from '../../pages/provider/Profile';
import ProviderAIDebugPanel from './ProviderAIDebugPanel';

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

        <div ref={listRef} className="p-4 h-64 overflow-y-auto space-y-3 bg-slate-50/50 rounded-2xl mb-4 border border-slate-100/50">
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
        </div>
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
