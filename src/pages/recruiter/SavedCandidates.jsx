import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiBookmark, FiChevronDown, FiList, FiGrid,
  FiMapPin, FiMessageSquare, FiStar, FiChevronUp, FiX,
  FiMoreVertical, FiEye, FiArrowUpRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

const Candidates = () => {
  // --- MOCK DATA ---
  const candidatesList = [
    { 
      id: 1, name: 'Ankit Singh', match: 95, premium: true, title: 'Senior React Developer', status: 'Serving Notice Period',
      location: 'Bangalore, Karnataka', exp: '5.2 yrs', ctc: '₹18 LPA', notice: '30 Days',
      skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Node.js', 'Tailwind CSS'], moreSkills: '+4',
      pic: 'https://i.pravatar.cc/150?u=1'
    },
    { 
      id: 2, name: 'Sneha Patil', match: 92, premium: true, title: 'React Developer', status: 'Serving Notice Period',
      location: 'Bangalore, Karnataka', exp: '4.8 yrs', ctc: '₹16 LPA', notice: '15 Days',
      skills: ['React', 'TypeScript', 'Redux', 'JavaScript', 'Node.js', 'Material UI'], moreSkills: '+3',
      pic: 'https://i.pravatar.cc/150?u=2'
    },
    { 
      id: 3, name: 'Vikram Kumar', match: 90, premium: true, title: 'Frontend Developer', status: 'Available',
      location: 'Bangalore, Karnataka', exp: '6.1 yrs', ctc: '₹20 LPA', notice: '60 Days',
      skills: ['React', 'Next.js', 'TypeScript', 'Redux', 'GraphQL', 'Jest'], moreSkills: '+5',
      pic: 'https://i.pravatar.cc/150?u=3'
    },
    { 
      id: 4, name: 'Neha Kapoor', match: 88, premium: true, title: 'React Developer', status: 'Serving Notice Period',
      location: 'Bangalore, Karnataka', exp: '4.3 yrs', ctc: '₹15 LPA', notice: '30 Days',
      skills: ['React', 'JavaScript', 'Redux', 'HTML', 'CSS', 'Bootstrap'], moreSkills: '+2',
      pic: 'https://i.pravatar.cc/150?u=4'
    },
    { 
      id: 5, name: 'Arjun Mehta', match: 86, premium: true, title: 'React Developer', status: 'Available',
      location: 'Bangalore, Karnataka', exp: '5.0 yrs', ctc: '₹17 LPA', notice: '45 Days',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Next.js'], moreSkills: '+1',
      pic: 'https://i.pravatar.cc/150?u=5'
    }
  ];

  const activeFilters = [
    'Skills: React, TypeScript, Next.js',
    'Experience: 4 - 8 years',
    'Location: Bangalore',
    'Current CTC: ₹10 - ₹25 LPA',
    'Notice Period: 0 - 60 days',
    'Employment Type: Full-time'
  ];

  const topSkills = ['TypeScript', 'Next.js', 'Redux Toolkit', 'Tailwind CSS', 'Node.js'];
  
  const suggestedSearches = ['React Developer', 'Redux', 'TypeScript', 'Next.js'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">AI Talent Search</h1>
          <p className="text-sm text-gray-500 mt-1">Find the right talent, faster with AI</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition flex items-center gap-2">
            Ask Luco AI <HiSparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* INTELLIGENT SEARCH AREA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
          <div className="relative w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by skills, roles, companies or keywords..."
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-block border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-white">⌘K</kbd>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-4 py-2.5 rounded-xl">
              <HiSparkles className="text-indigo-600 w-5 h-5 shrink-0" />
              <span className="text-sm font-bold text-gray-900 truncate">React Developer with 4+ years experience in Bangalore</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                <FiBookmark /> Save Search
              </button>
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                <FiSearch /> Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 mr-2">Suggested searches:</span>
            {suggestedSearches.map(tag => (
              <span key={tag} className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition">
                {tag}
              </span>
            ))}
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-700 ml-2">
              More <FiChevronDown />
            </span>
          </div>
        </div>
        
        {/* FILTERS ROW */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 xl:pb-0 w-full xl:w-auto">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition shrink-0">
              <FiFilter /> Filters <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">6</span>
            </button>
            <button className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition shrink-0">
              Experience: 4-8 yrs <FiChevronDown />
            </button>
            <button className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition shrink-0">
              Location: Bangalore <FiChevronDown />
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition shrink-0">
              Current CTC <FiChevronDown />
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition shrink-0">
              Notice Period <FiChevronDown />
            </button>
            <button className="text-sm font-bold text-indigo-600 hover:underline shrink-0 px-2">
              More Filters
            </button>
          </div>
          <button className="text-sm font-bold text-gray-500 hover:text-gray-700 shrink-0">
            Clear All
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: CANDIDATES LIST */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-gray-900"><span className="text-lg font-extrabold mr-1">512</span> Candidates Found</h2>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">&uarr; 24 New Today</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">18 Immediate Joiners</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500">Sorted by Best Match <FiChevronDown className="inline" /></span>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                  <button className="p-1.5 rounded bg-indigo-50 text-indigo-600"><FiList className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded text-gray-400 hover:text-gray-600"><FiGrid className="w-4 h-4" /></button>
                </div>
                <button className="flex items-center gap-2 bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed">
                  <div className="w-3 h-3 border border-gray-400 rounded-sm"></div> Compare (0/3)
                </button>
                <button className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                  Best Match <FiChevronDown />
                </button>
              </div>
            </div>

            {/* Candidates Cards */}
            <div className="space-y-4">
              {candidatesList.map(candidate => (
                <div key={candidate.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition group">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <img src={candidate.pic} alt={candidate.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{candidate.match}% Match</span>
                            {candidate.premium && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Premium</span>}
                          </div>
                          <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            {candidate.title} <span className="text-gray-300">|</span> 
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${candidate.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                              {candidate.status}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            <FiMapPin className="w-3.5 h-3.5" /> {candidate.location}
                          </div>
                        </div>
                        
                        {/* Quick Actions (Desktop) */}
                        <div className="hidden lg:flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <FiMessageSquare className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <FiBookmark className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-8 mt-5 ml-20">
                        <div>
                          <div className="text-sm font-extrabold text-gray-900">{candidate.exp}</div>
                          <div className="text-[11px] font-semibold text-gray-400">Experience</div>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-gray-900">{candidate.ctc}</div>
                          <div className="text-[11px] font-semibold text-gray-400">Current CTC</div>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-gray-900">{candidate.notice}</div>
                          <div className="text-[11px] font-semibold text-gray-400">Notice Period</div>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-5 ml-20">
                        {candidate.skills.map(skill => (
                          <span key={skill} className="text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                            {skill}
                          </span>
                        ))}
                        <span className="text-[11px] font-bold text-gray-400 px-1">
                          {candidate.moreSkills}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="lg:w-48 flex flex-row lg:flex-col gap-2 justify-center lg:justify-start lg:border-l border-gray-100 lg:pl-6">
                      <div className="hidden lg:flex justify-end mb-2">
                        <button className="text-gray-400 hover:text-gray-600"><FiMoreVertical className="w-5 h-5" /></button>
                      </div>
                      <Link to={`/recruiter/candidates/${candidate.id}`} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">
                        <FiEye /> View Profile
                      </Link>
                      <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition">
                        <FiStar /> Shortlist
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition">
                        <FiMessageSquare /> Contact
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Placeholder */}
            <div className="pt-4 flex items-center justify-center">
              <button className="bg-white border border-gray-200 px-6 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                Load More Candidates
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS & ALERTS */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Active Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Active Filters <span className="text-gray-500 font-medium">({activeFilters.length})</span></h3>
                <button className="text-[10px] font-bold text-indigo-600 hover:underline">Clear All</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(filter => (
                  <div key={filter} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700">
                    {filter}
                    <button className="text-gray-400 hover:text-red-500"><FiX className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Insights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900">Search Insights</h3>
                <button className="text-gray-400 hover:text-gray-600"><FiChevronUp className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-gray-900 mb-1">Skills</div>
                  <div className="text-[11px] text-gray-600">React Developers in Bangalore</div>
                  <div className="text-[10px] text-gray-400">(4 - 8 yrs exp)</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-900 mb-3">Top Skills in Demand</div>
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map(skill => (
                      <span key={skill} className="text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-900 mb-3">Top Companies Hiring</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center font-bold text-yellow-600 border border-yellow-100 shadow-sm">F</div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center font-bold text-orange-600 border border-orange-100 shadow-sm">S</div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 border border-indigo-100 shadow-sm">M</div>
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-900 border border-gray-200 shadow-sm">a</div>
                  </div>
                </div>

                <button className="w-full bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2">
                  View Full Market Report <FiArrowUpRight />
                </button>
              </div>
            </div>

            {/* AI Search Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">AI Search Tips</h3>
                <button className="text-gray-400 hover:text-gray-600"><FiChevronUp className="w-4 h-4" /></button>
              </div>
              
              <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                Try adding more skills like <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded">Material UI</span>, <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded">GraphQL</span>, <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded">Jest</span> to get better matches.
              </p>
              
              <button className="w-full bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2">
                <HiSparkles /> Ask AI to Improve Search &rarr;
              </button>
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Candidates;