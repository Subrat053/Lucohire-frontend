export default function BoostSuggestionCard({ suggestion }) {
  if (!suggestion?.message) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
      <p className="text-sm font-semibold text-blue-800 mb-1">AI Boost Suggestion</p>
      <p className="text-sm text-blue-700">{suggestion.message}</p>
      {suggestion.city && suggestion.skill && (
        <p className="text-xs text-blue-600 mt-1">
          {suggestion.skill} · {suggestion.city}
        </p>
      )}
    </div>
  );
}
