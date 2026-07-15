import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerAPI } from '../services/api';
import { MapPin, Star, MessageCircle, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Seo from '../components/common/Seo';

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
      <Seo 
        title="Top Talent Available for Hourly Work" 
        description="Browse our curated list of verified freelancers and professionals ready to take on your hourly projects immediately. Connect with them directly via WhatsApp or Call."
        canonicalPath="/top-talent"
      />
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
                  <div key={candidate._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group">
                    
                    {/* Top right floating badge */}
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                      Top Rated
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-start gap-3 mb-4 mt-2">
                      {candidate.profilePhoto ? (
                        <img src={candidate.profilePhoto} alt={candidate.profileName} className="w-14 h-14 rounded-full flex-shrink-0 object-cover ring-2 ring-gray-100" />
                      ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ring-2 ring-gray-100 ${candidate.avatarBg || 'bg-blue-100 text-blue-700'}`}>
                          {candidate.profileName?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[15px] text-gray-900 truncate" title={candidate.profileName}>
                          {candidate.profileName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium truncate">{candidate.primaryRole || 'Freelancer'} · {candidate.city || 'India'}</p>
                      </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-blue-50 text-blue-700 rounded-lg p-2 text-center border border-blue-100/50">
                        <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
                        <div className="text-[9px] font-bold uppercase tracking-wider">Verified</div>
                      </div>
                      <div className="flex-1 bg-amber-50 text-amber-700 rounded-lg p-2 text-center border border-amber-100/50">
                        <Star className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500 fill-amber-500" />
                        <div className="text-[9px] font-bold uppercase tracking-wider">100% Satisfaction</div>
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="space-y-1.5 mb-5 flex-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Starting from</span>
                        <span className="font-bold text-gray-900">₹{candidate.hourlyRate || 'Negotiable'}/hr</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Job Success</span>
                        <span className="font-bold text-gray-900">100%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Total earned</span>
                        <span className="font-bold text-gray-900">₹ 1,00,000+</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto">
                      <button 
                        onClick={() => {
                          if (candidate.user?.whatsappNumber) {
                            window.open(`https://wa.me/${candidate.user.whatsappNumber}`, '_blank');
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#128C7E] hover:shadow-lg hover:shadow-green-500/20 transition-all text-sm flex items-center justify-center gap-2 transform active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        Chat on WhatsApp
                      </button>
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
