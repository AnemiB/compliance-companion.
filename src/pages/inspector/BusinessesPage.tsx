import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies, searchCompanies, addCompany, createNewInspection, saveInspection, getAuth, type Company } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Building2, Phone, Mail, MapPin } from 'lucide-react';

const BusinessesPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '' });

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const filtered = search ? searchCompanies(search) : companies;

  const handleAdd = () => {
    if (!form.name) return;
    const c = addCompany(form);
    setCompanies(getCompanies());
    setForm({ name: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '' });
    setShowAdd(false);
  };

  const handleInspect = (company: Company) => {
    if (!auth) return;
    const ins = createNewInspection(company.id, company.name, auth.name);
    saveInspection(ins);
    navigate(`/inspection/${ins.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Businesses</h1>
          <p className="text-sm text-muted-foreground">Manage and inspect registered companies</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add Company</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Company</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Registration Number</Label><Input value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} /></div>
              <div><Label>Owner Name</Label><Input value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} /></div>
              <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
              <div><Label>Contact Email</Label><Input value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Register Company</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-primary" />{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Reg: {c.registrationNumber || 'N/A'}</p>
              <p className="flex items-center gap-1"><span className="font-medium">Owner:</span> {c.ownerName || 'N/A'}</p>
              {c.contactPhone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.contactPhone}</p>}
              {c.contactEmail && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.contactEmail}</p>}
              {c.address && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {c.address}</p>}
              <Button size="sm" className="mt-2 w-full" onClick={() => handleInspect(c)}>Start Inspection</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No businesses found</p>}
    </div>
  );
};

export default BusinessesPage;
