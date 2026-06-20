import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntelligenceData } from '@/lib/types';
import { AlertTriangle, Activity, Users, ShieldAlert, Zap, Clock } from 'lucide-react';

export function OperationsControlTower({ intelligence }: { intelligence: IntelligenceData }) {
  if (!intelligence) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-6 h-6 text-brand-green-dark" />
        <h2 className="text-xl font-bold text-slate-800">Operations Control Tower</h2>
        <Badge className="bg-brand-green-light/40 text-brand-green-dark border-brand-green-light/50 uppercase tracking-widest text-[10px]">Intelligence Active</Badge>
      </div>

      {/* SLA Early Warnings */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-3 border-b border-orange-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-800">
            <ShieldAlert className="w-4 h-4" /> SLA Early Warnings (Bottleneck Detection)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelligence.bottleneckSignals.length === 0 ? (
              <div className="text-sm text-slate-500 col-span-full">No active bottlenecks detected. Operations are smooth.</div>
            ) : (
              intelligence.bottleneckSignals.map((sig, i) => (
                <div key={i} className={`p-3 rounded-lg border ${sig.riskLevel === 'BREACHED' ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase text-slate-800">{sig.customer}</span>
                    <Badge className={sig.riskLevel === 'BREACHED' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}>{sig.riskLevel}</Badge>
                  </div>
                  <div className="text-xs font-medium text-slate-700">{sig.stage}</div>
                  <div className="text-xs text-slate-600 mt-1">{sig.reason}</div>
                  {sig.predictedDelayMinutes > 0 && <div className="text-xs text-red-600 font-bold mt-1">Delay: +{sig.predictedDelayMinutes} Min</div>}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QC & NCR Analytics */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-600" /> Quality Control Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-slate-50 border rounded text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Production Pass Rate</div>
                <div className={`text-2xl font-black ${intelligence.qcAnalytics.productionPassRate < 90 ? 'text-red-600' : 'text-green-600'}`}>
                  {intelligence.qcAnalytics.productionPassRate}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 border rounded text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Packing Pass Rate</div>
                <div className={`text-2xl font-black ${intelligence.qcAnalytics.packingPassRate < 90 ? 'text-red-600' : 'text-green-600'}`}>
                  {intelligence.qcAnalytics.packingPassRate}%
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-xs font-bold text-slate-700 mb-2">Top NCR Causes</h5>
              {intelligence.qcAnalytics.topFailureCauses.length === 0 ? (
                <div className="text-xs text-slate-500">No recorded failures.</div>
              ) : (
                <div className="space-y-2">
                  {intelligence.qcAnalytics.topFailureCauses.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{c.cause.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">{c.count} Cases</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h5 className="text-xs font-bold text-slate-700 mb-2">Recurring Issues</h5>
              {intelligence.ncrInsight.recurringIssues.length === 0 ? (
                <div className="text-xs text-slate-500">No recurring issues.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intelligence.ncrInsight.recurringIssues.slice(0, 5).map((iss, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{iss.issue}: {iss.count}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worker Performance Index */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Worker Performance Index (WPI)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Worker</th>
                  <th className="px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Score</th>
                  <th className="px-3 py-2 font-semibold text-slate-600 text-xs uppercase">QC Error</th>
                  <th className="px-3 py-2 font-semibold text-slate-600 text-xs uppercase">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {intelligence.workerPerformances.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-xs text-slate-500">Not enough data to calculate WPI.</td></tr>
                ) : (
                  intelligence.workerPerformances.map((wp, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{wp.name}</div>
                        <div className="text-[10px] text-slate-500">{wp.role}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={wp.efficiencyScore >= 90 ? 'bg-green-600' : wp.efficiencyScore >= 70 ? 'bg-orange-500' : 'bg-red-600'}>
                          {wp.efficiencyScore}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-red-600">{wp.qcErrorRate}%</td>
                      <td className="px-3 py-2 text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3"/> {wp.avgTaskTimeMin}m</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
