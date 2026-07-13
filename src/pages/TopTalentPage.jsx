import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerAPI } from '../services/api';
import { MapPin, Star, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function TopTalentPage() {
  const navigate = useNavigate();
  const [topTalent, setTopTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    const fetchTopTalent = async () => {
      setLoading(true);
      try {
        const { data } = await providerAPI.getTopTalent({ limit: 20, page });
        if (data?.success && data?.data) {
          setTopTalent(data.data);
          if (data.pagination) setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Error fetching top talent:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopTalent();
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
        </button>

        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Top Talent Available for <span className="text-blue-600">Hourly Work</span>
          </h1>
          <p className="text-gray-500 max-w-2xl text-sm sm:text-base">
            Browse our curated list of verified freelancers and professionals ready to take on your hourly projects immediately. 
            Connect with them directly via WhatsApp or Call.
          </p>
        </div>

        {loading && topTalent.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {topTalent.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-lg">No top talent found at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {topTalent.map(candidate => (
                  <div key={candidate._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    
                    {/* Availability Badge */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-semibold text-green-700">Available Today</span>
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-start gap-3 mb-4">
                      {candidate.profilePhoto ? (
                        <img src={candidate.profilePhoto} alt={candidate.profileName} className="w-14 h-14 rounded-full flex-shrink-0 object-cover border border-gray-100" />
                      ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${candidate.avatarBg || 'bg-blue-100 text-blue-700'}`}>
                          {candidate.profileName?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[15px] text-gray-900 truncate" title={candidate.profileName}>
                          {candidate.profileName}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1 truncate">{candidate.primaryRole || 'Freelancer'} · {candidate.experienceYears || 0} yrs</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-semibold text-gray-800">{candidate.rating || 5.0}</span>
                          <span className="text-[10px] text-gray-400">({candidate.reviewCount || 0})</span>
                        </div>
                      </div>
                    </div>

                    {/* Location Badge */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{candidate.city || 'Remote'}</span>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {candidate.skills?.slice(0, 4).map((tag, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">
                          {tag}
                        </span>
                      ))}
                      {(candidate.skills?.length || 0) > 4 && (
                        <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-100">
                          +{candidate.skills.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Rate & Actions */}
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-500 font-medium">Starting from</span>
                        <div className="font-bold text-lg text-gray-900">
                          ₹{candidate.hourlyRate || 'Negotiable'}<span className="text-xs font-normal text-gray-400">/hr</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button 
                          onClick={() => {
                            if (candidate.user?.whatsappNumber) {
                              window.open(`https://wa.me/${candidate.user.whatsappNumber}`, '_blank');
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-xs flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          WhatsApp
                        </button>
                        <button 
                          onClick={() => {
                            if (candidate.user?.whatsappNumber) {
                              window.open(`tel:${candidate.user.whatsappNumber}`);
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-md transition-all text-xs flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          Call Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex gap-1 mx-2">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                        page === i + 1 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={page === pagination.pages}
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
