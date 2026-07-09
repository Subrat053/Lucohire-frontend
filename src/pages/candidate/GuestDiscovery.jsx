import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiShield, FiUpload, FiCheckCircle, FiLock } from 'react-icons/fi';
import { BiBuildingHouse } from 'react-icons/bi';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GuestDiscovery = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    phone: '',
    password: '',
    confirmPassword: '',
    skills: '',
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success && response.data?.data) {
        const parsed = response.data.data;
        setFormData(prev => ({
          ...prev,
          fullName: parsed.fullName || prev.fullName,
          emailId: parsed.email || prev.emailId,
          phone: parsed.phone || prev.phone,
          skills: parsed.skills?.length ? parsed.skills.join(', ') : prev.skills,
          experience: parsed.experienceYears ? getExperienceCategory(parsed.experienceYears) : prev.experience
        }));
        toast.success('Resume parsed successfully! Please complete missing details.');
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
    return '8+';
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const { fullName, emailId, phone, password, confirmPassword, skills, experience } = formData;
    if (!fullName || !emailId || !phone || !password || !confirmPassword || !skills || !experience) {
      return toast.error('Please fill in all required fields.');
    }

    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
      return toast.error('Please enter a valid email address.');
    }

    navigate('/unlock-matches', { state: { file, formData } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="w-full max-w-5xl mb-6">
        <button onClick={() => navigate('/')} className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center">
          &larr; Back
        </button>
      </div>

      <div className="w-full max-w-5xl bg-white shadow sm:rounded-lg flex flex-col md:flex-row overflow-hidden border border-gray-200">
        
        {/* Option 1: Upload Resume */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-gray-200 bg-blue-50/30">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <FiUpload className="text-blue-600 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Option 1: Upload Your Updated Resume</h2>
            <p className="text-gray-500 mb-8 max-w-xs">
              Upload your latest resume and let our AI find the best matching jobs for you.
            </p>

            <div 
              className={`w-full border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-white hover:bg-gray-50'}`}
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
              <p className="text-gray-700 font-medium">
                {isParsing ? 'Extracting details...' : 'Drag & drop your resume here'}
              </p>
              {!isParsing && (
                <>
                  <p className="text-gray-400 text-sm mb-4">or</p>
                  <button className="px-6 py-2 border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 pointer-events-none">
                    Choose File
                  </button>
                  <p className="text-xs text-gray-400 mt-4">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
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
        <div className="flex-1 p-8 relative">
          {/* OR Divider for Desktop */}
          <div className="hidden md:flex absolute top-1/2 -left-5 transform -translate-y-1/2 items-center justify-center bg-white border border-gray-200 h-10 w-10 rounded-full shadow-sm z-10">
            <span className="text-xs font-bold text-gray-500">OR</span>
          </div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Option 2: Fill Your Details Manually</h2>
            <p className="text-gray-500 max-w-xs">
              Complete your profile manually or review extracted details.
            </p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Full Name *</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email ID *</label>
                <input 
                  type="email" 
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                  placeholder="Enter your email id" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Mobile Number (with country code) *</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+919876543210" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Password *</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min 6 characters" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Confirm Password *</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Skills (Smart Filter) *</label>
                <input 
                  type="text" 
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g. UI/UX, React" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Years of Experience *</label>
                <select 
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
                >
                  <option value="">Select experience</option>
                  <option value="0-1">0 - 1 Year</option>
                  <option value="1-3">1 - 3 Years</option>
                  <option value="3-5">3 - 5 Years</option>
                  <option value="5-8">5 - 8 Years</option>
                  <option value="8+">8+ Years</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Submit Button */}
      <div className="w-full max-w-5xl mt-6">
        <button 
          onClick={handleSubmit}
          className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          Submit & Find Matching Jobs
        </button>
      </div>

      {/* Trust Footer */}
      <div className="w-full max-w-5xl mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <FiShield className="text-blue-600 text-xl" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Your Data is Safe with Us</h4>
            <p className="text-sm text-gray-500">We never share your details with anyone without your permission.</p>
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
