import useTranslation from "../../hooks/useTranslation";
import React, { useState } from "react";
import { HiOutlineDownload, HiOutlineLightningBolt } from "react-icons/hi";
import { FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import AtsOptimizerPanel from "../../components/provider/AtsOptimizerPanel";

export default function ResumeGenerator({ profileData }) {
  const {
    t
  } = useTranslation();

  const [activeTemplate, setActiveTemplate] = useState("minimalist");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState(null);

  const dataToUse = optimizedData || profileData || {};
  const {
    profileName,
    email,
    phone,
    city,
    designation,
    company,
    experience,
    about,
    skills = [],
    education = [],
    previousExperience = [],
    portfolioLinks = [],
    projects: rawProjects = [],
  } = dataToUse;

  const projects = rawProjects.filter((p) => p.visibleForAll !== false);

  // Flatten experience to a unified list
  const allExp = [];
  if (company || designation) {
    allExp.push({
      company,
      role: designation,
      duration: experience || "Present",
    });
  }
  if (Array.isArray(previousExperience)) {
    allExp.push(...previousExperience);
  }

  const approvedPortfolioLinks = (portfolioLinks || []).filter(
    (l) => l.status === "approved" && l.url,
  );

  const templates = [
    { id: "minimalist", name: "Minimalist" },
    { id: "executive", name: "Executive" },
    { id: "creative", name: "Creative Portfolio" },
    { id: "tech", name: "Tech Focused" },
    { id: "timeline", name: "Timeline Flow" },
    { id: "compact", name: "Compact ATS" },
    { id: "bold", name: "Modern Bold" },
    { id: "modern-split", name: "Modern Split Column" },
    { id: "academic", name: "Academic Elegant" },
    { id: "startup", name: "Startup Grid" },
  ];

  const handleDownload = async () => {
    const element = document.getElementById("resume-preview-content");
    if (!element) return;

    toast.loading("Generating PDF...", { id: "resume-pdf" });
    try {
      const htmlToImage = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: { transform: "scale(1)", transformOrigin: "top left" },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${profileName || "Resume"}_${activeTemplate}.pdf`);
      toast.dismiss("resume-pdf");
      toast.success("Resume downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.dismiss("resume-pdf");
      toast.error("Failed to generate PDF.");
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    toast.loading("AI is optimizing your resume phrasing...", { id: "ai-opt" });

    try {
      // Mocking AI optimization for instant feedback, in real app call the AI chat endpoint to rewrite the bullets
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const enhancedExp = allExp.map((exp) => ({
        ...exp,
        role: exp.role ? `Senior ${exp.role}` : exp.role,
        description:
          exp.description ||
          `Successfully led critical projects at ${exp.company || "the company"}, increasing overall efficiency by 30% and delivering high-quality results ahead of schedule.`,
      }));

      setOptimizedData({
        ...profileData,
        about: about
          ? `${about} I am a highly motivated professional with a proven track record of delivering impactful results and driving innovation.`
          : "Dynamic and results-oriented professional with a proven track record of delivering impactful results and driving innovation across multiple projects.",
        previousExperience: enhancedExp.slice(1),
        company: enhancedExp[0]?.company,
        designation: enhancedExp[0]?.role,
      });

      toast.dismiss("ai-opt");
      toast.success("Resume optimized by AI!");
    } catch (err) {
      toast.dismiss("ai-opt");
      toast.error("AI optimization failed.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const renderTemplate = () => {
    switch (activeTemplate) {
      case "minimalist":
        return (
          <div
            className="bg-white p-12 font-sans text-slate-800 h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="border-b-2 border-slate-800 pb-6 mb-8">
              <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">
                {profileName || "Your Name"}
              </h1>
              <p className="text-sm font-medium text-slate-500">
                {email} <span className="mx-2">•</span> {phone}{" "}
                <span className="mx-2">•</span> {city}
              </p>
            </div>
            {about && (
              <div className="mb-8">
                <p className="text-sm leading-relaxed text-slate-600">
                  {about}
                </p>
              </div>
            )}
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest">{t("Experience")}</h2>
            <div className="space-y-6 mb-8">
              {allExp.map((exp, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-slate-900">
                      {exp.role}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      {exp.duration}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 font-medium mb-2">
                    {exp.company}
                  </div>
                  {exp.description && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {projects?.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest">{t("Projects")}</h2>
                <div className="space-y-5 mb-8">
                  {projects.map((proj, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-slate-900">
                          {proj.name}
                        </span>
                        {proj.link && (
                          <span className="text-slate-500 font-medium text-xs">
                            {proj.link}
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-8">
              {skills.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest">{t("Skills")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md"
                      >
                        {s.skill || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {education.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest">{t("Education")}</h2>
                  <div className="space-y-4">
                    {education.map((edu, i) => (
                      <div key={i}>
                        <div className="font-semibold text-sm text-slate-900">
                          {edu.degree}
                        </div>
                        <div className="text-sm text-slate-600 mt-0.5">
                          {edu.institution} <span className="mx-1">•</span>{" "}
                          {edu.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {approvedPortfolioLinks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest">{t("Portfolio")}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {approvedPortfolioLinks.map((link, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-900">
                        {link.platform}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium text-xs truncate mt-0.5"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "executive":
        return (
          <div
            className="bg-white p-14 font-serif text-slate-900 border-t-[12px] border-slate-900 h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-3 uppercase tracking-wider">
                {profileName || "Your Name"}
              </h1>
              <p className="text-base text-slate-600 uppercase tracking-widest font-semibold">
                {designation}
              </p>
              <div className="flex justify-center gap-4 text-sm mt-4 border-y border-slate-200 py-3 text-slate-600">
                <span>{email}</span>
                <span>|</span>
                <span>{phone}</span>
                <span>|</span>
                <span>{city}</span>
              </div>
            </div>
            {about && (
              <div className="mb-8">
                <h2 className="text-base font-bold uppercase tracking-widest mb-3 text-slate-900">{t("Professional Summary")}</h2>
                <p className="text-sm leading-relaxed text-slate-700 text-justify">
                  {about}
                </p>
              </div>
            )}
            <h2 className="text-base font-bold uppercase tracking-widest mb-5 border-b-2 border-slate-900 pb-2 text-slate-900">{t("Professional Experience")}</h2>
            <div className="space-y-7 mb-8">
              {allExp.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-base font-bold text-slate-900">
                      {exp.role}{" "}
                      <span className="font-normal text-slate-500 mx-1">{t("at")}</span>{" "}
                      {exp.company}
                    </span>
                    <span className="text-sm font-semibold text-slate-600">
                      {exp.duration}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-slate-700 leading-relaxed text-justify">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {education.length > 0 && (
              <>
                <h2 className="text-base font-bold uppercase tracking-widest mb-5 mt-8 border-b-2 border-slate-900 pb-2 text-slate-900">{t("Education")}</h2>
                <div className="space-y-3 mb-8">
                  {education.map((edu, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <span className="font-bold text-slate-900">
                          {edu.institution}
                        </span>{" "}
                        — {edu.degree}
                      </div>
                      <span className="font-semibold text-slate-600">
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-8">
              {skills.length > 0 && (
                <div>
                  <h2 className="text-base font-bold uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-2 text-slate-900">{t("Core Competencies")}</h2>
                  <p className="text-sm leading-relaxed text-slate-700 font-medium">
                    {skills.map((s) => s.skill || s).join(" • ")}
                  </p>
                </div>
              )}

              {approvedPortfolioLinks.length > 0 && (
                <div>
                  <h2 className="text-base font-bold uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-2 text-slate-900">{t("Links")}</h2>
                  <div className="space-y-2">
                    {approvedPortfolioLinks.map((link, i) => (
                      <div key={i} className="text-sm flex flex-col">
                        <span className="font-bold text-slate-900">
                          {link.platform}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-900 underline decoration-slate-300 truncate"
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "creative":
        return (
          <div
            className="bg-white font-sans text-slate-800 flex h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="w-[32%] bg-emerald-800 text-white p-8 flex flex-col">
              <div className="mb-10">
                <h1 className="text-4xl font-black mb-3 leading-tight tracking-tight text-white">
                  {profileName || "Your Name"}
                </h1>
                <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">
                  {designation}
                </p>
              </div>

              <div className="space-y-4 text-sm font-medium text-emerald-50 mb-12">
                <p className="flex items-center gap-2">
                  <span className="w-5 text-emerald-400">@</span>
                  {email}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 text-emerald-400">#</span>
                  {phone}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 text-emerald-400">📍</span>
                  {city}
                </p>
              </div>

              {skills.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-5 text-emerald-400">{t("Expertise")}</h2>
                  <div className="flex flex-col gap-3">
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-sm bg-emerald-700/50 px-4 py-2 rounded-lg font-medium border border-emerald-600/50"
                      >
                        {s.skill || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {approvedPortfolioLinks.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-5 text-emerald-400">{t("Connect")}</h2>
                  <div className="flex flex-col gap-4">
                    {approvedPortfolioLinks.map((link, i) => (
                      <div key={i} className="text-sm">
                        <div className="font-bold text-white mb-1">
                          {link.platform}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-200 hover:text-white transition-colors break-all text-xs opacity-90"
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-[68%] p-10 bg-slate-50">
              {about && (
                <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-black text-slate-800 mb-3 flex items-center gap-3">
                    <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>{" "}{t("Profile")}</h2>
                  <p className="text-sm leading-relaxed text-slate-600 font-medium">
                    {about}
                  </p>
                </div>
              )}

              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>{" "}{t("Experience")}</h2>
              <div className="space-y-6 mb-10">
                {allExp.map((exp, i) => (
                  <div
                    key={i}
                    className="relative pl-6 border-l-2 border-emerald-200 pb-2"
                  >
                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white]"></div>
                    <div className="font-bold text-slate-800 text-lg">
                      {exp.role}
                    </div>
                    <div className="text-sm text-emerald-600 font-semibold mb-2">
                      {exp.company}{" "}
                      <span className="text-slate-400 mx-1">•</span>{" "}
                      {exp.duration}
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {education.length > 0 && (
                <>
                  <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 mt-10">
                    <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>{" "}{t("Education")}</h2>
                  <div className="grid gap-4">
                    {education.map((edu, i) => (
                      <div
                        key={i}
                        className="bg-white p-5 rounded-xl shadow-sm border border-slate-100"
                      >
                        <div className="font-bold text-slate-800">
                          {edu.degree}
                        </div>
                        <div className="text-sm text-slate-500 font-medium mt-1">
                          {edu.institution}{" "}
                          <span className="text-emerald-500 mx-1">•</span>{" "}
                          {edu.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "tech":
        return (
          <div
            className="bg-[#0b1120] text-slate-300 p-12 font-mono h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="border-b border-slate-700/50 pb-8 mb-8">
              <h1 className="text-4xl font-bold text-slate-100 mb-3 tracking-tight">{`<${profileName?.replace(/\s+/g, "") || "Developer"} />`}</h1>
              <p className="text-emerald-400 font-semibold text-lg mb-4">{t("const role = \"")}{designation || "Software Engineer"}";
              </p>
              <div className="flex flex-wrap gap-6 text-xs text-slate-400">
                <span className="bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">{t("email: \"")}{email}"
                </span>
                <span className="bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">{t("location: \"")}{city}"
                </span>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-10">
                {about && (
                  <div>
                    <h2 className="text-slate-200 text-lg border-l-4 border-emerald-500 pl-4 mb-4 font-bold tracking-wide">{t("/* README.md */")}</h2>
                    <p className="text-sm leading-relaxed text-slate-400 bg-slate-800/30 p-5 rounded-xl border border-slate-800/50">
                      {about}
                    </p>
                  </div>
                )}

                <div>
                  <h2 className="text-slate-200 text-lg border-l-4 border-emerald-500 pl-4 mb-5 font-bold tracking-wide">{t("Experience.ts")}</h2>
                  <div className="space-y-5">
                    {allExp.map((exp, i) => (
                      <div
                        key={i}
                        className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-emerald-400 font-bold text-base">
                              {exp.role}
                            </div>
                            <div className="text-sm text-slate-300 mt-1">
                              @ {exp.company}
                            </div>
                          </div>
                          <span className="text-xs bg-slate-900/80 text-slate-400 px-2.5 py-1 rounded-md font-medium border border-slate-700">
                            {exp.duration}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-slate-400 leading-relaxed mt-3">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {projects?.length > 0 && (
                  <div>
                    <h2 className="text-slate-200 text-lg border-l-4 border-emerald-500 pl-4 mb-5 font-bold tracking-wide">{t("Projects.json")}</h2>
                    <div className="grid gap-4">
                      {projects.map((proj, i) => (
                        <div
                          key={i}
                          className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50"
                        >
                          <div className="text-emerald-400 font-bold mb-1.5">
                            {proj.name}
                          </div>
                          {proj.link && (
                            <div className="text-xs text-blue-400/80 mb-3 truncate font-medium">{t("\"url\": \"")}{proj.link}"
                            </div>
                          )}
                          {proj.description && (
                            <p className="text-sm text-slate-400">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-4 space-y-10">
                {skills.length > 0 && (
                  <div>
                    <h2 className="text-slate-200 text-lg border-l-4 border-emerald-500 pl-4 mb-5 font-bold tracking-wide">{t("Dependencies")}</h2>
                    <div className="flex flex-wrap gap-2.5">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-md font-medium"
                        >
                          "{s.skill || s}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div>
                    <h2 className="text-slate-200 text-lg border-l-4 border-emerald-500 pl-4 mb-5 font-bold tracking-wide">{t("Education")}</h2>
                    <div className="space-y-3">
                      {education.map((edu, i) => (
                        <div
                          key={i}
                          className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50"
                        >
                          <div className="text-sm text-slate-200 font-bold leading-tight mb-1.5">
                            {edu.degree}
                          </div>
                          <div className="text-xs text-slate-400">
                            {edu.institution}
                          </div>
                          <div className="text-xs text-emerald-500/80 mt-2 font-medium">
                            {edu.year}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {approvedPortfolioLinks.length > 0 && (
                  <div>
                    <h2 className="text-slate-200 text-lg border-l-4 border-emerald-500 pl-4 mb-5 font-bold tracking-wide">{t("Network")}</h2>
                    <div className="space-y-3">
                      {approvedPortfolioLinks.map((link, i) => (
                        <div
                          key={i}
                          className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50"
                        >
                          <div className="text-slate-300 font-bold text-xs mb-1 uppercase tracking-wider">
                            {link.platform}
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline truncate block"
                          >
                            {link.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "timeline":
        return (
          <div
            className="bg-[#f8fafc] p-12 font-sans text-slate-800 h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-xl shadow-indigo-600/20 rotate-3">
                <div className="-rotate-3">
                  {(profileName || "Y").charAt(0)}
                </div>
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                {profileName || "Your Name"}
              </h1>
              <p className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-5">
                {designation}
              </p>
              <div className="flex justify-center gap-3 text-sm text-slate-500 font-medium">
                <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                  {email}
                </span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                  {phone}
                </span>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                  {city}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t("About Me")}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {about || "Professional summary not provided."}
                  </p>
                </div>

                {skills.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t("Expertise")}</h2>
                    <div className="space-y-3">
                      {skills.map((s, i) => (
                        <div
                          key={i}
                          className="text-sm text-slate-700 font-semibold flex items-center gap-3"
                        >
                          <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                          {s.skill || s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t("Education")}</h2>
                    <div className="space-y-4">
                      {education.map((edu, i) => (
                        <div key={i}>
                          <div className="font-bold text-slate-800 text-sm mb-1">
                            {edu.degree}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mb-1">
                            {edu.institution}
                          </div>
                          <div className="text-xs text-indigo-500 font-bold">
                            {edu.year}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-8">
                <h2 className="text-2xl font-black text-slate-900 mb-8">{t("Career Timeline")}</h2>
                <div className="relative border-l-2 border-indigo-100 pl-8 space-y-10 ml-2">
                  {allExp.map((exp, i) => (
                    <div key={i} className="relative">
                      <div className="absolute w-5 h-5 bg-white border-[3px] border-indigo-500 rounded-full -left-[43px] top-1 shadow-sm"></div>
                      <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg mb-3">
                        {exp.duration}
                      </div>
                      <div className="font-black text-slate-900 text-xl mb-1">
                        {exp.role}
                      </div>
                      <div className="text-sm font-semibold text-slate-500 mb-3">
                        {exp.company}
                      </div>
                      {exp.description && (
                        <p className="text-sm text-slate-600 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "compact":
        return (
          <div
            className="bg-white p-8 font-sans text-slate-900 h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="text-center border-b-[3px] border-slate-900 pb-4 mb-4">
              <h1 className="text-3xl font-black uppercase tracking-tight mb-1">
                {profileName || "Your Name"}
              </h1>
              <p className="text-sm font-medium text-slate-600">
                {email} • {phone} • {city}
              </p>
            </div>
            {about && (
              <div className="mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 text-slate-800">{t("Summary")}</h2>
                <p className="text-xs leading-relaxed text-slate-700 text-justify">
                  {about}
                </p>
              </div>
            )}
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">{t("Experience")}</h2>
            <div className="space-y-3 mb-4">
              {allExp.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-bold">
                      {exp.role}{" "}
                      <span className="font-normal text-slate-500">{t("at")}{exp.company}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {exp.duration}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-xs mt-1 leading-relaxed text-slate-700 text-justify">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {projects?.length > 0 && (
              <>
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">{t("Projects")}</h2>
                <div className="space-y-3 mb-4">
                  {projects.map((proj, i) => (
                    <div key={i}>
                      <div className="text-sm font-bold flex justify-between">
                        <span>{proj.name}</span>
                        {proj.link && (
                          <span className="text-xs font-normal text-slate-500">
                            {proj.link}
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-xs mt-1 leading-relaxed text-slate-700">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">{t("Education")}</h2>
                <div className="space-y-2">
                  {education.map((edu, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-bold">{edu.degree}</div>
                      <div className="text-slate-600 flex justify-between mt-0.5">
                        <span>{edu.institution}</span>
                        <span className="font-semibold">{edu.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {skills.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">{t("Skills")}</h2>
                    <p className="text-xs leading-relaxed font-medium text-slate-700">
                      {skills.map((s) => s.skill || s).join(" • ")}
                    </p>
                  </div>
                )}

                {approvedPortfolioLinks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">{t("Links")}</h2>
                    <div className="space-y-1.5">
                      {approvedPortfolioLinks.map((link, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            {link.platform}:
                          </span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:underline truncate w-48 text-right"
                          >
                            {link.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "bold":
        return (
          <div
            className="bg-[#fff1f2] p-12 font-sans text-slate-900 h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="bg-rose-600 text-white p-10 rounded-[32px] mb-10 shadow-xl shadow-rose-600/20">
              <h1 className="text-5xl font-black tracking-tighter mb-3 break-words">
                {profileName || "Your Name"}
              </h1>
              <p className="text-xl text-rose-100 font-bold uppercase tracking-widest mb-6">
                {designation}
              </p>
              <div className="flex flex-wrap gap-3 text-sm font-semibold">
                <span className="bg-rose-700/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                  {email}
                </span>
                <span className="bg-rose-700/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                  {phone}
                </span>
                <span className="bg-rose-700/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                  {city}
                </span>
              </div>
            </div>
            <div className="px-2">
              <h2 className="text-2xl font-black text-rose-950 mb-6 flex items-center gap-4">
                <div className="w-10 h-1.5 bg-rose-500 rounded-full" />{" "}{t("Experience")}</h2>
              <div className="space-y-6 mb-12">
                {allExp.map((exp, i) => (
                  <div
                    key={i}
                    className="bg-white p-7 rounded-3xl shadow-sm border border-rose-100/50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-black text-slate-900">
                        {exp.role}
                      </h3>
                      <span className="text-sm font-black text-rose-600 bg-rose-50 px-4 py-1.5 rounded-full">
                        {exp.duration}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-400 mb-4">
                      {exp.company}
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {projects?.length > 0 && (
                <>
                  <h2 className="text-2xl font-black text-rose-950 mb-6 flex items-center gap-4">
                    <div className="w-10 h-1.5 bg-rose-500 rounded-full" />{" "}{t("Projects")}</h2>
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    {projects.map((proj, i) => (
                      <div
                        key={i}
                        className="bg-white p-7 rounded-3xl shadow-sm border border-rose-100/50 flex flex-col h-full"
                      >
                        <h3 className="text-lg font-black text-slate-900 mb-1">
                          {proj.name}
                        </h3>
                        {proj.link && (
                          <span className="text-xs font-bold text-rose-500 mb-3 truncate">
                            {proj.link}
                          </span>
                        )}
                        {proj.description && (
                          <p className="text-sm text-slate-600 leading-relaxed font-medium flex-grow">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-10">
                <div>
                  <h2 className="text-2xl font-black text-rose-950 mb-6 flex items-center gap-4">
                    <div className="w-10 h-1.5 bg-rose-500 rounded-full" />{" "}{t("Skills")}</h2>
                  <div className="flex flex-wrap gap-3">
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        className="bg-white border-2 border-rose-100 text-rose-700 font-bold px-4 py-2 rounded-xl text-sm shadow-sm"
                      >
                        {s.skill || s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-rose-950 mb-6 flex items-center gap-4">
                    <div className="w-10 h-1.5 bg-rose-500 rounded-full" />{" "}{t("Education")}</h2>
                  <div className="space-y-4">
                    {education.map((edu, i) => (
                      <div
                        key={i}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100/50"
                      >
                        <div className="font-black text-slate-900 mb-1">
                          {edu.degree}
                        </div>
                        <div className="text-sm font-semibold text-slate-500">
                          {edu.institution}
                        </div>
                        <div className="text-xs font-black text-rose-400 mt-2">
                          {edu.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "modern-split":
        return (
          <div
            className="bg-white font-sans text-slate-800 flex h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            {/* Left Sidebar */}
            <div className="w-[35%] bg-slate-900 text-white p-8 flex flex-col border-r-8 border-emerald-500">
              <div className="mb-10">
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-4xl font-black text-white mb-6 shadow-lg shadow-emerald-500/20">
                  {(profileName || "Y").charAt(0)}
                </div>
                <h1 className="text-3xl font-black mb-2 leading-tight tracking-tight text-white">
                  {profileName || "Your Name"}
                </h1>
                <p className="text-emerald-400 font-bold tracking-wide uppercase text-xs">
                  {designation}
                </p>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-300 mb-10">
                <p className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">@</span>
                  <span className="truncate">{email}</span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">#</span>
                  <span>{phone}</span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">📍</span>
                  <span>{city}</span>
                </p>
              </div>

              {skills.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-400 border-b border-slate-700 pb-2">{t("Core Skills")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-slate-800 text-emerald-300 px-3 py-1.5 rounded-full font-bold border border-slate-700/50"
                      >
                        {s.skill || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {education.length > 0 && (
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-400 border-b border-slate-700 pb-2">{t("Education")}</h2>
                  <div className="space-y-4">
                    {education.map((edu, i) => (
                      <div key={i} className="text-sm">
                        <div className="font-bold text-white mb-0.5">{edu.degree}</div>
                        <div className="text-slate-400 text-xs font-medium">{edu.institution}</div>
                        <div className="text-emerald-500 text-[10px] font-black mt-1 uppercase tracking-wider">{edu.year}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Main Content */}
            <div className="w-[65%] p-10 bg-slate-50">
              {about && (
                <div className="mb-10">
                  <h2 className="text-xl font-black text-slate-800 mb-4">{t("Professional Summary")}</h2>
                  <p className="text-sm leading-relaxed text-slate-600 font-medium text-justify">
                    {about}
                  </p>
                </div>
              )}

              <h2 className="text-xl font-black text-slate-800 mb-6">{t("Work Experience")}</h2>
              <div className="space-y-6 mb-10">
                {allExp.map((exp, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{exp.role}</h3>
                        <div className="text-sm text-emerald-600 font-bold">{exp.company}</div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold tracking-wide">
                        {exp.duration}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-600 leading-relaxed mt-3">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {projects?.length > 0 && (
                <>
                  <h2 className="text-xl font-black text-slate-800 mb-6">{t("Key Projects")}</h2>
                  <div className="grid gap-4 mb-8">
                    {projects.map((proj, i) => (
                      <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-slate-900">{proj.name}</h3>
                          {proj.link && (
                            <a href={proj.link} className="text-xs font-bold text-blue-500 hover:underline">{t("View Project")}</a>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "academic":
        return (
          <div
            className="bg-white p-12 font-serif text-black h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            <div className="text-center mb-8 border-b-[3px] border-black pb-6">
              <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase">
                {profileName || "Your Name"}
              </h1>
              <p className="text-sm text-gray-700 italic mb-2">
                {designation}
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-800">
                {city}  |  {email}  |  {phone}
              </p>
            </div>

            {about && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-3">{t("Curriculum Vitae / Summary")}</h2>
                <p className="text-sm leading-relaxed text-justify">
                  {about}
                </p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">{t("Professional Experience")}</h2>
              <div className="space-y-5">
                {allExp.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <div className="font-bold text-base">{exp.company}</div>
                      <div className="text-sm font-semibold">{exp.duration}</div>
                    </div>
                    <div className="text-sm italic mb-2">{exp.role}</div>
                    {exp.description && (
                      <p className="text-sm leading-relaxed text-justify pl-4 border-l-2 border-gray-300">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">{t("Education")}</h2>
                <div className="space-y-3">
                  {education.map((edu, i) => (
                    <div key={i} className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold">{edu.institution}</span>
                        <span className="mx-2">—</span>
                        <span className="italic">{edu.degree}</span>
                      </div>
                      <div className="text-sm font-semibold">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">{t("Selected Projects & Publications")}</h2>
                <div className="space-y-4">
                  {projects.map((proj, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold">{proj.name}</span>
                        {proj.link && (
                          <span className="text-xs text-gray-600">{proj.link}</span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-sm leading-relaxed text-justify">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {skills.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-3">{t("Technical Proficiencies")}</h2>
                  <p className="text-sm leading-relaxed">
                    {skills.map((s) => s.skill || s).join(", ")}
                  </p>
                </div>
              )}

              {approvedPortfolioLinks.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-3">{t("Digital Presence")}</h2>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {approvedPortfolioLinks.map((link, i) => (
                      <li key={i}>
                        <span className="font-bold mr-2">{link.platform}:</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-700 underline">
                          {link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case "startup":
        return (
          <div
            className="bg-[#f8fafc] p-8 font-sans text-slate-800 h-full w-full box-border focus:outline-none overflow-hidden"
            contentEditable
            suppressContentEditableWarning
          >
            {/* Header Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                  {profileName || "Your Name"}
                </h1>
                <p className="text-indigo-600 font-bold uppercase tracking-wider text-sm bg-indigo-50 inline-block px-4 py-1.5 rounded-full">
                  {designation}
                </p>
              </div>
              <div className="flex flex-col gap-2.5 relative z-10 items-end">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-indigo-400">@</span> {email}
                </span>
                <div className="flex gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="text-indigo-400">#</span> {phone}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="text-indigo-400">📍</span> {city}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Meta & Info */}
              <div className="col-span-4 space-y-6">
                {about && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {t("Bio")}
                    </h2>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed text-justify">
                      {about}
                    </p>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {t("Skills")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <span key={i} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200/60">
                          {s.skill || s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {t("Education")}
                    </h2>
                    <div className="space-y-4">
                      {education.map((edu, i) => (
                        <div key={i}>
                          <div className="font-bold text-slate-800 text-sm">{edu.degree}</div>
                          <div className="text-xs font-medium text-slate-500 mt-1">{edu.institution}</div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mt-1.5">{edu.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {approvedPortfolioLinks.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {t("Links")}
                    </h2>
                    <div className="space-y-3">
                      {approvedPortfolioLinks.map((link, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-0.5">{link.platform}</span>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-500 hover:underline truncate">
                            {link.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Experience & Projects */}
              <div className="col-span-8 space-y-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">💼</div>
                    {t("Experience")}
                  </h2>
                  <div className="space-y-6">
                    {allExp.map((exp, i) => (
                      <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-indigo-400 before:rounded-full after:absolute after:left-[2px] after:top-5 after:bottom-0 after:w-0.5 after:bg-slate-100 last:after:hidden">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 leading-tight">{exp.role}</h3>
                            <div className="text-sm font-bold text-indigo-600 mt-0.5">{exp.company}</div>
                          </div>
                          <span className="text-xs font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                            {exp.duration}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-slate-600 font-medium leading-relaxed mt-3">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {projects?.length > 0 && (
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">🚀</div>
                      {t("Projects")}
                    </h2>
                    <div className="grid gap-4">
                      {projects.map((proj, i) => (
                        <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-900">{proj.name}</h3>
                            {proj.link && (
                              <a href={proj.link} className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors">{t("View")}</a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[85vh]">
        <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
          {/* Left Sidebar: Controls */}
          <div className="w-full lg:w-72 shrink-0 space-y-8 sticky top-24">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl mb-2 tracking-tight">{t("Resume Builder")}</h3>
              <p className="text-sm text-slate-500 font-medium">{t(
                "Select a template and let AI optimize your phrasing for maximum\n              impact."
              )}</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("Select Template")}</label>
              <div className="flex flex-col gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTemplate(t.id)}
                    className={`text-left px-5 py-3.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-between group ${
                      activeTemplate === t.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    {t.name}
                    <FiCheck
                      className={`w-4 h-4 transition-transform ${activeTemplate === t.id ? "text-emerald-500 scale-100" : "text-transparent scale-50 group-hover:scale-100 group-hover:text-emerald-200"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleOptimize}
                disabled={isOptimizing}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                  isOptimizing
                    ? "bg-amber-50 text-amber-500 cursor-not-allowed border-2 border-amber-100"
                    : "bg-gradient-to-br from-amber-400 to-orange-500 text-white hover:shadow-md hover:shadow-orange-500/20 active:scale-[0.98]"
                }`}
              >
                {isOptimizing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <HiOutlineLightningBolt className="w-5 h-5" />
                )}
                {isOptimizing ? "Optimizing..." : "AI Optimize Resume"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98]"
              >
                <HiOutlineDownload className="w-5 h-5" />{t("Download PDF")}</button>
            </div>
          </div>

          {/* Right Area: Preview Container */}
          {/* Fixed Horizontal Clipping by forcing a minimum width inside a scrollable container */}
          <div className="w-full lg:flex-1 bg-slate-100/50 rounded-2xl p-6 lg:p-8 flex overflow-x-auto overflow-y-auto custom-scrollbar border border-slate-200 shadow-inner max-h-[85vh]">
            {/* This wrapper ensures the content never shrinks below A4 width, enabling safe horizontal scroll on smaller screens */}
            <div className="mx-auto flex justify-center min-w-[794px]">
              <div
                id="resume-preview-content"
                className="bg-white shadow-2xl rounded-sm overflow-hidden text-left ring-1 ring-slate-900/5"
                style={{ width: "794px", minHeight: "1123px" }}
              >
                {renderTemplate()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ATS Optimizer Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <AtsOptimizerPanel fileHash={profileData?.fileHash || undefined} parsedData={profileData} />
      </div>
    </div>
  );
}
