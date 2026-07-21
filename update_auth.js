const fs = require('fs');
const file = 'src/pages/AuthPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const leftPanelRegex = /const LeftPanel = \(\{ mode \}\) => \{[\s\S]*?\n\};/m;
const newLeftPanel = `const LeftPanel = ({ mode }) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gray-900 overflow-hidden min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50 transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-r from-gray-900/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight">ServiceHub</span>
        </div>
      </div>

      <div className="relative z-10 max-w-lg mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
          Connect.<br/><span className="text-blue-400">Hire.</span><br/>Grow.
        </h1>
        <p className="text-lg text-gray-300 font-medium leading-relaxed mb-8 italic">
          "Join thousands of service providers and recruiters building their network and accelerating their growth today."
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-4">
            <img className="w-10 h-10 rounded-full border-2 border-gray-800" src="https://i.pravatar.cc/100?img=1" alt="User" />
            <img className="w-10 h-10 rounded-full border-2 border-gray-800" src="https://i.pravatar.cc/100?img=2" alt="User" />
            <img className="w-10 h-10 rounded-full border-2 border-gray-800" src="https://i.pravatar.cc/100?img=3" alt="User" />
            <img className="w-10 h-10 rounded-full border-2 border-gray-800" src="https://i.pravatar.cc/100?img=4" alt="User" />
          </div>
          <div className="text-sm">
            <div className="text-white font-bold">15,000+</div>
            <div className="text-gray-400">Active professionals</div>
          </div>
        </div>
      </div>
    </div>
  );
};`;

const returnRegex = /return \(\s*<div\s*className="min-h-screen flex items-center justify-center py-10 px-4"[\s\S]*?<div className="lg:hidden flex items-center gap-2 mb-6">/m;
const newReturn = `return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      <Seo
        title={pageTitle}
        description={t(
          "auth.pageDescription",
          "Login or create a Lucohire account to hire or find work faster.",
        )}
        canonicalPath={isLoginRoute ? "/login" : "/signup"}
        robots="noindex, nofollow"
      />

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-gray-800 lg:text-white transition text-xs sm:text-sm font-medium z-30 bg-black/10 lg:bg-black/30 hover:bg-black/20 lg:hover:bg-black/50 backdrop-blur-md rounded-full px-4 py-2 shadow-lg"
      >
        <HiArrowLeft className="w-4 h-4" /> {t("navbar.home")}
      </Link>

      {/* Left panel (Image + Quote) */}
      <LeftPanel mode={mode} />

      {/* Right panel (Form) */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 relative overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2 mb-8">`;

const closingRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<div id="recaptcha-container"><\/div>/m;
const newClosing = `</div>\n      </div>\n\n      <div id="recaptcha-container"></div>`;

let matched = true;
if (!content.match(leftPanelRegex)) { console.log("leftPanelRegex failed"); matched = false; }
if (!content.match(returnRegex)) { console.log("returnRegex failed"); matched = false; }
if (!content.match(closingRegex)) { console.log("closingRegex failed"); matched = false; }

if (matched) {
  content = content.replace(leftPanelRegex, newLeftPanel);
  content = content.replace(returnRegex, newReturn);
  content = content.replace(closingRegex, newClosing);
  fs.writeFileSync(file, content);
  console.log("Updated successfully");
} else {
  console.log("Failed to match regexes");
}
