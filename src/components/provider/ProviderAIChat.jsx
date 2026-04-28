import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendChatMessage } from '../../services/providerAIService';
import ProviderAIDebugPanel from './ProviderAIDebugPanel';

const QUICK_CHIPS = [
  'Client ka message polite aur effective kaise reply karu?',
  'Mujhe pricing kaise set karni chahiye?',
  'Profile improve kaise karu?',
];

function makeId(prefix = 'm') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProviderAIChat({ profileContext = {} }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'ai-welcome',
      author: 'assistant',
      text: 'Namaste. Main Provider AI Assistant hoon. Aap profile, pricing, aur client reply me help le sakte hain.',
    },
  ]);
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

  const updateMessage = (id, next) => {
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

  const askAssistant = async (text) => {
    const message = String(text || '').trim();
    if (!message || isLoading) return;

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

      updateMessage(loadingId, {
        text: responseData.reply || 'Assistant reply unavailable.',
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
