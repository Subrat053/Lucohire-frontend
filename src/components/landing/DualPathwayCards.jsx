import { Users, Briefcase, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DualPathwayCards({ user }) {
  if (user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="grid md:grid-cols-2 gap-6">
      
        {/* Candidate Card */}
        <div className="bg-[#f8fbff] border border-blue-100 rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden group hover:shadow-lg transition duration-300">
          <div className="flex items-center mb-5">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-50 mr-3 text-blue-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">I&apos;m a Candidate</h2>
              <p className="text-xs text-gray-500 mt-0.5">Discover verified opportunities that match your skills and goals.</p>
            </div>
          </div>
          <div className="space-y-3.5 mb-6 flex-1">
            {[
              { title: 'AI-Matched Opportunities', desc: 'Get job recommendations that perfectly match your skills, experience & goals.' },
              { title: 'One Profile, Global Opportunities', desc: 'Build one profile and access opportunities across India and 5+ countries.' },
              { title: 'AI Career Insights', desc: 'Get AI resume score, skill gap analysis and know why you\'re not getting hired.' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{feature.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link 
            to="/candidate-landing"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm"
          >
            Find Matching Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recruiter Card */}
        <div className="bg-[#f6fcf8] border border-green-100 rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden group hover:shadow-lg transition duration-300">
          <div className="flex items-center mb-5">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-50 mr-3 text-green-500">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">I&apos;m a Recruiter</h2>
              <p className="text-xs text-gray-500 mt-0.5">Find and hire top talent faster and build high-performing teams.</p>
            </div>
          </div>
          <div className="space-y-3.5 mb-6 flex-1">
            {[
              { title: 'AI Shortlisted Candidates', desc: 'Get AI-matched and pre-screened candidates who fit your job requirements.' },
              { title: 'Verified & Skilled Talent Pool', desc: 'Access a reliable pool of verified and job-ready professionals.' },
              { title: 'Post Jobs & Hire Faster', desc: 'Post your job for free, reach the right talent, and hire with confidence.' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{feature.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link 
            to="/recruiter-discovery"
            className="w-full py-3 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm block text-center"
          >
            <div className="flex items-center justify-center gap-2">
              Post Free Job <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
