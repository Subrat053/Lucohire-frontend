import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiBriefcase, FiMail, FiPhone, FiUser, FiLock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RecruiterDiscovery = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    industry: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, companyName, email, phone, industry, password } = formData;
    
    if (!name || !companyName || !email || !phone || !industry || !password) {
      return toast.error('Please fill in all fields to proceed.');
    }
    
    // Navigate to recruiter-locked passing form state
    navigate('/recruiter-locked', { state: { recruiterData: formData } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto items-center p-6 gap-12">
        {/* Left Side: Value Prop */}
        <div className="flex-1 space-y-8">
          <div>
            <span className="text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-full text-sm">
              Recruiter Workspace
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-6 leading-tight">
              Hire Top Talent, <br className="hidden md:block" />
              <span className="text-purple-600">Faster & Smarter</span>
            </h1>
            <p className="text-xl text-gray-600 mt-4 leading-relaxed">
              Post a job for free and let our AI match you with the best candidates in your industry instantly.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">8.6M+ Active Candidates</h3>
                <p className="text-gray-500 text-sm">Access a massive pool of verified professionals.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">92% Match Accuracy</h3>
                <p className="text-gray-500 text-sm">AI ranks and shortlists the best candidates for you.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lead Capture Form */}
        <div className="w-full md:w-[500px]">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Free Account</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="john@acmecorp.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select 
                    name="industry"
                    required
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-700"
                  >
                    <option value="" disabled>Select Industry</option>
                    <option value="IT/Software">IT/Software</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="Create a password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Find Candidates Now
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                By clicking "Find Candidates Now", you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDiscovery;
