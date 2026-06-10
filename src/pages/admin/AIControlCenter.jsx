import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, aiAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiEye, HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';

const MATCH_FIELDS = [
  { key: 'skillMatch', label: 'Skill Match' },
  { key: 'locationDistance', label: 'Location Distance' },
  { key: 'availability', label: 'Availability' },
  { key: 'trustRating', label: 'Trust Rating' },
  { key: 'responseSpeed', label: 'Response Speed' },
  { key: 'subscriptionBoost', label: 'Subscription Boost' },
  { key: 'leadFreshness', label: 'Lead Freshness' },
  { key: 'profileCompleteness', label: 'Profile Completeness' },
];

const TRUST_FIELDS = [
  { key: 'rating', label: 'Rating' },
  { key: 'responseTime', label: 'Response Time' },
  { key: 'profileCompleteness', label: 'Profile Completeness' },
  { key: 'rejectionRate', label: 'Rejection Rate' },
  { key: 'verificationStatus', label: 'Verification Status' },
  { key: 'fraudPenalty', label: 'Fraud Penalty' },
];

const FEATURE_FIELDS = [
  { key: 'aiEnabled', label: 'Global AI Enabled' },
  { key: 'chatEnabled', label: 'Chat Assistant' },
  { key: 'profileEnabled', label: 'Profile Builder' },
  { key: 'embeddingsEnabled', label: 'Vector Embeddings' },
  { key: 'ocrEnabled', label: 'OCR Verification' },
  { key: 'fraudEnabled', label: 'Fraud Detection / AI Review' },
];


const DEFAULT_PROMPT_FORM = {
  key: '',
  role: 'system',
  template: '',
  temperature: 0.2,
  maxTokens: 700,
};

const DEFAULT_SYNONYM_FORM = {
  canonicalSkillId: '',
  label: '',
  normalizedLabel: '',
  locale: 'en',
  status: 'active',
};

const OCR_TEST_OPTIONS = [
  { value: 'text', label: 'OCR Text' },
  { value: 'document', label: 'OCR Document' },
  { value: 'labels', label: 'Label Detection' },
];

const toInputValueMap = (fields, source = {}) => {
  const output = {};
  fields.forEach((field) => {
    output[field.key] = source[field.key] !== null && source[field.key] !== undefined
      ? String(source[field.key])
      : '';
  });
  return output;
};

const toNumericPayload = (source = {}) => {
  const output = {};
  Object.entries(source).forEach(([key, value]) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      output[key] = parsed;
    }
  });
  return output;
};

const extractSkillOptions = (payload = {}) => {
  const categories = payload.categories || payload.items || payload.data || [];
  if (!Array.isArray(categories)) return [];

  const options = [];
  categories.forEach((category) => {
    const skills = Array.isArray(category.skills) ? category.skills : [];
    skills.forEach((skill) => {
      if (!skill?._id) return;
      options.push({
        id: String(skill._id),
        label: `${skill.name || 'Unnamed'} (${category.name || 'Category'})`,
      });
    });
  });

  return options;
};

