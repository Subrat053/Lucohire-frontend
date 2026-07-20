const fs = require('fs');
let code = fs.readFileSync('src/pages/provider/AiCareerCoach.jsx', 'utf8');

// Replace sizes carefully
code = code.replace(/text-\[9px\]/g, 'text-xs');
code = code.replace(/text-\[10px\]/g, 'text-sm');
code = code.replace(/text-(xs|sm|base)/g, (match, p1) => {
  if (p1 === 'xs') return 'text-sm';
  if (p1 === 'sm') return 'text-base';
  if (p1 === 'base') return 'text-lg';
  return match;
});

// Icon sizes
code = code.replace(/w-3\.5 h-3\.5/g, 'w-5 h-5');
code = code.replace(/w-4 h-4/g, 'w-6 h-6');
code = code.replace(/w-2\.5 h-2\.5/g, 'w-4 h-4');
code = code.replace(/w-3 h-3/g, 'w-4 h-4');

// Layout spacing
code = code.replace(/p-3 md:p-4/g, 'p-6 md:p-8');
code = code.replace(/gap-4/g, 'gap-8');
code = code.replace(/space-y-4/g, 'space-y-6');

// Remove Coach Summary Stats Grid
const summaryStartStr = `          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">`;
const summaryEndStr = `            </div>
          ))}
        </div>
      </div>`;
const summaryIdx1 = code.indexOf(summaryStartStr);
if (summaryIdx1 !== -1) {
  const replacement = `          </div>
        </div>
      </div>`;
  const substringToReplace = code.substring(summaryIdx1, code.indexOf(summaryEndStr, summaryIdx1) + summaryEndStr.length);
  code = code.replace(substringToReplace, replacement);
}

// Remove Upcoming Sessions
const upcomingStartStr = `      {/* Upcoming Sessions */}`;
const upcomingEndStr = `          ))}
        </div>
      </div>`;
const upcomingIdx1 = code.indexOf(upcomingStartStr);
if (upcomingIdx1 !== -1) {
  // also get the blank line before it if possible
  const substringToReplace2 = code.substring(upcomingIdx1, code.indexOf(upcomingEndStr, upcomingIdx1) + upcomingEndStr.length);
  code = code.replace(substringToReplace2, '');
}

fs.writeFileSync('src/pages/provider/AiCareerCoach.jsx', code);
console.log('Update applied successfully');
