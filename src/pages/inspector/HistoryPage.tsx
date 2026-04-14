import { useState, useEffect } from 'react';
import { getAuth, getInspections, type Inspection } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { History, Search, Filter } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-warning text-warning-foreground',
  completed: 'bg-info text-info-foreground',
  signed: 'bg-success text-success-foreground',
};

const HistoryPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!auth) return;
    setInspections(getInspections().filter(i => i.inspectorName === auth.name).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);

  const filtered = inspections
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => i.companyName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inspection History</h1>
        <p className="text-sm text-muted-foreground">Full history of all your inspections</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search by company name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in-progress">In Progress</option>
          <option value="signed">Signed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <History className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">No Inspections Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your inspection history will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">Company</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Step</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Last Updated</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ins => (
                    <tr key={ins.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{ins.companyName}</td>
                      <td className="p-3"><Badge className={statusColors[ins.status]}>{ins.status}</Badge></td>
                      <td className="p-3">{ins.currentStep}/5</td>
                      <td className="p-3">{new Date(ins.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">{new Date(ins.updatedAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/inspection/${ins.id}`)}>
                          {ins.status === 'signed' ? 'View' : 'Continue'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoryPage;