const formatFileSize = (bytes = 0) => {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < (1024 * 1024)) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const AdminAIControlCenter = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [matchWeights, setMatchWeights] = useState(toInputValueMap(MATCH_FIELDS));
  const [trustWeights, setTrustWeights] = useState(toInputValueMap(TRUST_FIELDS));
  const [featureSettings, setFeatureSettings] = useState(toInputValueMap(FEATURE_FIELDS));


  const [promptTemplates, setPromptTemplates] = useState([]);
  const [promptForm, setPromptForm] = useState(DEFAULT_PROMPT_FORM);
  const [editingPromptId, setEditingPromptId] = useState('');

  const [skillOptions, setSkillOptions] = useState([]);
  const [skillSynonyms, setSkillSynonyms] = useState([]);
  const [synonymForm, setSynonymForm] = useState(DEFAULT_SYNONYM_FORM);

  const [fraudQueue, setFraudQueue] = useState([]);
  const [ocrQueue, setOcrQueue] = useState([]);
  const [usageSummary, setUsageSummary] = useState({
    totalRequests: 0,
    totalCostUsd: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
  });
  const [usageByFeature, setUsageByFeature] = useState([]);
  const [demandSnapshots, setDemandSnapshots] = useState([]);

  // Telemetry Log States
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterFeature, setLogFilterFeature] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('');
  const [logFilterRole, setLogFilterRole] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const { data } = await adminAPI.getAIUsageLogs({
        page,
        limit: 15,
        feature: logFilterFeature || undefined,
        status: logFilterStatus || undefined,
        role: logFilterRole || undefined,
      });
      if (data?.success) {
        setLogs(data.items || []);
        setLogsTotal(data.total || 0);
        setLogsPage(data.page || 1);
        setLogsPages(data.pages || 1);
      }
    } catch (error) {
      console.error('Failed to load AI usage logs', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [logFilterFeature, logFilterStatus, logFilterRole]);

  const [ocrTestType, setOcrTestType] = useState('text');
  const [ocrTestFile, setOcrTestFile] = useState(null);
  const [ocrTesting, setOcrTesting] = useState(false);
  const [ocrTestResult, setOcrTestResult] = useState(null);
  const [ocrTestError, setOcrTestError] = useState('');

  const activePrompt = useMemo(
    () => promptTemplates.find((item) => item._id === editingPromptId) || null,
    [promptTemplates, editingPromptId]
  );

  const fetchAll = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const [
        matchRes,
        trustRes,
        promptRes,
        synonymRes,
        fraudRes,
        ocrRes,
        usageRes,
        demandRes,
        skillsRes,
        featureRes,
      ] = await Promise.all([
        adminAPI.getAIMatchWeights(),
        adminAPI.getAITrustWeights(),
        adminAPI.getPromptTemplates(),
        adminAPI.getSkillSynonyms(),
        adminAPI.getFraudQueue(),
        adminAPI.getOcrReviewQueue(),
        adminAPI.getAIUsageDashboard(),
        adminAPI.getDemandSnapshots(),
        adminAPI.getSkillCategories(),
        adminAPI.getAIFeatureSettings(),
      ]);

      setMatchWeights(toInputValueMap(MATCH_FIELDS, matchRes.data?.weights || {}));
      setTrustWeights(toInputValueMap(TRUST_FIELDS, trustRes.data?.weights || {}));
      setFeatureSettings(toInputValueMap(FEATURE_FIELDS, featureRes.data?.settings || {}));

      setPromptTemplates(promptRes.data?.items || []);
      setSkillSynonyms(synonymRes.data?.items || []);
      setFraudQueue(fraudRes.data?.items || []);
      setOcrQueue(ocrRes.data?.items || []);
      setUsageSummary(usageRes.data?.summary || usageSummary);
      setUsageByFeature(usageRes.data?.byFeature || []);
      setDemandSnapshots(demandRes.data?.items || []);
      setSkillOptions(extractSkillOptions(skillsRes.data || {}));
      
      // Load recent logs
      fetchLogs(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load AI control center');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const saveMatchWeights = async () => {
    try {
      await adminAPI.updateAIMatchWeights(toNumericPayload(matchWeights));
      toast.success('Match weights updated');
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update match weights');
    }
  };

  const saveTrustWeights = async () => {
    try {
      await adminAPI.updateAITrustWeights(toNumericPayload(trustWeights));
      toast.success('Trust weights updated');
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update trust weights');
    }
  };

  const saveFeatureSettings = async () => {
    try {
      await adminAPI.updateAIFeatureSettings(toNumericPayload(featureSettings));
      toast.success('AI feature settings updated');
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update feature settings');
    }
  };


  const submitPrompt = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...promptForm,
        temperature: Number(promptForm.temperature),
        maxTokens: Number(promptForm.maxTokens),
      };

      if (editingPromptId) {
        await adminAPI.updatePromptTemplate(editingPromptId, payload);
        toast.success('Prompt template updated');
      } else {
        await adminAPI.createPromptTemplate(payload);
        toast.success('Prompt template created');
      }

      setPromptForm(DEFAULT_PROMPT_FORM);
      setEditingPromptId('');
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save prompt template');
    }
  };

  const editPrompt = (item) => {
    setEditingPromptId(item._id);
    setPromptForm({
      key: item.key || '',
      role: item.role || 'system',
      template: item.template || '',
      temperature: Number(item.temperature || 0.2),
      maxTokens: Number(item.maxTokens || 700),
    });
  };

  const submitSynonym = async (event) => {
    event.preventDefault();
    try {
      await adminAPI.createSkillSynonym({
        ...synonymForm,
        normalizedLabel: synonymForm.normalizedLabel || synonymForm.label,
      });
      toast.success('Skill synonym added');
      setSynonymForm(DEFAULT_SYNONYM_FORM);
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add skill synonym');
    }
  };

  const updateSynonymStatus = async (id, status) => {
    try {
      await adminAPI.updateSkillSynonym(id, { status });
      toast.success('Synonym updated');
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update synonym');
    }
  };

  const removeSynonym = async (id) => {
    if (!window.confirm('Delete this synonym?')) return;
    try {
      await adminAPI.deleteSkillSynonym(id);
      toast.success('Synonym deleted');
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete synonym');
    }
  };

  const takeOcrAction = async (id, status) => {
    try {
      await adminAPI.updateOcrReviewDecision(id, {
        status,
        reasons: [`Decision set from admin UI: ${status}`],
      });
      toast.success(`OCR decision updated: ${status}`);
      fetchAll(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update OCR decision');
    }
  };

  const runOcrTest = async (event) => {
    event.preventDefault();

    if (!ocrTestFile) {
      toast.error('Please choose an image file to scan.');
      return;
    }

    const formData = new FormData();
    formData.append('image', ocrTestFile);

    setOcrTesting(true);
    setOcrTestError('');
    setOcrTestResult(null);

    try {
      let response;
      if (ocrTestType === 'document') {
        response = await aiAPI.ocrDocument(formData);
      } else if (ocrTestType === 'labels') {
        response = await aiAPI.ocrLabels(formData);
      } else {
        response = await aiAPI.ocrText(formData);
      }

      setOcrTestResult(response.data?.data || {});
      toast.success('OCR scan completed successfully.');
    } catch (error) {
      const message = error.response?.data?.message || 'OCR scan failed';
      setOcrTestError(message);
      toast.error(message);
    } finally {
      setOcrTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading AI control center..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Operations Center</h1>
          <p className="text-gray-500 mt-1">Manage weights, prompts, review queues, and usage telemetry.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">AI Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Number(usageSummary.totalRequests || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">AI Cost (USD)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${Number(usageSummary.totalCostUsd || 0).toFixed(4)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Token Volume</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Number(usageSummary.totalTokens || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Avg Latency</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(Number(usageSummary.avgLatencyMs || 0))} ms</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Match Weights</h2>
            <button type="button" onClick={saveMatchWeights} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Save</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {MATCH_FIELDS.map((field) => (
              <label key={field.key} className="text-sm text-gray-600">
                {field.label}
                <input
                  type="number"
                  value={matchWeights[field.key]}
                  onChange={(e) => setMatchWeights((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Trust Weights</h2>
            <button type="button" onClick={saveTrustWeights} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Save</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {TRUST_FIELDS.map((field) => (
              <label key={field.key} className="text-sm text-gray-600">
                {field.label}
                <input
                  type="number"
                  value={trustWeights[field.key]}
                  onChange={(e) => setTrustWeights((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Feature Toggles</h2>
          <button type="button" onClick={saveFeatureSettings} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Save</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURE_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{field.label}</span>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-bold ${featureSettings[field.key] === '1' ? 'text-green-600' : 'text-red-500'}`}>
                  {featureSettings[field.key] === '1' ? 'ENABLED' : 'DISABLED'}
                </span>
                <button
                  type="button"
                  onClick={() => setFeatureSettings((prev) => ({ ...prev, [field.key]: prev[field.key] === '1' ? '0' : '1' }))}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${featureSettings[field.key] === '1' ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`block w-3.5 h-3.5 bg-white rounded-full shadow absolute top-0.75 transition-transform duration-200 ${featureSettings[field.key] === '1' ? 'translate-x-5.5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Prompt Templates</h2>


          <form onSubmit={submitPrompt} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={promptForm.key}
                onChange={(e) => setPromptForm((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="Template key"
                className="px-3 py-2 border border-gray-200 rounded-xl"
                required
              />
              <select
                value={promptForm.role}
                onChange={(e) => setPromptForm((prev) => ({ ...prev, role: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl"
              >
                <option value="system">system</option>
                <option value="provider">provider</option>
                <option value="recruiter">recruiter</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <textarea
              value={promptForm.template}
              onChange={(e) => setPromptForm((prev) => ({ ...prev, template: e.target.value }))}
              placeholder="Prompt template text"
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl"
              required
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">
                Temperature
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={promptForm.temperature}
                  onChange={(e) => setPromptForm((prev) => ({ ...prev, temperature: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </label>
              <label className="text-sm text-gray-600">
                Max Tokens
                <input
                  type="number"
                  min="32"
                  value={promptForm.maxTokens}
                  onChange={(e) => setPromptForm((prev) => ({ ...prev, maxTokens: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white">
                {editingPromptId ? 'Update Template' : 'Create Template'}
              </button>
              {editingPromptId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPromptId('');
                    setPromptForm(DEFAULT_PROMPT_FORM);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 space-y-2 max-h-72 overflow-auto pr-1">
            {promptTemplates.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => editPrompt(item)}
                className={`w-full text-left border rounded-xl p-3 ${activePrompt?._id === item._id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-white'}`}
              >
                <p className="font-medium text-gray-900">{item.key}</p>
                <p className="text-xs text-gray-500">role: {item.role} | version: {item.version || 1} | active: {item.isActive ? 'yes' : 'no'}</p>
              </button>
            ))}
            {promptTemplates.length === 0 && <p className="text-sm text-gray-500">No prompt templates found.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skill Synonyms</h2>

          <form onSubmit={submitSynonym} className="space-y-3 mb-4">
            <select
              value={synonymForm.canonicalSkillId}
              onChange={(e) => setSynonymForm((prev) => ({ ...prev, canonicalSkillId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl"
              required
            >
              <option value="">Select canonical skill</option>
              {skillOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={synonymForm.label}
                onChange={(e) => setSynonymForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Label"
                className="px-3 py-2 border border-gray-200 rounded-xl"
                required
              />
              <input
                value={synonymForm.normalizedLabel}
                onChange={(e) => setSynonymForm((prev) => ({ ...prev, normalizedLabel: e.target.value }))}
                placeholder="Normalized label (optional)"
                className="px-3 py-2 border border-gray-200 rounded-xl"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={synonymForm.locale}
                onChange={(e) => setSynonymForm((prev) => ({ ...prev, locale: e.target.value }))}
                placeholder="Locale (ex: en, hi)"
                className="px-3 py-2 border border-gray-200 rounded-xl"
              />
              <select
                value={synonymForm.status}
                onChange={(e) => setSynonymForm((prev) => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Add Synonym</button>
          </form>

          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {skillSynonyms.map((item) => (
              <div key={item._id} className="border border-gray-100 rounded-xl p-3">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">normalized: {item.normalizedLabel} | locale: {item.locale} | status: {item.status}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => updateSynonymStatus(item._id, item.status === 'active' ? 'inactive' : 'active')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700"
                  >
                    Toggle Status
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSynonym(item._id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {skillSynonyms.length === 0 && <p className="text-sm text-gray-500">No skill synonyms found.</p>}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Fraud Review Queue</h2>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {fraudQueue.map((item) => (
              <div key={item._id} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">{item.reason}</p>
                <p className="text-xs text-gray-500">severity: {item.severity} | status: {item.status}</p>
                <p className="text-xs text-gray-500">user: {item.userId}</p>
              </div>
            ))}
            {fraudQueue.length === 0 && <p className="text-sm text-gray-500">No open fraud flags.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">OCR Review Queue</h2>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {ocrQueue.map((item) => (
              <div key={item._id} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">{item.documentType} | {item.status}</p>
                <p className="text-xs text-gray-500">provider: {item.providerId}</p>
                <p className="text-xs text-gray-500">confidence: {Number(item.confidence || 0).toFixed(2)}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" onClick={() => takeOcrAction(item._id, 'verified')} className="px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700">Verify</button>
                  <button type="button" onClick={() => takeOcrAction(item._id, 'rejected')} className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700">Reject</button>
                  <button type="button" onClick={() => takeOcrAction(item._id, 'needs_review')} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700">Needs Review</button>
                </div>
              </div>
            ))}
            {ocrQueue.length === 0 && <p className="text-sm text-gray-500">No OCR review items.</p>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">OCR Scan Tester</h2>
            <p className="text-sm text-gray-500 mt-1">Upload a document image, run OCR, and inspect the extracted result instantly.</p>
          </div>
        </div>

        <form onSubmit={runOcrTest} className="grid lg:grid-cols-4 gap-3 items-end">
          <label className="text-sm text-gray-600 lg:col-span-1">
            Scan type
            <select
              value={ocrTestType}
              onChange={(e) => setOcrTestType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl"
            >
              {OCR_TEST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600 lg:col-span-2">
            Upload document image
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setOcrTestFile(file);
                setOcrTestError('');
                setOcrTestResult(null);
              }}
              className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700"
            />
            <p className="text-xs text-gray-500 mt-1">Allowed: JPG, PNG, WEBP. Max size is controlled by backend upload limit.</p>
          </label>

          <button
            type="submit"
            disabled={ocrTesting || !ocrTestFile}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {ocrTesting ? 'Scanning...' : 'Upload & Scan'}
          </button>
        </form>

        {ocrTestFile && (
          <p className="text-sm text-gray-600 mt-3">
            Selected file: <span className="font-medium text-gray-800">{ocrTestFile.name}</span> ({formatFileSize(ocrTestFile.size)})
          </p>
        )}

        {ocrTestError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ocrTestError}
          </div>
        )}

        {ocrTestResult && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">OCR Output Preview</p>
              {typeof ocrTestResult.fullText === 'string' && ocrTestResult.fullText.trim() ? (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-44 overflow-auto">{ocrTestResult.fullText}</pre>
              ) : (
                <p className="text-sm text-gray-600">No full text returned for this scan type.</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Raw Response</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-auto">{JSON.stringify(ocrTestResult, null, 2)}</pre>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Usage by Feature</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Feature</th>
                <th className="py-2 pr-4">Requests</th>
                <th className="py-2 pr-4">Cost (USD)</th>
                <th className="py-2">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {usageByFeature.map((item) => (
                <tr key={item._id || 'unknown'} className="border-b border-gray-50 text-gray-700">
                  <td className="py-2 pr-4">{item._id || 'unknown'}</td>
                  <td className="py-2 pr-4">{Number(item.requests || 0).toLocaleString()}</td>
                  <td className="py-2 pr-4">${Number(item.costUsd || 0).toFixed(4)}</td>
                  <td className="py-2">{Number(item.tokens || 0).toLocaleString()}</td>
                </tr>
              ))}
              {usageByFeature.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={4}>No usage records available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Demand Snapshots</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Skill</th>
                <th className="py-2 pr-4">City</th>
                <th className="py-2 pr-4">Demand</th>
                <th className="py-2 pr-4">Supply</th>
                <th className="py-2 pr-4">Unmet</th>
                <th className="py-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {demandSnapshots.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-2 pr-4">{item.skill}</td>
                  <td className="py-2 pr-4">{item.city}</td>
                  <td className="py-2 pr-4">{item.demandCount}</td>
                  <td className="py-2 pr-4">{item.supplyCount}</td>
                  <td className="py-2 pr-4">{item.unmetDemandScore}</td>
                  <td className="py-2">{Number(item.confidence || 0).toFixed(2)}</td>
                </tr>
              ))}
              {demandSnapshots.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={6}>No demand snapshots available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI API Logs & Telemetry</h2>
            <p className="text-sm text-gray-500 mt-1">Review live executions, model tokens, costs, and inspect payloads.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Feature Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Feature</span>
              <select
                value={logFilterFeature}
                onChange={(e) => {
                  setLogFilterFeature(e.target.value);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="">All Features</option>
                <option value="provider_profile_builder">Profile Builder</option>
                <option value="recruiter_job_description">Job Description</option>
                <option value="provider_pricing_suggestion">Pricing Suggestion</option>
                <option value="provider_dashboard_insights">Dashboard Insights</option>
                <option value="role_aware_chat_assistant">Chat Assistant</option>
                <option value="fraud_cluster_review">Fraud Review</option>
                <option value="boost_suggestion_copy">Boost Copy</option>
                <option value="ai.search_interpret">Search Interpretation</option>
                <option value="provider_profile_embedding">Profile Embedding</option>
                <option value="recruiter_hire_history_embedding">Recruiter History Embedding</option>
                <option value="search_query_embedding">Search Query Embedding</option>
                <option value="job_intent_embedding">Job Intent Embedding</option>
                <option value="embedding_generic">Generic Embedding</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Status</span>
              <select
                value={logFilterStatus}
                onChange={(e) => {
                  setLogFilterStatus(e.target.value);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="fallback">Fallback</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Role</span>
              <select
                value={logFilterRole}
                onChange={(e) => {
                  setLogFilterRole(e.target.value);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="">All Roles</option>
                <option value="recruiter">Recruiter</option>
                <option value="provider">Provider</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(logFilterFeature || logFilterStatus || logFilterRole) && (
              <button
                type="button"
                onClick={() => {
                  setLogFilterFeature('');
                  setLogFilterStatus('');
                  setLogFilterRole('');
                }}
                className="mt-5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {logsLoading ? (
          <div className="py-8 flex items-center justify-center">
            <LoadingSpinner size="md" text="Loading logs..." />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-auto border border-gray-100 rounded-2xl">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 bg-gray-50/70 border-b border-gray-100">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">User & Role</th>
                    <th className="py-3 px-4 font-semibold">Feature</th>
                    <th className="py-3 px-4 font-semibold">Model / Provider</th>
                    <th className="py-3 px-4 font-semibold">Latency / Tokens</th>
                    <th className="py-3 px-4 font-semibold">Est. Cost</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 text-gray-700 transition-colors duration-150">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col text-left">
                          {item.userId ? (
                            <>
                              <span className="font-medium text-gray-800 text-xs">{item.userId.name || 'No Name'}</span>
                              <span className="text-[10px] text-gray-400">{item.userId.email}</span>
                            </>
                          ) : (
                            <span className="font-medium text-gray-400 text-xs italic">System</span>
                          )}
                          <span className="text-[9px] uppercase font-bold text-indigo-500/80 mt-0.5">{item.role}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded-md border border-slate-200/50 max-w-[160px] truncate" title={item.feature}>
                          {item.feature}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-semibold text-gray-800 capitalize">{item.provider}</span>
                          <span className="text-[10px] text-gray-500 truncate max-w-[140px]" title={item.model}>{item.model || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-medium text-gray-800">{item.latencyMs ? `${Math.round(item.latencyMs)} ms` : 'N/A'}</span>
                          <span className="text-[10px] text-gray-400">{item.totalTokens ? `${item.totalTokens.toLocaleString()} tokens` : '0 tokens'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-gray-800">
                        ${Number(item.estimatedCostUsd || 0).toFixed(6)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          item.status === 'success'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : item.status === 'fallback'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors duration-150 font-medium"
                        >
                          <HiEye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td className="py-6 px-4 text-center text-gray-500" colSpan={8}>
                        No telemetry logs matched the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {logsPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 px-1">
                <span className="text-xs text-gray-500">
                  Showing page <span className="font-semibold text-gray-700">{logsPage}</span> of{' '}
                  <span className="font-semibold text-gray-700">{logsPages}</span> | Total{' '}
                  <span className="font-semibold text-gray-700">{logsTotal}</span> logs
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={logsPage <= 1}
                    onClick={() => fetchLogs(logsPage - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-55 disabled:hover:bg-white text-gray-600 transition-colors"
                  >
                    <HiChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    disabled={logsPage >= logsPages}
                    onClick={() => fetchLogs(logsPage + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-55 disabled:hover:bg-white text-gray-600 transition-colors"
                  >
                    <HiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 text-left">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-200"
            >
              <HiX className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">AI Execution Details</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  selectedLog.status === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : selectedLog.status === 'fallback'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {selectedLog.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 font-mono">{selectedLog._id}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Timestamp</span>
                <p className="text-xs font-medium text-gray-800 mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Feature</span>
                <p className="text-xs font-mono font-semibold text-indigo-600 mt-0.5 truncate" title={selectedLog.feature}>{selectedLog.feature}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Provider & Model</span>
                <p className="text-xs font-medium text-gray-800 mt-0.5 truncate" title={`${selectedLog.provider} / ${selectedLog.model}`}>
                  <span className="capitalize">{selectedLog.provider}</span> ({selectedLog.model || 'N/A'})
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Latency</span>
                <p className="text-xs font-medium text-gray-800 mt-0.5">{selectedLog.latencyMs ? `${Math.round(selectedLog.latencyMs)} ms` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estimated Cost</span>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">${Number(selectedLog.estimatedCostUsd || 0).toFixed(6)}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tokens</span>
                <p className="text-xs font-medium text-gray-800 mt-0.5">
                  In: {selectedLog.inputTokens?.toLocaleString() || 0} | Out: {selectedLog.outputTokens?.toLocaleString() || 0}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Executing User (Role)</span>
                <p className="text-xs font-medium text-gray-800 mt-0.5 truncate">
                  {selectedLog.userId ? (
                    `${selectedLog.userId.name || 'Unnamed'} (${selectedLog.userId.email})`
                  ) : (
                    'System'
                  )}{' '}
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">[{selectedLog.role}]</span>
                </p>
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Execution Error</span>
                <p className="text-sm font-medium text-red-800 mt-1 whitespace-pre-wrap font-mono">{selectedLog.errorMessage}</p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Raw Payload & Telemetry Metadata</span>
              <pre className="mt-2 text-xs bg-gray-950 text-gray-200 p-4 rounded-xl overflow-x-auto max-h-96 font-mono whitespace-pre-wrap">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIControlCenter;
