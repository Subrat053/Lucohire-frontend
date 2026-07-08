export default function ProviderAIDebugPanel({ debugState }) {
  if (!debugState) return null;

  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
      <p className="font-semibold">AI Debug</p>
      <p>Status: {debugState.lastApiStatus || '-'}</p>
      <p>Intent: {debugState.lastIntent || '-'}</p>
      <p>Skill: {debugState.lastSkill || '-'}</p>
      <p>City: {debugState.lastCity || '-'}</p>
      <p>LLM Used: {debugState.usedLLM ? 'Yes' : 'No'}</p>
      {debugState.fallbackReason ? <p>Fallback: {debugState.fallbackReason}</p> : null}
    </div>
  );
}
