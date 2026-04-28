import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiSave, HiArrowLeft, HiBriefcase,
  HiLocationMarker, HiCurrencyRupee, HiDocumentText,
  HiCheckCircle, HiUsers,
} from 'react-icons/hi';
import { FaBullhorn } from 'react-icons/fa';
import { recruiterAPI } from '../../services/api';
import SkillPicker from '../../components/common/SkillPicker';
import toast from 'react-hot-toast';
import LocationSearch from '../../components/LocationSearch';

/* ── Illustration ─────────────────────────────────────────────────── */
const PostJobIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32 drop-shadow-xl">
    <rect x="10" y="30" width="140" height="110" rx="12" fill="white" fillOpacity="0.2" />
    <rect x="24" y="46" width="112" height="12" rx="4" fill="white" fillOpacity="0.5" />
    <rect x="24" y="64" width="80" height="8" rx="3" fill="white" fillOpacity="0.35" />
    <rect x="24" y="78" width="60" height="8" rx="3" fill="white" fillOpacity="0.25" />
    <rect x="24" y="92" width="100" height="8" rx="3" fill="white" fillOpacity="0.2" />
    <rect x="24" y="106" width="70" height="8" rx="3" fill="white" fillOpacity="0.15" />
    <circle cx="165" cy="55" r="30" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
    <path d="M152 55 L162 65 L178 45" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="126" r="8" fill="#fbbf24" />
    <path d="M20 126 L23 129 L29 123" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionCard = ({ icon: Icon, iconBg, iconColor, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <h2 className="text-base font-extrabold text-gray-900 mb-5 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
    </h2>
    {children}
  </div>
);

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm bg-white transition';

const Label = ({ text, required }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
    {text} {required && <span className="text-red-500">*</span>}
  </label>
);

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMeta, setAiMeta] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [form, setForm] = useState({
    title: '', skill: '', city: '', budgetMin: '', budgetMax: '',
    budgetType: 'negotiable', description: '', requirements: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleGenerateAI = async () => {
    const prompt = aiPrompt.trim() || form.title.trim() || form.skill.trim() || form.description.trim();
    if (!prompt) {
      toast.error('Add a short requirement prompt first');
      return;
    }

    setAiGenerating(true);
    try {
      const { data } = await recruiterAPI.generateJobDescription({
        prompt,
        skill: form.skill,
        city: form.city,
        budgetMin: form.budgetMin ? parseInt(form.budgetMin, 10) : 0,
        budgetMax: form.budgetMax ? parseInt(form.budgetMax, 10) : 0,
        budgetType: form.budgetType,
      });

      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.fullDescription || prev.description,
        requirements: Array.isArray(data.duties) ? data.duties.join(', ') : prev.requirements,
        budgetMin: data.suggestedBudget?.min ? String(data.suggestedBudget.min) : prev.budgetMin,
        budgetMax: data.suggestedBudget?.max ? String(data.suggestedBudget.max) : prev.budgetMax,
      }));
      setAiMeta({ status: data.aiStatus, model: data.model });
      toast.success('AI draft generated. Review and edit before posting.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.skill || !form.city.trim() || !form.description.trim()) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        budgetMin: form.budgetMin ? parseInt(form.budgetMin) : 0,
        budgetMax: form.budgetMax ? parseInt(form.budgetMax) : 0,
        aiGenerated: aiMeta ? { status: aiMeta.status, model: aiMeta.model || '' } : null,
        requirements: form.requirements
          ? form.requirements.split(',').map((r) => r.trim()).filter(Boolean)
          : [],
      };
      const { data } = await recruiterAPI.postJob(payload);
      setMatchCount(data.matchedCount || 0);
      setSubmitted(true);
      toast.success(`Job posted! ${data.matchedCount || 0} providers notified.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#f8f9ff 100%)' }}>
        <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <HiCheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Job Posted!</h2>
          <p className="text-gray-500 text-sm mb-2">
            Your requirement is live and <span className="font-bold text-blue-600">{matchCount} provider{matchCount !== 1 ? 's' : ''}</span> have been notified via WhatsApp.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setSubmitted(false); setForm({ title: '', skill: '', city: '', budgetMin: '', budgetMax: '', budgetType: 'negotiable', description: '', requirements: '' }); }}
              className="flex-1 border-2 border-blue-200 text-blue-700 font-bold py-2.5 rounded-xl hover:bg-blue-50 transition text-sm"
            >
              Post Another
            </button>
            <button
              onClick={() => navigate('/recruiter/dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#f8f9ff 60%,#fafafa 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header banner ─────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#4f46e5 60%,#7c3aed 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <button
              onClick={() => navigate('/recruiter/dashboard')}
              className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-3 transition"
            >
              <HiArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-extrabold text-white">Post a Job</h1>
            <p className="text-blue-100 text-sm mt-1">Matching providers will be notified automatically via WhatsApp.</p>
          </div>
          <div className="relative z-10 shrink-0">
            <PostJobIllustration />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-blue-100 p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">AI Job Description Helper</p>
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Maid chahiye for morning cleaning in Andheri"
                className={inputCls}
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiGenerating}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {aiGenerating ? 'Generating…' : 'Generate with AI'}
              </button>
            </div>
            {aiMeta && (
              <p className="mt-2 text-xs text-blue-700">Status: {aiMeta.status} {aiMeta.model ? `• Model: ${aiMeta.model}` : ''}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 grid-cols-2 gap-4">
            {/* ── Job Details ─────────────────────────────────────────── */}
            <SectionCard icon={HiBriefcase} iconColor="text-blue-500" title="Job Details">
              <div className="space-y-4">
                <div>
                  <Label text="Job Title" required />
                  <input
                    name="title"
                    value={form.title}
                    onChange={set('title')}
                    placeholder="e.g. Need a driver for daily commute"
                    className={inputCls}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label text="Skill Required" required />
                    <SkillPicker
                      selectedSkills={form.skill ? [form.skill] : []}
                      onChange={(skills) => setForm({ ...form, skill: skills[skills.length - 1] || '' })}
                      maxSkills={1}
                      placeholder="Pick one skill…"
                    />
                  </div>
                  <div>
                    <Label text="City" required />
                    <LocationSearch
                      value={form.city}
                      onChange={(value) => setForm({ ...form, city: value })}
                      onSelect={(item) => setForm({ ...form, city: item?.name || form.city })}
                      placeholder="e.g. Delhi"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Budget ──────────────────────────────────────────────── */}
            <SectionCard icon={HiCurrencyRupee} iconColor="text-green-500" title="Budget">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label text="Min Budget (₹)" />
                  <input
                    type="number"
                    name="budgetMin"
                    value={form.budgetMin}
                    onChange={set('budgetMin')}
                    placeholder="0"
                    min="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label text="Max Budget (₹)" />
                  <input
                    type="number"
                    name="budgetMax"
                    value={form.budgetMax}
                    onChange={set('budgetMax')}
                    placeholder="0"
                    min="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label text="Budget Type" />
                  <select
                    name="budgetType"
                    value={form.budgetType}
                    onChange={set('budgetType')}
                    className={inputCls}
                  >
                    <option value="negotiable">Negotiable</option>
                    <option value="fixed">Fixed</option>
                    <option value="hourly">Hourly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          </div>
          {/* ── Description ─────────────────────────────────────────── */}
          <SectionCard icon={HiDocumentText} iconColor="text-purple-500" title="Description & Requirements">
            <div className="space-y-4">
              <div>
                <Label text="Job Description" required />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Describe your requirement in detail…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <Label text="Requirements (comma separated)" />
                <input
                  name="requirements"
                  value={form.requirements}
                  onChange={set('requirements')}
                  placeholder="e.g. Valid license, 3+ years experience, Must have own tools"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple requirements with commas</p>
              </div>
            </div>
          </SectionCard>

          {/* ── Submit ──────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/recruiter/dashboard')}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <FaBullhorn className="w-4 h-4" />
              {loading ? 'Posting…' : 'Post Job & Notify Providers'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
