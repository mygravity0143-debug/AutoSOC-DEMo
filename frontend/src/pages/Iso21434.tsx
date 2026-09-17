import React from 'react';
import { BookOpen, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Iso21434Page: React.FC = () => {
  const sections: Array<{
    clause: string;
    title: string;
    desc: string;
    mapping: string;
  }> = [
    {
      clause: 'ISO/SAE 21434 §5',
      title: 'Cybersecurity Management',
      desc: 'Governance, process ownership, and lifecycle readiness for vehicle cybersecurity.',
      mapping: 'AutoSOC includes fleet-level monitoring, threat triage, incident handling workflows, and analyst review across connected vehicle systems.'
    },
    {
      clause: 'ISO/SAE 21434 §6',
      title: 'Concept Phase',
      desc: 'Early identification of cybersecurity threats and security goals for vehicle functions.',
      mapping: 'The platform models threat categories, attack surfaces, ECU risk scores, and security states to support concept-level risk awareness.'
    },
    {
      clause: 'ISO/SAE 21434 §7',
      title: 'Product Development',
      desc: 'Design-time control of security engineering and validation activities.',
      mapping: 'Vehicle diagnostics, ECU inventory, firmware version tracking, and vulnerability management support product cyber engineering reviews.'
    },
    {
      clause: 'ISO/SAE 21434 §8',
      title: 'Production and Operation',
      desc: 'Post-production monitoring, attack detection, and response in live vehicle environments.',
      mapping: 'The CAN monitor, detection engine, alert queue, and incident lifecycle directly emulate post-production operational monitoring.'
    },
    {
      clause: 'ISO/SAE 21434 §9',
      title: 'Response to Vulnerabilities',
      desc: 'Identification, assessment, and handling of discovered security weaknesses.',
      mapping: 'AutoSOC includes vulnerability records, severity scoring, remediation playbooks, and analyst response workflows for affected ECUs.'
    },
    {
      clause: 'ISO/SAE 21434 §10',
      title: 'Monitoring and Improvement',
      desc: 'Ongoing operational learning and continuous security posture improvement.',
      mapping: 'System health monitoring, analytics dashboards, alert trends, and live risk scoring enable continuous cybersecurity improvement.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Road Vehicles Cybersecurity
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Educational alignment of AutoSOC features to international automotive engineering standards
          </p>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">Standard Compliance Notice:</strong>
          “This project is an educational cybersecurity monitoring simulation.”
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {sec.clause}
              </span>
              <span className="text-[11px] font-mono text-slate-500"></span>
            </div>

            <h3 className="text-sm font-bold text-slate-100">{sec.title}</h3>
            <p className="text-xs text-slate-400">{sec.desc}</p>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <span className="text-emerald-400 font-semibold block mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> AutoSOC Implementation:
              </span>
              <p className="text-slate-300 font-mono text-[11px]">{sec.mapping}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
