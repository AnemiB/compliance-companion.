import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, logout, getInspections, getCompanies, searchCompanies, addCompany, createNewInspection, saveInspection, type Company, type Inspection } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, FileText, LogOut, ClipboardList, Building2 } from 'lucide-react';
import dolLogo from '@/assets/dol-logo.jpg';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-warning text-warning-foreground',
  completed: 'bg-info text-info-foreground',
  signed: 'bg-success text-success-foreground',
};

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '' });

  useEffect(() => {
    if (!auth || auth.role !== 'inspector') { navigate('/'); return; }
    setInspections(getInspections().filter(i => i.inspectorName === auth.name));
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) setSearchResults(searchCompanies(searchQuery));
    else setSearchResults([]);
  }, [searchQuery]);

  const handleStartInspection = (company: Company) => {
    const inspection = createNewInspection(company.id, company.name, auth!.name);
    saveInspection(inspection);
    navigate(`/inspection/${inspection.id}`);
  };

  const handleAddCompany = () => {
    if (!newCompany.name) return;
    const company = addCompany(newCompany);
    setNewCompany({ name: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '' });
    setShowAddCompany(false);
    handleStartInspection(company);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const savedInspections = inspections.filter(i => i.status !== 'signed');
  const completedInspections = inspections.filter(i => i.status === 'signed');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dolLogo} alt="DoL Logo" className="h-10 rounded bg-card p-0.5" />
            <div>
              <h1 className="text-lg font-bold text-primary-foreground">Labour Compliance System</h1>
              <p className="text-xs text-primary-foreground/70">Inspector Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground">{auth?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="flex items-center gap-4 p-4"><ClipboardList className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{inspections.length}</p><p className="text-sm text-muted-foreground">Total Inspections</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-4"><FileText className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{savedInspections.length}</p><p className="text-sm text-muted-foreground">In Progress</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-4"><Building2 className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{completedInspections.length}</p><p className="text-sm text-muted-foreground">Completed & Signed</p></div></CardContent></Card>
        </div>

        {/* Search / New Inspection */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Search Company & Start Inspection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Search company name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
              <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-1 h-4 w-4" /> Add Company</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Company Name *</Label><Input value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Registration Number</Label><Input value={newCompany.registrationNumber} onChange={e => setNewCompany(p => ({ ...p, registrationNumber: e.target.value }))} /></div>
                    <div><Label>Owner Name</Label><Input value={newCompany.ownerName} onChange={e => setNewCompany(p => ({ ...p, ownerName: e.target.value }))} /></div>
                    <div><Label>Contact Phone</Label><Input value={newCompany.contactPhone} onChange={e => setNewCompany(p => ({ ...p, contactPhone: e.target.value }))} /></div>
                    <div><Label>Contact Email</Label><Input value={newCompany.contactEmail} onChange={e => setNewCompany(p => ({ ...p, contactEmail: e.target.value }))} /></div>
                    <div><Label>Address</Label><Input value={newCompany.address} onChange={e => setNewCompany(p => ({ ...p, address: e.target.value }))} /></div>
                    <Button onClick={handleAddCompany} className="w-full">Add & Start Inspection</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {searchResults.length > 0 && (
              <div className="divide-y rounded-md border">
                {searchResults.map(company => (
                  <div key={company.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.registrationNumber} • {company.address}</p>
                    </div>
                    <Button size="sm" onClick={() => handleStartInspection(company)}>Inspect</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Inspections */}
        {savedInspections.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Saved Inspections (In Progress)</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y">
                {savedInspections.map(ins => (
                  <div key={ins.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{ins.companyName}</p>
                      <p className="text-sm text-muted-foreground">Step {ins.currentStep}/5 • {new Date(ins.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[ins.status]}>{ins.status}</Badge>
                      <Button size="sm" onClick={() => navigate(`/inspection/${ins.id}`)}>Continue</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed */}
        {completedInspections.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Completed Inspections</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y">
                {completedInspections.map(ins => (
                  <div key={ins.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{ins.companyName}</p>
                      <p className="text-sm text-muted-foreground">Signed: {ins.signedAt ? new Date(ins.signedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[ins.status]}>{ins.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/inspection/${ins.id}`)}>View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default InspectorDashboard;
