import useTranslation from "../../hooks/useTranslation";
export default function ShortlistedCandidates() {
  const {
    t
  } = useTranslation();

  return (
    <div className="p-6 bg-[#F8FAFF] min-h-screen">
      <h1 className="text-2xl font-bold text-[#081B3A]">{t("Shortlisted Candidates")}</h1>
      <p className="text-gray-500 mt-1">{t("Candidates you shortlisted will appear here.")}</p>
    </div>
  );
}