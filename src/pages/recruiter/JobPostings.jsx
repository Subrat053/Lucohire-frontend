import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    HiPlus,
    HiCheck,
    HiSearch,
    HiSparkles,
    HiBriefcase,
    HiUsers,
    HiBookmark,
    HiDownload,
    HiFilter,
    HiChevronRight,
    HiTrash,
    HiX,
    HiPhone,
    HiMail,
    HiLocationMarker,
    HiStar,
    HiShieldCheck,
} from "react-icons/hi";
import { recruiterAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function JobPostings() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "R";

    const companyName =
        user?.profileName ||
        user?.companyName ||
        user?.profile?.companyName ||
        user?.recruiterProfile?.companyName ||
        "Your Company";

    // ─── Page state ───────────────────────────────────────────────────────────
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [savingIds, setSavingIds] = useState(new Set()); // candidateIds currently being saved

    const [aiFilters, setAiFilters] = useState({
        skill: "",
        experience: "",
        location: "",
        jobTitle: "",
        maxFee: "",
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [editingJob, setEditingJob] = useState(null);
    const [editForm, setEditForm] = useState({
        title: "",
        category: "",
        city: "",
        description: "",
        requirements: "",
        salaryRange: "",
        scheduleType: "Full-time",
    });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [viewingCandidate, setViewingCandidate] = useState(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const formatLocation = (loc) => {
        if (!loc) return "Unknown";
        if (typeof loc === 'string') return loc;
        if (typeof loc === 'object') {
            return loc.formattedAddress || loc.name || [loc.city, loc.state].filter(Boolean).join(', ') || "Unknown";
        }
        return "Unknown";
    };

    const selectedJob = useMemo(
        () => jobs.find((job) => job._id === selectedJobId),
        [jobs, selectedJobId]
    );

    // ─── Load initial page data ───────────────────────────────────────────────
    const loadPage = async () => {
        try {
            setLoading(true);
            const [jobsRes, plansRes] = await Promise.allSettled([
                recruiterAPI.getJobPostings(),
                recruiterAPI.getRecruiterPlans(),
            ]);

            if (jobsRes.status === "fulfilled") {
                const apiJobs = Array.isArray(jobsRes.value.data?.jobs)
                    ? jobsRes.value.data.jobs
                    : [];
                setJobs(apiJobs);
                if (apiJobs[0]?._id) setSelectedJobId(apiJobs[0]._id);
            }

            if (plansRes.status === "fulfilled") {
                const apiPlans = Array.isArray(plansRes.value.data)
                    ? plansRes.value.data
                    : [];
                setPlans(apiPlans);
                setSelectedPlan(apiPlans.find((p) => Number(p.price) === 500) || apiPlans[0] || null);
            }
        } catch (error) {
            toast.error("Failed to load recruiter job posting data");
        } finally {
            setLoading(false);
        }
    };

    // ─── Natural language parser ──────────────────────────────────────────────
    const parseSearchInput = (text = "") => {
        const q = text.toLowerCase();

        // Experience: "3+", "3 years", "3+ years"
        const yearsMatch = q.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/);
        const experience = yearsMatch ? yearsMatch[1] : aiFilters.experience;

        // City detection
        const locationWords = [
            "noida", "delhi", "gurugram", "gurgaon", "ghaziabad", "mumbai",
            "pune", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata",
            "ahmedabad", "surat", "jaipur", "lucknow", "chandigarh", "bhopal",
        ];
        const location =
            locationWords.find((city) => q.includes(city)) ||
            aiFilters.location;

        // Budget/fee: "under 25000", "below 30k", "25k", "25000"
        const feeMatch = q.match(/(?:under|below|max|upto|up to|budget|fee|salary)?\s*(\d+)\s*k?/i);
        let maxFee = aiFilters.maxFee;
        if (feeMatch) {
            const raw = parseInt(feeMatch[1], 10);
            maxFee = String(q.includes("k") && raw < 1000 ? raw * 1000 : raw);
        }

        // Remaining text as skill
        const cleaned = text
            .replace(/with\s+\d+\+?\s*(?:years?|yrs?)/gi, "")
            .replace(new RegExp(`in\\s+(${locationWords.join("|")})`, "gi"), "")
            .replace(/(?:under|below|max|upto|up to|budget|fee|salary)?\s*\d+\s*k?/gi, "")
            .trim();

        return {
            skill: aiFilters.skill || cleaned || text,
            experience,
            location,
            jobTitle: aiFilters.jobTitle,
            maxFee,
        };
    };

    // ─── AI Search ────────────────────────────────────────────────────────────
    const handleSearch = async () => {
        const parsed = parseSearchInput(searchText);

        // Auto-fill filter inputs from parsed query
        setAiFilters((prev) => ({
            skill:      parsed.skill     || prev.skill,
            experience: parsed.experience || prev.experience,
            location:   parsed.location  || prev.location,
            jobTitle:   parsed.jobTitle  || prev.jobTitle,
            maxFee:     parsed.maxFee    || prev.maxFee,
        }));

        const hasAnyFilter =
            parsed.skill || parsed.location || parsed.experience ||
            parsed.jobTitle || parsed.maxFee || aiFilters.maxFee;

        if (!hasAnyFilter) {
            toast.error("Enter a skill, location, experience, budget, or job title");
            return;
        }

        try {
            setSearching(true);
            setHasSearched(true);

            const { data } = await recruiterAPI.aiSearchCandidates({
                q:          searchText,
                skill:      parsed.skill,
                location:   parsed.location,
                experience: parsed.experience,
                jobTitle:   parsed.jobTitle,
                maxFee:     parsed.maxFee || aiFilters.maxFee,
            });

            const apiCandidates = Array.isArray(data?.candidates) ? data.candidates : [];

            // Auto-fill filters from server's parsedFilters
            if (data?.parsedFilters) {
                const pf = data.parsedFilters;
                setAiFilters((prev) => ({
                    skill:      pf.skill     || prev.skill,
                    experience: pf.experience || prev.experience,
                    location:   pf.location  || prev.location,
                    jobTitle:   pf.jobTitle  || prev.jobTitle,
                    maxFee:     pf.maxFee ? String(pf.maxFee) : prev.maxFee,
                }));
            }

            setCandidates(
                apiCandidates.map((item) => ({
                    id:           item.id || item._id,
                    name:         item.name || "Candidate",
                    role:         item.role || item.title || item.skills?.[0] || parsed.skill || "Candidate",
                    experience:   item.experience || "N/A",
                    location:     item.location || item.city || "Unknown",
                    matchScore:   item.matchScore || 75,
                    profilePhoto: item.profilePhoto || "",
                    fee:          item.fee || "N/A",
                    isSaved:      item.isSaved || false,
                    shortBio:     item.shortBio || "",
                    skills:       item.skills || [],
                }))
            );

            if (apiCandidates.length === 0) {
                toast("No candidates found. Try different filters.", { icon: "🔍" });
            } else {
                toast.success(`${apiCandidates.length} candidate${apiCandidates.length !== 1 ? "s" : ""} found`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "AI search failed. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    // ─── Save candidate ───────────────────────────────────────────────────────
    const handleSaveCandidate = useCallback(async (candidateId) => {
        if (savingIds.has(candidateId)) return;

        setSavingIds((prev) => new Set(prev).add(candidateId));
        try {
            const { data } = await recruiterAPI.saveCandidate({
                candidateId,
                jobId: selectedJobId || undefined,
                source: "ai_smart_search",
            });

            if (data.alreadySaved) {
                toast("Candidate is already in your saved list.", { icon: "📌" });
            } else {
                toast.success("Candidate saved successfully!");
                // Update isSaved state locally
                setCandidates((prev) =>
                    prev.map((c) => c.id === candidateId ? { ...c, isSaved: true } : c)
                );
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save candidate.");
        } finally {
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.delete(candidateId);
                return next;
            });
        }
    }, [savingIds, selectedJobId]);

    // ─── Edit / Delete job ────────────────────────────────────────────────────
    const handleEditJob = (job) => {
        setEditingJob(job);
        setEditForm({
            title: job.title || "",
            category: job.category || "",
            city: job.city || "",
            description: job.description || "",
            requirements: job.requirements || "",
            salaryRange: job.salaryRange || "",
            scheduleType: job.scheduleType || "Full-time",
        });
        setIsDeleteConfirmOpen(false);
        setIsEditModalOpen(true);
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        try {
            await recruiterAPI.updateJob(editingJob._id, editForm);
            toast.success("Job updated successfully");
            setJobs(jobs.map((j) => j._id === editingJob._id ? { ...j, ...editForm } : j));
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        }
    };

    const handleDeleteJob = async (id) => {
        try {
            setDeleting(true);
            await recruiterAPI.deleteJob(id);
            toast.success("Job posting deleted");
            const updatedJobs = jobs.filter((j) => j._id !== id);
            setJobs(updatedJobs);
            if (selectedJobId === id) {
                setSelectedJobId(updatedJobs[0]?._id || "");
            }
            setIsDeleteConfirmOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete job");
        } finally {
            setDeleting(false);
        }
    };

    const confirmDelete = (jobId) => {
        setJobToDelete(jobId);
        setIsEditModalOpen(false);
        setIsDeleteConfirmOpen(true);
    };

    const planAmount = Number(selectedPlan?.price || 500);
    const gst = Math.round(planAmount * 18) / 100;
    const total = planAmount + gst;

    const handleViewProfile = async (candidate) => {
        try {
            setViewingCandidate({ ...candidate, loading: true });
            setIsProfileModalOpen(true);
            
            const { data } = await recruiterAPI.viewProvider(candidate.id);
            setViewingCandidate({
                ...candidate,
                ...data.provider,
                contactInfo: data.contactInfo,
                isUnlocked: data.isUnlocked,
                reviews: data.reviews,
                loading: false
            });
        } catch (error) {
            toast.error("Failed to load candidate profile");
            setIsProfileModalOpen(false);
        }
    };

    const handleUnlockContact = async (candidateId) => {
        try {
            setIsUnlocking(true);
            const { data } = await recruiterAPI.unlockContact(candidateId);
            
            if (data.contact) {
                setViewingCandidate(prev => ({
                    ...prev,
                    contactInfo: data.contact,
                    isUnlocked: true
                }));
                toast.success("Contact unlocked successfully!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unlock contact");
        } finally {
            setIsUnlocking(false);
        }
    };

    useEffect(() => {
        loadPage();
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFF] p-5">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.25fr_0.95fr] gap-5">

                {/* Left: Job Postings */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-[#081B3A]">Job Postings</h1>
                            <p className="text-sm text-gray-500">
                                You have {jobs.length} active job postings
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/recruiter/post-job")}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                        >
                            <HiPlus className="w-4 h-4" />
                            Post a Job
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-[#E5EAF3] bg-white p-5 text-sm text-gray-500">
                                Loading jobs...
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="rounded-2xl border border-[#E5EAF3] bg-white p-5 text-sm text-gray-500">
                                No job postings found.
                            </div>
                        ) : (
                            jobs.map((job, index) => (
                                <div
                                    key={job._id}
                                    onClick={() => {
                                        setSelectedJobId(job._id);
                                        handleEditJob(job);
                                    }}
                                    className={`relative w-full rounded-2xl border bg-white p-4 text-left transition cursor-pointer group ${selectedJobId === job._id
                                        ? "border-[#0066FF] shadow-sm"
                                        : "border-[#E5EAF3] hover:border-blue-200"
                                        }`}
                                >

                                    <div className="absolute top-4 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditJob(job);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Job Posting"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteJob(job._id);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Job Posting"
                                        >
                                            <HiTrash className="h-5 w-5" />
                                        </button>
                                    </div>


                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${index % 4 === 0 ? "bg-orange-50 text-orange-500" :
                                            index % 4 === 1 ? "bg-green-50 text-green-500" :
                                                index % 4 === 2 ? "bg-purple-50 text-purple-500" :
                                                    "bg-blue-50 text-blue-500"
                                            }`}>
                                            <HiBriefcase className="h-7 w-7" />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <h3 className="font-bold text-[#081B3A] text-sm sm:text-base truncate pr-8">
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">{job.category || 'General'}</span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">{job.scheduleType || 'Full-time'}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-md line-clamp-1 italic">
                                                {job.description || 'No job summary provided.'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-semibold">
                                                Posted on {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                                            </p>
                                            
                                            <div className="pt-1.5 flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/recruiter/interested-candidates?jobId=${job._id}`);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 px-4 py-2 rounded-xl shadow-xs transition"
                                                >
                                                    <HiUsers className="w-3.5 h-3.5" /> View Applicants ({job.interestedCount || 0})
                                                </button>
                                            </div>
                                        </div>

                                        <HiChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>


                {/* Center: AI Search */}
                <section className="space-y-5">
                    <div className="rounded-2xl border border-[#E5EAF3] bg-white p-5">
                        <div className="flex items-center gap-2">
                            <HiSparkles className="h-6 w-6 text-purple-600" />
                            <h2 className="text-xl font-bold text-[#081B3A]">AI Smart Search</h2>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Use AI to find the right candidates instantly
                        </p>

                        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-[#E5EAF3] px-4 py-3">
                                <HiSearch className="h-5 w-5 text-gray-400" />
                                <input
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Example: React Developer with 3+ years in Noida"
                                    className="w-full bg-transparent text-sm outline-none"
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {searching ? "Searching..." : "Search"}
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            <input
                                value={aiFilters.skill}
                                onChange={(e) => setAiFilters({ ...aiFilters, skill: e.target.value })}
                                placeholder="Skill"
                                className="rounded-lg border border-[#E5EAF3] bg-white px-3 py-2 text-xs outline-none"
                            />

                            <input
                                value={aiFilters.experience}
                                onChange={(e) => setAiFilters({ ...aiFilters, experience: e.target.value })}
                                placeholder="Experience e.g. 3"
                                className="rounded-lg border border-[#E5EAF3] bg-white px-3 py-2 text-xs outline-none"
                            />

                            <input
                                value={aiFilters.location}
                                onChange={(e) => setAiFilters({ ...aiFilters, location: e.target.value })}
                                placeholder="Location"
                                className="rounded-lg border border-[#E5EAF3] bg-white px-3 py-2 text-xs outline-none"
                            />

                            <input
                                value={aiFilters.jobTitle}
                                onChange={(e) => setAiFilters({ ...aiFilters, jobTitle: e.target.value })}
                                placeholder="Job Title"
                                className="rounded-lg border border-[#E5EAF3] bg-white px-3 py-2 text-xs outline-none"
                            />

                            <input
                                value={aiFilters.maxFee}
                                onChange={(e) => setAiFilters({ ...aiFilters, maxFee: e.target.value })}
                                placeholder="Max Budget (₹)"
                                type="number"
                                className="rounded-lg border border-[#E5EAF3] bg-white px-3 py-2 text-xs outline-none"
                            />
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchText("");
                                    setAiFilters({ skill: "", experience: "", location: "", jobTitle: "", maxFee: "" });
                                    setCandidates([]);
                                    setHasSearched(false);
                                }}
                                className="text-xs font-semibold text-[#0066FF]"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#F7F9FF] p-5 text-sm text-[#081B3A]">
                            <p className="font-semibold">Click the + icon to add candidates.</p>
                            <p className="mt-1 text-gray-500">
                                They will be added to the respective job posting when you open that job.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#E5EAF3] bg-white">
                        <div className="flex items-center justify-between border-b border-[#E5EAF3] p-4">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-[#081B3A]">AI Search Results</h2>
                                <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600">
                                    {candidates.length} Candidates Found
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button className="rounded-lg border border-[#E5EAF3] p-2 text-gray-500">
                                    <HiDownload />
                                </button>
                                <button className="rounded-lg border border-[#E5EAF3] p-2 text-gray-500">
                                    <HiFilter />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-gray-400">
                                        <th className="px-4 py-3">Candidate</th>
                                        <th className="px-4 py-3">Experience</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Match Score</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.length === 0 && hasSearched && !searching ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                                                No candidates found. Try different filters or keywords.
                                            </td>
                                        </tr>
                                    ) : candidates.map((candidate) => (
                                        <tr key={candidate.id} className="border-t border-[#F0F2F7]">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 cursor-pointer"
                                                        onClick={() => handleViewProfile(candidate)}
                                                    >
                                                        {candidate.name?.[0] || "C"}
                                                    </div>
                                                    <div 
                                                        className="cursor-pointer group"
                                                        onClick={() => handleViewProfile(candidate)}
                                                    >
                                                        <p className="font-semibold text-[#081B3A] group-hover:text-[#0066FF] transition-colors">{candidate.name}</p>
                                                        <p className="text-xs text-gray-500">{candidate.role || "Candidate"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{candidate.experience}</td>
                                            <td className="px-4 py-3 text-gray-600">{candidate.location}</td>
                                            <td className="px-4 py-3 font-bold text-green-600">
                                                {candidate.matchScore}%
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleSaveCandidate(candidate.id)}
                                                    disabled={candidate.isSaved || savingIds.has(candidate.id)}
                                                    title={candidate.isSaved ? "Already saved" : "Save candidate"}
                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                                        candidate.isSaved
                                                            ? "border-green-200 bg-green-50 text-green-600 cursor-default"
                                                            : savingIds.has(candidate.id)
                                                            ? "border-blue-100 text-blue-300 cursor-wait"
                                                            : "border-blue-200 text-[#0066FF] hover:bg-blue-50"
                                                    }`}
                                                >
                                                    {savingIds.has(candidate.id) ? (
                                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                                                    ) : candidate.isSaved ? (
                                                        <HiCheck className="h-4 w-4" />
                                                    ) : (
                                                        <HiPlus className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button className="w-full border-t border-[#E5EAF3] py-3 text-sm font-semibold text-[#0066FF]">
                            View All Results
                        </button>
                    </div>

                    <div className="rounded-2xl border border-[#E5EAF3] bg-white p-4">
                        <h2 className="font-bold text-[#081B3A]">Manage Your Candidates</h2>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-[#E5EAF3] p-4">
                                <HiPlus className="h-7 w-7 text-[#0066FF]" />
                                <p className="mt-2 font-semibold">Add Candidate</p>
                                <p className="text-xs text-gray-500">Add candidates to relevant job postings.</p>
                            </div>
                            <div className="rounded-xl border border-[#E5EAF3] p-4">
                                <HiBookmark className="h-7 w-7 text-purple-600" />
                                <p className="mt-2 font-semibold">Shortlist Candidate</p>
                                <p className="text-xs text-gray-500">Shortlist the best candidates.</p>
                            </div>
                            <div className="rounded-xl border border-[#E5EAF3] p-4">
                                <HiBriefcase className="h-7 w-7 text-purple-600" />
                                <p className="mt-2 font-semibold">View by Job</p>
                                <p className="text-xs text-gray-500">View candidates added for each job.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right: Profile + Plans */}
                <aside className="space-y-5">
                    <div className="rounded-2xl border border-[#E5EAF3] bg-white p-5">
                        <h2 className="font-bold text-[#081B3A]">Your Profile</h2>

                        <div className="mt-4 flex items-center gap-4">
                            {user?.profilePhoto || user?.avatar ? (
                                <img
                                    src={user.profilePhoto || user.avatar}
                                    alt={user?.name || "Recruiter"}
                                    className="h-16 w-16 rounded-full object-cover border border-[#E5EAF3]"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-[#0057D9] flex items-center justify-center text-xl font-bold text-white">
                                    {initials}
                                </div>
                            )}

                            <div className="min-w-0">
                                <p className="font-bold text-[#081B3A] truncate">
                                    {user?.name || "Recruiter"}
                                </p>

                                <p className="text-sm text-gray-500 truncate">
                                    {companyName}
                                </p>

                                <button
                                    onClick={() => navigate("/recruiter/company-profile")}
                                    className="mt-2 text-sm font-semibold text-[#0066FF]"
                                >
                                    View Company Profile →
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#E5EAF3] bg-white p-5">
                        <h2 className="font-bold text-[#081B3A]">Choose a Plan</h2>

                        <div className="mt-4 space-y-3">
                            {(plans.length ? plans : [
                                { _id: "free", name: "Free Plan", price: 0, contactLimit: 5 },
                                { _id: "10", name: "10 Contacts Plan", price: 500, contactLimit: 10 },
                                { _id: "50", name: "50 Contacts Plan", price: 1000, contactLimit: 50 },
                                { _id: "custom", name: "Customise Plan", price: null },
                            ]).map((plan) => (
                                <button
                                    key={plan._id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`w-full rounded-xl border p-4 text-left ${selectedPlan?._id === plan._id
                                        ? "border-[#0066FF] bg-blue-50/40"
                                        : "border-[#E5EAF3] bg-white"
                                        }`}
                                >
                                    <div className="flex justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-[#081B3A]">{plan.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {plan.contactLimit
                                                    ? `View & download ${plan.contactLimit} candidate contacts`
                                                    : "Create a plan as per your requirements"}
                                            </p>
                                        </div>
                                        <p className="font-bold text-[#081B3A]">
                                            {plan.price === null ? "Custom" : `₹${plan.price}`}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#E5EAF3] bg-white p-5">
                        <h2 className="font-bold text-[#081B3A]">Payment Summary</h2>

                        <div className="mt-5 space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Selected Plan</span>
                                <span className="font-medium">{selectedPlan?.name || "10 Contacts Plan"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Plan Amount</span>
                                <span>₹{planAmount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">GST (18%)</span>
                                <span>₹{gst}</span>
                            </div>
                            <div className="border-t border-dashed border-[#E5EAF3] pt-4 flex justify-between">
                                <span className="font-bold text-[#081B3A]">Total Amount</span>
                                <span className="text-2xl font-bold text-[#081B3A]">₹{total}</span>
                            </div>
                        </div>

                        <button className="mt-5 w-full rounded-xl bg-[#0066FF] py-3 font-semibold text-white">
                            Proceed to Payment →
                        </button>

                        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
                            <span>🔒 Secure Payments</span>
                            <span>🛡 100% Safe & Trusted</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Edit Job Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-xl font-bold text-[#081B3A]">Edit Job Posting</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateJob} className="mt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Job Title</label>
                                    <input
                                        required
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Category</label>
                                    <input
                                        required
                                        value={editForm.category}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">City</label>
                                    <input
                                        required
                                        value={editForm.city}
                                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Schedule Type</label>
                                    <select
                                        value={editForm.scheduleType}
                                        onChange={e => setEditForm({ ...editForm, scheduleType: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Salary Range</label>
                                <input
                                    value={editForm.salaryRange}
                                    onChange={e => setEditForm({ ...editForm, salaryRange: e.target.value })}
                                    placeholder="e.g. ₹20,000 - ₹30,000"
                                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Requirements</label>
                                <textarea
                                    rows={2}
                                    value={editForm.requirements}
                                    onChange={e => setEditForm({ ...editForm, requirements: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        confirmDelete(editingJob._id);
                                    }}
                                    className="px-6 rounded-xl border-2 border-red-100 text-red-600 py-3 font-semibold hover:bg-red-50 transition"
                                >
                                    Delete Job
                                </button>

                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 transition"
                                >
                                    Update Job
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <HiTrash className="h-8 w-8" />
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-[#081B3A]">Delete Job Posting?</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Are you sure you want to delete <span className="font-semibold text-red-600">"{jobs.find(j => j._id === jobToDelete)?.title || "this job"}"</span>? This action cannot be undone and will remove all associated applications.
                            </p>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                disabled={deleting}
                                className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteJob(jobToDelete)}
                                disabled={deleting}
                                className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    "Yes, Delete"
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {/* Candidate Profile Modal */}
            {isProfileModalOpen && viewingCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <h3 className="text-xl font-bold text-[#081B3A]">Candidate Profile</h3>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <HiX className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
                            {viewingCandidate.loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent"></div>
                                    <p className="mt-4 text-gray-500">Loading profile details...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Profile Summary */}
                                    <div className="flex items-start gap-6">
                                        <div className="h-24 w-24 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700 shadow-inner">
                                            {viewingCandidate.profilePhoto ? (
                                                <img src={viewingCandidate.profilePhoto} alt="" className="h-full w-full rounded-2xl object-cover" />
                                            ) : (
                                                viewingCandidate.name?.[0] || "C"
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-2xl font-bold text-[#081B3A]">{viewingCandidate.name}</h4>
                                                {viewingCandidate.isVerified && (
                                                    <HiShieldCheck className="h-6 w-6 text-blue-500" title="Verified Provider" />
                                                )}
                                            </div>
                                            <p className="text-lg text-gray-600 mt-1">{viewingCandidate.role || viewingCandidate.title}</p>
                                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                    <HiBriefcase className="h-4 w-4 text-gray-400" />
                                                    {viewingCandidate.experience} Experience
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                    <HiLocationMarker className="h-4 w-4 text-gray-400" />
                                                    {formatLocation(viewingCandidate.location)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                    <HiStar className="h-4 w-4" />
                                                    {viewingCandidate.matchScore}% Match
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Section */}
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
                                        <h5 className="font-bold text-[#081B3A] mb-4 flex items-center gap-2">
                                            Contact Information
                                        </h5>
                                        {viewingCandidate.isUnlocked ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                        <HiPhone className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Phone</p>
                                                        <p className="font-semibold text-gray-700">{viewingCandidate.contactInfo?.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                        <HiMail className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Email</p>
                                                        <p className="font-semibold text-gray-700">{viewingCandidate.contactInfo?.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-gray-600 mb-4">Contact details are locked. Use your plan credits to unlock.</p>
                                                <button
                                                    onClick={() => handleUnlockContact(viewingCandidate.id)}
                                                    disabled={isUnlocking}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
                                                >
                                                    {isUnlocking ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    ) : (
                                                        "Unlock Contact Details"
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* About / Skills */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h5 className="font-bold text-[#081B3A] mb-3">About Candidate</h5>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                {viewingCandidate.shortBio || viewingCandidate.description || "No bio provided by candidate."}
                                            </p>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-[#081B3A] mb-3">Core Skills</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingCandidate.skills?.map((skill, idx) => (
                                                    <span key={idx} className="rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {(!viewingCandidate.skills || viewingCandidate.skills.length === 0) && (
                                                    <p className="text-sm text-gray-400 italic">No skills listed.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 bg-gray-50 p-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleSaveCandidate(viewingCandidate.id);
                                    setIsProfileModalOpen(false);
                                }}
                                disabled={viewingCandidate.isSaved}
                                className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 ${
                                    viewingCandidate.isSaved 
                                    ? "bg-green-500 cursor-default" 
                                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                                }`}
                            >
                                {viewingCandidate.isSaved ? "Saved" : "Save Candidate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}