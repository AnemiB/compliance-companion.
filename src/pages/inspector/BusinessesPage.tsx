import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies, filterCompanies, addCompany, createNewInspection, saveInspection, getAuth, type Company, type CompanyFilters, type CompanyType, type OwnerType, type Province } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2, Phone, Mail, MapPin, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COMPANY_TYPES: { value: CompanyType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'sole-proprietor', label: 'Sole Proprietor' },
  { value: 'pty-ltd', label: '(Pty) Ltd' },
  { value: 'cc', label: 'Close Corporation' },
  { value: 'npo', label: 'NPO' },
  { value: 'public', label: 'Public Company' },
  { value: 'partnership', label: 'Partnership' },
];
const OWNER_TYPES: { value: OwnerType | 'all'; label: string }[] = [
  { value: 'all', label: 'All owners' },
  { value: 'south-african', label: 'South African' },
  { value: 'foreign-national', label: 'Foreign National' },
  { value: 'permanent-resident', label: 'Permanent Resident' },
  { value: 'corporate', label: 'Corporate' },
];
const PROVINCES: (Province | 'all')[] = ['all', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];

interface Recommendation {
  companyName: string;
  priority: 'critical' | 'high' | 'medium';
  reason: string;
  focusAreas: string[];
}

const BusinessesPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<CompanyFilters>({ search: '', companyType: 'all', ownerType: 'all', province: 'all', industry: 'all', complianceBand: 'all' });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<Company, 'id'>>({ name: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '', companyType: 'pty-ltd', ownerType: 'south-african', province: 'Gauteng', industry: '', employeeCount: 0, complianceScore: 70 });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [overview, setOverview] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const industries = Array.from(new Set(getCompanies().map(c => c.industry))).sort();
  const filtered = filterCompanies(filters);

  const handleAdd = () => {
    if (!form.name) return;
    addCompany(form);
    setCompanies(getCompanies());
    setForm({ name: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '', companyType: 'pty-ltd', ownerType: 'south-african', province: 'Gauteng', industry: '', employeeCount: 0, complianceScore: 70 });
    setShowAdd(false);
  };

  const handleInspect = (company: Company) => {
    if (!auth) return;
    const ins = createNewInspection(company.id, company.name, auth.name);
    saveInspection(ins);
    navigate(`/inspection/${ins.id}`);
  };

  const runAI = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-recommendations', {
        body: { companies: getCompanies() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
      setOverview(data.overview || '');
      toast.success('AI recommendations ready');
    } catch (e: any) {
      toast.error(e.message || 'Failed to get recommendations');
    } finally {
      setLoadingAI(false);
    }
  };

  const priorityColor = (p: string) => p === 'critical' ? 'bg-destructive text-destructive-foreground' : p === 'high' ? 'bg-warning text-warning-foreground' : 'bg-secondary text-secondary-foreground';
  const scoreColor = (s: number) => s < 50 ? 'text-destructive' : s < 75 ? 'text-warning' : 'text-success';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Businesses</h1>
          <p className="text-sm text-muted-foreground">Filter, prioritise and inspect registered companies</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add Company</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register New Company</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Registration Number</Label><Input value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} /></div>
                <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} /></div>
                <div>
                  <Label>Company Type</Label>
                  <Select value={form.companyType} onValueChange={v => setForm(p => ({ ...p, companyType: v as CompanyType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPANY_TYPES.filter(t => t.value !== 'all').map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner Type</Label>
                  <Select value={form.ownerType} onValueChange={v => setForm(p => ({ ...p, ownerType: v as OwnerType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{OWNER_TYPES.filter(t => t.value !== 'all').map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Province</Label>
                  <Select value={form.province} onValueChange={v => setForm(p => ({ ...p, province: v as Province }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROVINCES.filter(p => p !== 'all').map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Employee Count</Label><Input type="number" value={form.employeeCount} onChange={e => setForm(p => ({ ...p, employeeCount: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <div><Label>Owner Name</Label><Input value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
                <div><Label>Contact Email</Label><Input value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Register Company</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Recommendations Panel */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-primary" /> AI Audit Recommendations</CardTitle>
            <Button size="sm" onClick={runAI} disabled={loadingAI}>
              {loadingAI ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analysing…</> : <>Generate</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {overview && <p className="text-sm text-muted-foreground">{overview}</p>}
          {recommendations.length === 0 && !loadingAI && <p className="text-sm text-muted-foreground">Click <strong>Generate</strong> to let AI analyse compliance scores, industries, employee counts and inspection history to prioritise audits.</p>}
          {recommendations.map((r, i) => (
            <div key={i} className="rounded-md border bg-card p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">{r.companyName}</span>
                <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
              </div>
              <p className="mb-2 text-sm">{r.reason}</p>
              <div className="flex flex-wrap gap-1">
                {r.focusAreas.map((f, j) => <Badge key={j} variant="outline" className="text-xs">{f}</Badge>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by company or owner name..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label className="text-xs">Company Type</Label>
              <Select value={filters.companyType} onValueChange={v => setFilters(f => ({ ...f, companyType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COMPANY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Owner Type</Label>
              <Select value={filters.ownerType} onValueChange={v => setFilters(f => ({ ...f, ownerType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OWNER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Province</Label>
              <Select value={filters.province} onValueChange={v => setFilters(f => ({ ...f, province: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p === 'all' ? 'All provinces' : p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Industry</Label>
              <Select value={filters.industry} onValueChange={v => setFilters(f => ({ ...f, industry: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Compliance</Label>
              <Select value={filters.complianceBand} onValueChange={v => setFilters(f => ({ ...f, complianceBand: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high-risk">High risk (&lt;50)</SelectItem>
                  <SelectItem value="medium-risk">Medium risk (50–74)</SelectItem>
                  <SelectItem value="compliant">Compliant (75+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} of {companies.length} companies</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-primary" />{c.name}</CardTitle>
              <div className="flex flex-wrap gap-1 pt-1">
                <Badge variant="outline" className="text-[10px]">{c.companyType}</Badge>
                <Badge variant="outline" className="text-[10px]">{c.industry}</Badge>
                <Badge variant="outline" className="text-[10px]">{c.province}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Compliance</span>
                <span className={`font-bold ${scoreColor(c.complianceScore)}`}>{c.complianceScore}/100</span>
              </div>
              <p className="text-muted-foreground">Reg: {c.registrationNumber || 'N/A'}</p>
              <p><span className="font-medium">Owner:</span> {c.ownerName || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">Employees: {c.employeeCount.toLocaleString()}</p>
              {c.contactPhone && <p className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {c.contactPhone}</p>}
              {c.contactEmail && <p className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> {c.contactEmail}</p>}
              {c.address && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {c.address}</p>}
              {!c.lastInspectionDate && <p className="flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" /> Never inspected</p>}
              <Button size="sm" className="mt-2 w-full" onClick={() => handleInspect(c)}>Start Inspection</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No businesses match the current filters</p>}
    </div>
  );
};

export default BusinessesPage;
