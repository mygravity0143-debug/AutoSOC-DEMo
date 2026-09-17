import React from 'react';
import { Network, Cpu, Radio, Shield, Server, Database, Activity, Monitor, ArrowRight, ArrowDown } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const nodes = [
    {
      id: 'ecus',
      title: 'Vehicle ECUs',
      subtitle: 'Engine, Brake, ADAS, IVI, Gateway',
      icon: Cpu,
      color: 'border-blue-500/40 text-blue-400 bg-blue-950/20'
    },
    {
      id: 'can-bus',
      title: 'CAN Network',
      subtitle: 'Differential Twisted Pair Physical Layer',
      icon: Radio,
      color: 'border-teal-500/40 text-teal-400 bg-teal-950/20'
    },
    {
      id: 'vcan',
      title: 'Linux SocketCAN',
      subtitle: 'vcan0 virtual kernel interface',
      icon: Network,
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20'
    },
    {
      id: 'collector',
      title: 'Python CAN Collector',
      subtitle: 'Raw frame ingestion & telemetry bridge',
      icon: Activity,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
    },
    {
      id: 'engine',
      title: 'Detection Engine',
      subtitle: '10 Automotive Rules & Risk Scoring',
      icon: Shield,
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/20'
    },
    {
      id: 'backend',
      title: 'Node.js Express Server',
      subtitle: 'REST APIs & WebSocket Broadcast',
      icon: Server,
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20'
    },
    {
      id: 'database',
      title: 'SQLite / PostgreSQL',
      subtitle: 'Audit logs, alerts, vehicles & incidents',
      icon: Database,
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20'
    },
    {
      id: 'frontend',
      title: 'React SOC Dashboard',
      subtitle: 'Real-time telemetry, triage & charts',
      icon: Monitor,
      color: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/30'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-400" />
            AutoSOC End-to-End System Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero-cloud, local-first dataflow pipeline from ECU arbitration to real-time incident triage
          </p>
        </div>
      </div>

      {/* Interactive Architecture Flowchart */}
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const isLast = index === nodes.length - 1;
            return (
              <React.Fragment key={node.id}>
                <div className={`p-4 rounded-xl border ${node.color} flex items-center justify-between transition hover:scale-[1.01]`}>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-700/50">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{node.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{node.subtitle}</p>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                    Step {index + 1}
                  </div>
                </div>

                {!isLast && (
                  <div className="flex justify-center my-1">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-gradient-to-b from-cyan-500 to-blue-500" />
                      <ArrowDown className="w-4 h-4 text-cyan-400 animate-bounce -mt-1" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Cloud-Free Architecture Guarantee Banner */}
      <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-300 flex items-center gap-3">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <strong className="text-emerald-400 font-semibold block">Air-Gapped / Zero External Cloud Dependency:</strong>
          AutoSOC executes 100% locally on workstation hardware. No AWS, Azure, GCP, CloudWatch, DynamoDB or third-party paid telemetry services are called.
        </div>
      </div>
    </div>
  );
};
