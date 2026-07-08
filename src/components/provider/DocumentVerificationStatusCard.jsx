export default function DocumentVerificationStatusCard({ verification }) {
  if (!verification) return null;

  const status = String(verification.status || 'pending').toLowerCase();
  const colorClass =
    status === 'verified'
      ? 'bg-green-50 border-green-200 text-green-800'
      : status === 'rejected'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-amber-50 border-amber-200 text-amber-800';

  return (
    <div className={`rounded-xl border p-3 text-sm ${colorClass}`}>
      <p className="font-semibold mb-1">Document Verification</p>
      <p className="capitalize">Status: {status.replace('_', ' ')}</p>
      {verification.reasons?.length > 0 && (
        <p className="text-xs mt-1">{verification.reasons.join(', ')}</p>
      )}
      {typeof verification.confidence === 'number' && (
        <p className="text-xs mt-1">Confidence: {Math.round(verification.confidence * 100)}%</p>
      )}
    </div>
  );
}
