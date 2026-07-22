import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUploadCloud, FiShield, FiUpload, FiCheckCircle, FiLock } from 'react-icons/fi';
import { BiBuildingHouse } from 'react-icons/bi';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GuestDiscovery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [otherExperience, setOtherExperience] = useState('');
  const [jobRoles, setJobRoles] = useState([]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [focusedRoleIndex, setFocusedRoleIndex] = useState(-1);
  const fileInputRef = useRef(null);
  const roleDropdownRef = useRef(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/job-roles');
        if (res.data && res.data.length > 0) {
          setJobRoles(res.data.map(r => r.roleName));
        } else {
          setJobRoles(["Software Engineer", "Frontend Developer", "Backend Developer", "Product Manager", "Data Analyst"]);
        }
      } catch (err) {
        console.error('Error fetching job roles:', err);
        setJobRoles(["Software Engineer", "Frontend Developer", "Backend Developer", "Product Manager", "Data Analyst"]);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    emailId: '',
    phone: '',
    role: location.state?.formData?.skills || '',
    experience: ''
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const parseResumeFile = async (droppedFile) => {
    if (!droppedFile) return;
    setFile(droppedFile);
    setIsParsing(true);
    toast.success('Parsing resume to pre-fill details...');

    try {
      const data = new FormData();
      data.append('resume', droppedFile);

      const response = await api.post('/jobs/guest-resume/parse', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000
      });

      if (response.data?.success && response.data?.data) {
        // pipelineResult.data wraps the actual payload in another 'data' property
        const resultWrapper = response.data.data;
        const parsed = resultWrapper.data || resultWrapper;
        
        console.log("Parsed Resume Data:", parsed);
        const updatedData = {
          ...formData,
          emailId: parsed.email || parsed.emailId || formData.emailId,
          phone: parsed.contactNumber || parsed.phone || formData.phone,
          role: parsed.skills?.length ? parsed.skills.join(', ') : formData.role,
          experience: (parsed.experienceYears !== null && parsed.experienceYears !== undefined) ? getExperienceCategory(parsed.experienceYears) : formData.experience,
          resumeScore: resultWrapper.profile_strength_score || resultWrapper.confidence_score || 85
        };
        setFormData(updatedData);
        toast.success('Resume parsed successfully! Redirecting...');
        
        // Auto-redirect
        setTimeout(() => {
          navigate('/unlock-matches', { state: { file: droppedFile, formData: updatedData } });
        }, 500);
      }
    } catch (error) {
      console.error('Resume Parse Error:', error);
      toast.error('Failed to parse resume automatically. Please enter details manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const getExperienceCategory = (years) => {
    const y = parseFloat(years);
    if (isNaN(y)) return '';
    if (y <= 1) return '0-1';
    if (y <= 3) return '1-3';
    if (y <= 5) return '3-5';
    if (y <= 8) return '5-8';
    return 'Other';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    parseResumeFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    parseResumeFile(selectedFile);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'role') {
      setFocusedRoleIndex(-1);
    }
  };

  const handleRoleKeyDown = (e) => {
    const filteredRoles = jobRoles.filter(r => r.toLowerCase().includes((formData.role || '').toLowerCase()));
    if (!isRoleDropdownOpen) {
      if (e.key === 'ArrowDown') {
        setIsRoleDropdownOpen(true);
      }
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedRoleIndex(prev => (prev < filteredRoles.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedRoleIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedRoleIndex >= 0 && focusedRoleIndex < filteredRoles.length) {
        setFormData(prev => ({ ...prev, role: filteredRoles[focusedRoleIndex] }));
        setIsRoleDropdownOpen(false);
        setFocusedRoleIndex(-1);
      } else {
        setIsRoleDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsRoleDropdownOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const { emailId, phone, role, experience } = formData;
    if (!emailId || !phone || !role || !experience) {
      return toast.error('Please fill in all required fields.');
    }

    if (experience === 'Other' && !otherExperience) {
      return toast.error('Please enter your experience in years.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
      return toast.error('Please enter a valid email address.');
    }

    const finalFormData = {
      ...formData,
      experience: experience === 'Other' ? otherExperience : experience,
      role: role
    };

    navigate('/unlock-matches', { state: { file, formData: finalFormData } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="w-full max-w-5xl mb-2">
        <button onClick={() => navigate('/')} className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center text-sm">
          &larr; Back
        </button>
      </div>

      <div className="w-full max-w-5xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-blue-100/90 shadow-2xl shadow-blue-900/10 sm:rounded-[24px] flex flex-col md:flex-row border border-blue-200/60 relative">
        
        {/* Option 1: Upload Resume */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-blue-100/60 bg-blue-50/20 backdrop-blur-sm sm:rounded-t-[24px] md:rounded-tr-none md:rounded-l-[24px]">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="bg-blue-100 p-2 rounded-full mb-3">
              <FiUpload className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Option 1: Upload Your Updated Resume</h2>
            <p className="text-gray-500 mb-4 max-w-xs text-sm">
              Upload your latest resume and let our AI find the best matching jobs for you.
            </p>

            <div 
              className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white hover:bg-gray-50'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isParsing && fileInputRef.current?.click()}
            >
              {isParsing ? (
                <RefreshCw className="w-10 h-10 text-blue-500 mb-3 animate-spin" />
              ) : (
                <FiUploadCloud className="text-blue-500 text-4xl mb-3" />
              )}
              <p className="text-gray-700 font-medium text-sm mt-2">
                {isParsing ? 'Extracting details...' : 'Drag & drop your resume here'}
              </p>
              {!isParsing && (
                <>
                  <p className="text-gray-400 text-xs mb-2">or</p>
                  <button className="px-4 py-1.5 border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 pointer-events-none">
                    Choose File
                  </button>
                  <p className="text-[11px] text-gray-400 mt-3">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
            {file && !isParsing && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md flex items-center w-full">
                <FiCheckCircle className="mr-2 shrink-0" /> <span className="truncate">{file.name}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* OR Divider for Mobile */}
        <div className="md:hidden flex items-center justify-center py-4 bg-gray-50">
          <span className="bg-white px-4 py-1 border rounded-full text-sm font-bold text-gray-400">OR</span>
        </div>

        {/* Option 2: Fill Details Manually */}
        <div className="flex-1 p-6 relative bg-white/40 backdrop-blur-sm sm:rounded-b-[24px] md:rounded-bl-none md:rounded-r-[24px]">
          {/* OR Divider for Desktop */}
          <div className="hidden md:flex absolute top-1/2 -left-4 transform -translate-y-1/2 items-center justify-center bg-white border border-blue-100/60 h-8 w-8 rounded-full shadow-sm z-10">
            <span className="text-[10px] font-bold text-gray-500">OR</span>
          </div>

          <div className="flex flex-col items-center text-center mb-4">
            <div className="bg-green-100 p-2 rounded-full mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Option 2: Fill Your Details Manually</h2>
            <p className="text-gray-500 max-w-xs text-sm">
              Complete your profile manually or review extracted details.
            </p>
          </div>

          <form className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email ID *</label>
                <input 
                  type="email" 
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                  placeholder="Enter your email id" 
                  className="w-full px-4 py-2.5 bg-white shadow-sm border border-blue-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Mobile Number *</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+919876543210" 
                  className="w-full px-4 py-2.5 bg-white shadow-sm border border-blue-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div ref={roleDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Role / Profession *</label>
                <input 
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={(e) => {
                    handleInputChange(e);
                    setIsRoleDropdownOpen(true);
                  }}
                  onFocus={() => setIsRoleDropdownOpen(true)}
                  onKeyDown={handleRoleKeyDown}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-4 py-2.5 bg-white shadow-sm border border-blue-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 hover:border-blue-300 transition-all"
                  autoComplete="off"
                />
                {isRoleDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {jobRoles.filter(r => r.toLowerCase().includes((formData.role || '').toLowerCase())).length > 0 ? (
                      jobRoles.filter(r => r.toLowerCase().includes((formData.role || '').toLowerCase())).map((r, idx) => (
                        <div 
                          key={idx}
                          className={`px-4 py-2 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0 ${idx === focusedRoleIndex ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, role: r }));
                            setIsRoleDropdownOpen(false);
                            setFocusedRoleIndex(-1);
                          }}
                        >
                          {r}
                        </div>
                      ))
                    ) : (
                      formData.role.length > 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 bg-gray-50/50">
                          Use <span className="font-semibold text-gray-800">"{formData.role}"</span> as custom role.
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Years of Experience *</label>
                <select 
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white shadow-sm border border-blue-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 hover:border-blue-300 transition-all"
                >
                  <option value="">Select experience</option>
                  <option value="0-1">0 - 1 Year</option>
                  <option value="1-3">1 - 3 Years</option>
                  <option value="3-5">3 - 5 Years</option>
                  <option value="5-8">5 - 8 Years</option>
                  <option value="Other">Other</option>
                </select>
                {formData.experience === 'Other' && (
                  <input 
                    type="number"
                    value={otherExperience}
                    onChange={(e) => setOtherExperience(e.target.value)}
                    placeholder="Enter experience in years"
                    className="w-full px-4 py-2.5 bg-white shadow-sm border border-blue-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mt-2 hover:border-blue-300 transition-all"
                  />
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Submit Button */}
      <div className="w-full max-w-5xl mt-3">
        <button 
          onClick={handleSubmit}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          Submit & Find Matching Jobs
        </button>
      </div>

      {/* Trust Footer */}
      <div className="w-full max-w-5xl mt-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-2 md:mb-0">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <FiShield className="text-blue-600 text-lg" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Your Data is Safe with Us</h4>
            <p className="text-xs text-gray-500">We never share your details with anyone without your permission.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-600 font-medium">
          <div className="flex items-center"><FiCheckCircle className="mr-2 text-blue-600" /> 100% Secure</div>
          <div className="flex items-center"><BiBuildingHouse className="mr-2 text-blue-600" /> Verified Employers</div>
          <div className="flex items-center"><FiLock className="mr-2 text-blue-600" /> Privacy Protected</div>
        </div>
      </div>
    </div>
  );
};

export default GuestDiscovery;
