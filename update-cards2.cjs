const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');

const cardRegex = /<div key=\{candidate\.id\} className=\"min-w-\[280px\] bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-shrink-0 flex flex-col hover:shadow-md transition duration-300\">[\s\S]*?(?=<\/div>\s*<\/div>\s*\)\}\s*<\/div>)/;
const cardMatch = code.match(cardRegex);
if (cardMatch) {
  const newCard = `<div key={candidate.id} className="min-w-[280px] bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex-shrink-0 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <img src={candidate.image} alt={candidate.name} className="w-16 h-16 rounded-full object-cover border border-gray-100" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{candidate.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{candidate.role}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{candidate.rating}</span>
                      <span>({candidate.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {candidate.badges?.map((badge, idx) => (
                    <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-100">
                      <ShieldCheck className="w-3 h-3" />
                      {badge}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500 mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {candidate.loc}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="font-bold text-xl text-gray-900 mb-4">{candidate.rate}</div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors text-sm">
                      View Profile
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>`;
  code = code.replace(cardMatch[0], newCard);
  fs.writeFileSync('src/pages/LandingPage.jsx', code);
  console.log('Card updated!');
} else {
  console.log('Card not found');
}
