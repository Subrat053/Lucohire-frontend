import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const defaultSuggestions = [
  "Software Engineer",
  "React Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "Marketing Manager",
  "Sales Representative",
  "Customer Support",
  "HR Manager",
  "Project Manager",
  "Python Developer",
  "Java Developer",
  "Node.js Developer",
  "DevOps Engineer",
  "Graphic Designer",
  "Business Analyst",
  "Salesforce Developer",
  "SAP Consultant",
  "Web Developer",
  "Mobile App Developer",
  "Flutter Developer",
  "React Native Developer",
  "Cybersecurity Analyst",
  "Cloud Architect",
  "Driver",
  "Delivery Driver",
  "Truck Driver",
  "Doctor",
  "Dentist",
  "Draftsman",
  "Accountant",
  "Administrative Assistant",
  "Nurse",
  "Electrician",
  "Plumber",
  "Mechanic",
  "Chef",
  "Teacher",
  "Cashier",
  "Receptionist"
];

const JobSearchAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search jobs by title, skills, or company",
  liveJobsList = []
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Combine default and live job titles, make unique
  const getCombinedSuggestions = () => {
    const liveTitles = (liveJobsList || []).map(job => job.title).filter(Boolean);
    const combined = [...defaultSuggestions, ...liveTitles];
    return [...new Set(combined)];
  };

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) onChange(text);
    
    if (text.trim().length > 0) {
      const allSuggestions = getCombinedSuggestions();
      const lowerText = text.toLowerCase();
      
      const filtered = allSuggestions.filter(item => 
        item.toLowerCase().includes(lowerText)
      );

      // Sort: prioritize those starting with the query
      filtered.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(lowerText);
        const bStarts = b.toLowerCase().startsWith(lowerText);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });

      setSuggestions(filtered.slice(0, 10)); // Top 10 results
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion) => {
    setInputValue(suggestion);
    if (onChange) onChange(suggestion);
    if (onSelect) onSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="flex-1 flex items-center px-4 py-1 sm:py-0 w-full sm:w-auto bg-transparent border-none relative">
      <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
      <input 
        type="text" 
        placeholder={placeholder} 
        className="w-full bg-transparent border-none focus:ring-0 text-gray-700 ml-2 py-1.5 sm:py-2 outline-none text-[11px] sm:text-sm font-medium"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (inputValue.trim().length > 0 && suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto py-1.5 min-w-full md:min-w-[320px] animate-fadeIn">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="px-4 py-2 hover:bg-blue-50/50 cursor-pointer text-sm text-gray-700 border-b border-gray-50/60 last:border-none flex items-center gap-2.5 transition-colors duration-150"
              onClick={() => handleSelect(suggestion)}
            >
              <Search className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-semibold text-gray-700 truncate">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobSearchAutocomplete;
