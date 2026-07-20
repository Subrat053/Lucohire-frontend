const fs = require('fs');
const file = 'src/pages/provider/ApplicationSuccess.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '        {/* Earn extra income */}';
const endStr = '      {/* Right Column (Sidebar) */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find bounds');
  process.exit(1);
}

const replacement = `        {/* Earn extra income */}
        <div 
          className="rounded-3xl p-6 md:p-10 flex flex-col items-start justify-center relative overflow-hidden border border-emerald-50 w-full min-h-[300px] md:min-h-[350px]"
          style={{ backgroundImage: "url('/freelance-banner-bg.png')", backgroundSize: "cover", backgroundPosition: "center right", backgroundRepeat: "no-repeat" }}
        >
          {/* Gradient overlay to ensure text is readable on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f2faf7] via-[#f2faf7]/90 to-transparent w-[80%] md:w-2/3 z-0"></div>
          
          <div className="z-10 relative w-full md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a1b41] mb-4 leading-tight">Earn extra income in<br/>your free time</h2>
            <p className="text-base text-gray-800 md:text-gray-600 mb-8 max-w-sm font-medium">Enable Freelance Alerts and get notified about nearby projects that match your skills.</p>
            <button onClick={handleWhatsappCheckout} className="px-6 py-3 bg-[#0d8765] hover:bg-[#096c4f] text-white text-sm font-bold rounded-xl transition flex items-center gap-2 w-max shadow-md">
               Enable Freelance Alerts <FaWhatsapp className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>

      </div>
      
`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent);
console.log('Banner replaced');
