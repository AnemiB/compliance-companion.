import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, logout, getInspections, getCompanies, type Company, type Inspection } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, ClipboardList, Building2, Users, Search } from 'lucide-react';
import dolLogo from '@/assets/dol-logo.png';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-warning text-warning-foreground',
  completed: 'bg-info text-info-foreground',
  signed: 'bg-success text-success-foreground',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth || auth.role !== 'admin') { navigate('/'); return; }
    setInspections(getInspections());
    setCompanies(getCompanies());
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const filteredInspections = inspections.filter(i => i.companyName.toLowerCase().includes(search.toLowerCase()) || i.inspectorName.toLowerCase().includes(search.toLowerCase()));
  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dolLogo} alt="DoL" className="h-10 rounded bg-card p-0.5" />
            <div>
              <h1 className="text-lg font-bold text-primary-foreground">Labour Compliance System</h1>
              <p className="text-xs text-primary-foreground/70">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground">{auth?.name} (Admin)</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><LogOut className="mr-1 h-4 w-4" /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="flex items-center gap-4 p-4"><ClipboardList className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{inspections.length}</p><p className="text-sm text-muted-foreground">Total Inspections</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-4"><Building2 className="h-8 w-8 text-info" /><div><p className="text-2xl font-bold">{companies.length}</p><p className="text-sm text-muted-foreground">Registered Companies</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-4"><Users className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{inspections.filter(i => i.status === 'signed').length}</p><p className="text-sm text-muted-foreground">Signed Inspections</p></div></CardContent></Card>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search inspections or companies..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
        </div>

        <Tabs defaultValue="inspections">
          <TabsList>
            <TabsTrigger value="inspections">All Inspections</TabsTrigger>
            <TabsTrigger value="companies">All Companies</TabsTrigger>
          </TabsList>
          <TabsContent value="inspections">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Company</th><th className="p-3 text-left">Inspector</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Step</th><th className="p-3 text-left">Last Updated</th><th className="p-3 text-left">Actions</th></tr></thead>
                    <tbody>
                      {filteredInspections.map(ins => (
                        <tr key={ins.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{ins.companyName}</td>
                          <td className="p-3">{ins.inspectorName}</td>
                          <td className="p-3"><Badge className={statusColors[ins.status]}>{ins.status}</Badge></td>
                          <td className="p-3">{ins.currentStep}/5</td>
                          <td className="p-3">{new Date(ins.updatedAt).toLocaleDateString()}</td>
                          <td className="p-3"><Button size="sm" variant="outline" onClick={() => navigate(`/inspection/${ins.id}`)}>View</Button></td>
                        </tr>
                      ))}
                      {filteredInspections.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No inspections found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="companies">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Company Name</th><th className="p-3 text-left">Registration</th><th className="p-3 text-left">Owner</th><th className="p-3 text-left">Phone</th><th className="p-3 text-left">Address</th></tr></thead>
                    <tbody>
                      {filteredCompanies.map(c => (
                        <tr key={c.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3">{c.registrationNumber}</td>
                          <td className="p-3">{c.ownerName}</td>
                          <td className="p-3">{c.contactPhone}</td>
                          <td className="p-3">{c.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
