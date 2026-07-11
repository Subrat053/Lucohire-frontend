import React from 'react';
import { FiMail, FiArrowUpRight, FiArrowDownRight, FiMessageCircle, FiSmartphone } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const channels = [
  { icon: <FiMail className="w-5 h-5" />, bg: 'bg-blue-50', ic: 'text-blue-600', name: 'Email', sent: 1856, open: '47%', reply: '22%', click: '14%', bounce: '2.1%', upOpen: true, upReply: true },
  { icon: <FiMessageCircle className="w-5 h-5" />, bg: 'bg-blue-50', ic: 'text-indigo-600', name: 'LinkedIn', sent: 612, open: '62%', reply: '18%', click: '28%', bounce: '0%', upOpen: true, upReply: false },
  { icon: <FiSmartphone className="w-5 h-5" />, bg: 'bg-emerald-50', ic: 'text-emerald-600', name: 'WhatsApp', sent: 396, open: '78%', reply: '34%', click: '—', bounce: '0%', upOpen: true, upReply: true },
];

const campaignData = [
  { name: 'React Dev - Outreach Wave 1',   channel: 'Email',    sent: 280, opens: '52%', replies: '25%', hires: 3, status: 'Completed' },
  { name: 'Product Manager Pool',           channel: 'LinkedIn', sent: 180, opens: '68%', replies: '22%', hires: 2, status: 'Active'    },
  { name: 'DevOps Urgent Reach',            channel: 'WhatsApp', sent: 140, opens: '84%', replies: '38%', hires: 2, status: 'Active'    },
  { name: 'Passive Candidate Nurture',      channel: 'Email',    sent: 620, opens: '41%', replies: '18%', hires: 1, status: 'Active'    },
  { name: 'UX Designer Outreach',           channel: 'LinkedIn', sent: 110, opens: '71%', replies: '15%', hires: 1, status: 'Completed' },
  { name: 'Sales Team Expansion',           channel: 'WhatsApp', sent: 96,  opens: '76%', replies: '30%', hires: 0, status: 'Paused'    },
];

const weeklyStats = [
  { week: 'Week 1', emailSent: 520, linkedinSent: 180, whatsapp: 110, responses: 68 },
  { week: 'Week 2', emailSent: 480, linkedinSent: 165, whatsapp: 96,  responses: 72 },
  { week: 'Week 3', emailSent: 445, linkedinSent: 142, whatsapp: 112, responses: 65 },
  { week: 'Week 4', emailSent: 411, linkedinSent: 125, whatsapp: 78,  responses: 58 },
];

export default function OutreachAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Outreach Messages', value: '2,864', trend: '+22%', up: true  },
          { label: 'Overall Reply Rate',       value: '24%',   trend: '+3.2%',up: true  },
          { label: 'Hires from Outreach',      value: '9',     trend: '+2 vs last', up: true },
          { label: 'Avg. Response Time',       value: '4.2 hrs', trend: '-1.1 hrs', up: true },
        ].map((k, i) => (
          <SCard key={i} className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{k.label}</div>
            <div className="text-xl font-extrabold text-gray-900 mb-1">{k.value}</div>
            <div className={`text-[10px] font-bold flex items-center gap-0.5 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>
              <FiArrowUpRight className="w-3 h-3" /> {k.trend} vs last month
            </div>
          </SCard>
        ))}
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channels.map((c, i) => (
          <SCard key={i} className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className={`${c.bg} ${c.ic} p-2.5 rounded-xl`}>{c.icon}</div>
              <div>
                <div className="text-sm font-bold text-gray-900">{c.name}</div>
                <div className="text-[10px] font-semibold text-gray-500">{c.sent.toLocaleString()} messages sent</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Open Rate',  val: c.open,  up: c.upOpen  },
                { label: 'Reply Rate', val: c.reply, up: c.upReply },
                { label: 'Click Rate', val: c.click, up: true  },
                { label: 'Bounce',     val: c.bounce,up: false },
              ].map((stat, j) => (
                <div key={j} className="bg-gray-50 rounded-xl p-2.5">
                  <div className="text-[10px] text-gray-500 font-semibold mb-0.5">{stat.label}</div>
                  <div className="text-base font-extrabold text-gray-900">{stat.val}</div>
                </div>
              ))}
            </div>
          </SCard>
        ))}
      </div>

      {/* Campaign Performance */}
      <SCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Campaign Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Active and completed outreach campaigns</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3">Campaign</th>
                <th className="pb-3">Channel</th>
                <th className="pb-3 text-center">Sent</th>
                <th className="pb-3 text-center">Opens</th>
                <th className="pb-3 text-center">Replies</th>
                <th className="pb-3 text-center">Hires</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaignData.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="py-3.5 text-xs font-semibold text-gray-900">{row.name}</td>
                  <td className="py-3.5">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{row.channel}</span>
                  </td>
                  <td className="py-3.5 text-center text-xs font-semibold text-gray-700">{row.sent}</td>
                  <td className="py-3.5 text-center text-xs font-bold text-blue-600">{row.opens}</td>
                  <td className="py-3.5 text-center text-xs font-bold text-emerald-600">{row.replies}</td>
                  <td className="py-3.5 text-center text-xs font-bold text-gray-900">{row.hires}</td>
                  <td className="py-3.5 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                      row.status === 'Paused' ? 'bg-orange-50 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SCard>

      {/* Weekly Activity */}
      <SCard className="p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Weekly Activity Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[420px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-3">Week</th>
                <th className="pb-3 text-center text-blue-600">Emails</th>
                <th className="pb-3 text-center text-indigo-600">LinkedIn</th>
                <th className="pb-3 text-center text-emerald-600">WhatsApp</th>
                <th className="pb-3 text-right">Total Responses</th>
              </tr>
            </thead>
            <tbody>
              {weeklyStats.map((w, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="py-3 text-xs font-bold text-gray-800">{w.week}</td>
                  <td className="py-3 text-center text-xs font-semibold text-blue-700">{w.emailSent}</td>
                  <td className="py-3 text-center text-xs font-semibold text-indigo-700">{w.linkedinSent}</td>
                  <td className="py-3 text-center text-xs font-semibold text-emerald-700">{w.whatsapp}</td>
                  <td className="py-3 text-right text-xs font-bold text-gray-900">{w.responses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SCard>

      {/* AI Tip */}
      <SCard className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl shrink-0"><HiSparkles className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900 mb-2">Outreach Optimization Insight</h3>
            <p className="text-xs text-emerald-800/80 leading-relaxed">
              WhatsApp has your highest open rate (78%) and reply rate (34%). Consider shifting more passive candidate outreach to WhatsApp. Personalized messages sent between 10 AM – 12 PM and 4 PM – 6 PM IST tend to get 40% higher response rates.
            </p>
          </div>
        </div>
      </SCard>
    </div>
  );
}
