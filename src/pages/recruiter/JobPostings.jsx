import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    HiPlus,
    HiSearch,
    HiSparkles,
    HiBriefcase,
    HiUsers,
    HiBookmark,
    HiDownload,
    HiFilter,
    HiChevronRight,
} from "react-icons/hi";
// import { recruiterAPI } from "../../services/api";
import { recruiterAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const fallbackCandidates = [
    { id: "1", name: "Amit Sharma", role: "React Developer", experience: "5.2 Years", location: "Noida, UP", matchScore: 92 },
    { id: "2", name: "Neha Singh", role: "Frontend Developer", experience: "4.6 Years", location: "Delhi, DL", matchScore: 89 },
    { id: "3", name: "Rohit Verma", role: "Full Stack Developer", experience: "6.1 Years", location: "Gurugram, HR", matchScore: 87 },
    { id: "4", name: "Pooja Mehta", role: "React Developer", experience: "3.8 Years", location: "Noida, UP", matchScore: 85 },
    { id: "5", name: "Karan Yadav", role: "Software Engineer", experience: "4.3 Years", location: "Ghaziabad, UP", matchScore: 83 },
];

export default function JobPostings() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "R";

    const companyName =
        user?.companyName ||
        user?.profile?.companyName ||
        user?.recruiterProfile?.companyName ||
        "Your Company";


    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [candidates, setCandidates] = useState(fallbackCandidates);
    const [searchText, setSearchText] = useState("");
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [aiFilters, setAiFilters] = useState({
        skill: "",
        experience: "",
        location: "",
        jobTitle: "",
    });

    const selectedJob = useMemo(
        () => jobs.find((job) => job._id === selectedJobId),
        [jobs, selectedJobId]
    );

    const loadPage = async () => {
        try {
            setLoading(true);

            const [jobsRes, plansRes] = await Promise.allSettled([
                recruiterAPI.getJobPostings(),
                recruiterAPI.getRecruiterPlans(),

                // recruiterAPI.getJobApplications(),
                // recruiterAPI.getPlans(),
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

    // ============================================================================
    const parseSearchInput = (text = "") => {
        const q = text.toLowerCase();

        const yearsMatch = q.match(/(\d+)\s*\+?\s*(years|year|yrs|yr)/);
        const experience = yearsMatch ? yearsMatch[1] : aiFilters.experience;

        const locationWords = ["noida", "delhi", "gurugram", "gurgaon", "ghaziabad", "mumbai", "pune", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata"];
        const location = locationWords.find((city) => q.includes(city)) || aiFilters.location;

        const cleanedSkill = text
            .replace(/with\s+\d+\+?\s*(years|year|yrs|yr)/gi, "")
            .replace(/in\s+(noida|delhi|gurugram|gurgaon|ghaziabad|mumbai|pune|bangalore|bengaluru|hyderabad|chennai|kolkata)/gi, "")
            .trim();

        return {
            skill: aiFilters.skill || cleanedSkill || text,
            experience,
            location,
            jobTitle: aiFilters.jobTitle,
        };
    };
    // =============================================================================================

    const handleSearch = async () => {
        const parsed = parseSearchInput(searchText);

        if (!parsed.skill && !parsed.location && !parsed.experience && !parsed.jobTitle) {
            toast.error("Enter skill, experience, location or job title");
            return;
        }

        try {
            setSearching(true);

            const { data } = await recruiterAPI.aiSearchCandidates({
                skill: parsed.skill,
                location: parsed.location,
                experience: parsed.experience,
                jobTitle: parsed.jobTitle,
            });

            const apiCandidates = Array.isArray(data?.candidates) ? data.candidates : [];

            setCandidates(
                apiCandidates.map((item) => ({
                    id: item.id || item._id,
                    name: item.name || "Candidate",
                    role: item.role || item.skills?.[0] || parsed.skill || "Candidate",
                    experience: item.experience || "N/A",
                    location: item.location || item.city || "Unknown",
                    matchScore: item.matchScore || 75,
                    profilePhoto: item.profilePhoto || "",
                }))
            );

            toast.success(`${apiCandidates.length} candidates found`);
        } catch (error) {
            toast.error(error.response?.data?.message || "AI search failed");
        } finally {
            setSearching(false);
        }
    };

    const handleAddCandidate = async (candidateId) => {
        if (!selectedJobId) {
            toast.error("Please select a job first");
            return;
        }

        try {
            await recruiterAPI.addCandidateToJob(selectedJobId, candidateId);
            toast.success("Candidate added to selected job");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add candidate");
        }
    };

    const planAmount = Number(selectedPlan?.price || 500);
    const gst = Math.round(planAmount * 18) / 100;
    const total = planAmount + gst;

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
                            jobs.slice(0, 4).map((job, index) => (
                                <button
                                    key={job._id}
                                    onClick={() => setSelectedJobId(job._id)}
                                    className={`w-full rounded-2xl border bg-white p-4 text-left transition ${selectedJobId === job._id
                                        ? "border-[#0066FF] shadow-sm"
                                        : "border-[#E5EAF3] hover:border-blue-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${index === 0 ? "bg-orange-50 text-orange-500" :
                                            index === 1 ? "bg-green-50 text-green-500" :
                                                index === 2 ? "bg-purple-50 text-purple-500" :
                                                    "bg-blue-50 text-blue-500"
                                            }`}>
                                            <HiBriefcase className="h-7 w-7" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-[#081B3A] truncate">
                                                {job.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {job.city || "Noida, UP"} • {job.scheduleType || "Full-time"}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Posted on {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently"}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xl font-bold text-[#081B3A]">
                                                {job.interestedCount || 0}
                                            </p>
                                            <p className="text-xs text-gray-500">Interested</p>
                                        </div>

                                        <HiChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {jobs.length > 4 && (
                        <button className="w-full rounded-xl border border-blue-100 bg-white py-3 text-sm font-semibold text-[#0066FF]">
                            See More Jobs ({jobs.length - 4})
                        </button>
                    )}
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

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchText("");
                                    setAiFilters({ skill: "", experience: "", location: "", jobTitle: "" });
                                    setCandidates([]);
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
                                    {candidates.map((candidate) => (
                                        <tr key={candidate.id} className="border-t border-[#F0F2F7]">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                                        {candidate.name?.[0] || "C"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[#081B3A]">{candidate.name}</p>
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
                                                    onClick={() => handleAddCandidate(candidate.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 text-[#0066FF] hover:bg-blue-50"
                                                >
                                                    <HiPlus />
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
        </div>
    );
}