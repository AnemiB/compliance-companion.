import { useState, useEffect } from 'react';
import { getAuth, getInspections, getCompanies, type Inspection } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle, AlertTriangle, Clock, Building2 } from 'lucide-react';

const ReportsPage = () => {
  const auth = getAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [companyCount, setCompanyCount] = useState(0);

  useEffect(() => {
    if (!auth) return;
    const all = getInspections().filter(i => i.inspectorName === auth.name);
    setInspections(all);
    setCompanyCount(getCompanies().length);
  }, []);

  const signed = inspections.filter(i => i.status === 'signed');
  const inProgress = inspections.filter(i => i.status === 'in-progress' || i.status === 'draft');

  // Compliance summary from signed inspections
  const complianceSummary = signed.reduce(
    (acc, ins) => {
      const cs = ins.complianceStatuses;
      (['uifStatus', 'cipcStatus', 'payeStatus', 'coidaStatus'] as const).forEach(f => {
        if (cs[f] === 'compliant') acc.compliant++;
        else if (cs[f] === 'non-compliant') acc.nonCompliant++;
        else acc.pending++;
      });
      if (ins.ohsCompliance.overallSafe) acc.ohsSafe++;
      else acc.ohsUnsafe++;
      return acc;
    },
    { compliant: 0, nonCompliant: 0, pending: 0, ohsSafe: 0, ohsUnsafe: 0 }
  );

  // Monthly breakdown
  const monthlyData: Record<string, number> = {};
  inspections.forEach(ins => {
    const d = new Date(ins.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = (monthlyData[key] || 0) + 1;
  });
  const months = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxMonthly = Math.max(...months.map(m => m[1]), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Inspection analytics and compliance overview</p>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><CheckCircle className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{signed.length}</p><p className="text-sm text-muted-foreground">Completed</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{inProgress.length}</p><p className="text-sm text-muted-foreground">In Progress</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><Building2 className="h-8 w-8 text-info" /><div><p className="text-2xl font-bold">{companyCount}</p><p className="text-sm text-muted-foreground">Companies</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{inspections.length}</p><p className="text-sm text-muted-foreground">Total Inspections</p></div></CardContent></Card>
      </div>

      {/* Compliance Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compliance Status Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {signed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed inspections to analyze.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>Compliant</span><span className="font-bold text-success">{complianceSummary.compliant}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{ width: `${(complianceSummary.compliant / (complianceSummary.compliant + complianceSummary.nonCompliant + complianceSummary.pending || 1)) * 100}%` }} /></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>Non-Compliant</span><span className="font-bold text-destructive">{complianceSummary.nonCompliant}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-destructive" style={{ width: `${(complianceSummary.nonCompliant / (complianceSummary.compliant + complianceSummary.nonCompliant + complianceSummary.pending || 1)) * 100}%` }} /></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>Pending</span><span className="font-bold text-warning">{complianceSummary.pending}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-warning" style={{ width: `${(complianceSummary.pending / (complianceSummary.compliant + complianceSummary.nonCompliant + complianceSummary.pending || 1)) * 100}%` }} /></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>OHS Safety Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {signed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed inspections to analyze.</p>
            ) : (
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle className="h-10 w-10 text-success" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{complianceSummary.ohsSafe}</p>
                  <p className="text-sm text-muted-foreground">Safe</p>
                </div>
                <div className="text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{complianceSummary.ohsUnsafe}</p>
                  <p className="text-sm text-muted-foreground">Unsafe</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader><CardTitle>Monthly Inspections</CardTitle></CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="flex items-end gap-3" style={{ height: 200 }}>
              {months.map(([month, count]) => (
                <div key={month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium">{count}</span>
                  <div className="w-full rounded-t bg-primary" style={{ height: `${(count / maxMonthly) * 160}px` }} />
                  <span className="text-[10px] text-muted-foreground">{month.slice(5)}/{month.slice(2, 4)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
