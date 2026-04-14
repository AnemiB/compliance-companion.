import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth, getInspection, saveInspection, type Inspection, type Employee } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Save, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import dolLogo from '@/assets/dol-logo.png';
import DocumentActions, { type Attachment } from '@/components/DocumentActions';

const steps = [
  'Business Information',
  'Employee Information',
  'Tax Information',
  'Compliance Statuses',
  'OHS Compliance',
];

const statusOptions = ['compliant', 'non-compliant', 'pending', 'not-registered'] as const;
const buildingConditions = ['good', 'fair', 'poor', 'dangerous'] as const;

const InspectionForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    if (!auth) { navigate('/'); return; }
    if (id) {
      const ins = getInspection(id);
      if (ins) setInspection(ins);
      else navigate('/dashboard');
    }
  }, [id]);

  if (!inspection) return null;

  const isSigned = inspection.status === 'signed';
  const step = inspection.currentStep;

  const update = (partial: Partial<Inspection>) => {
    setInspection(prev => prev ? { ...prev, ...partial } : prev);
  };

  const handleSave = () => {
    if (!inspection) return;
    const updated = { ...inspection, status: inspection.status === 'draft' ? 'in-progress' as const : inspection.status };
    saveInspection(updated);
    setInspection(updated);
    toast.success('Inspection saved successfully');
  };

  const handleSaveAndExit = () => {
    handleSave();
    navigate('/dashboard');
  };

  const handleNext = () => {
    handleSave();
    if (step < 5) update({ currentStep: step + 1 });
  };

  const handlePrev = () => {
    if (step > 1) update({ currentStep: step - 1 });
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const signed: Inspection = { ...inspection, status: 'signed', signedAt: new Date().toISOString(), signature: dataUrl };
    saveInspection(signed);
    setInspection(signed);
    toast.success('Inspection signed and completed!');
  };

  // Signature drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSigned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isSigned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const addEmployee = () => {
    const emp: Employee = { id: Date.now().toString(), name: '', position: '', status: 'active' };
    update({ employeeInfo: { ...inspection.employeeInfo, employees: [...inspection.employeeInfo.employees, emp] } });
  };

  const removeEmployee = (empId: string) => {
    update({ employeeInfo: { ...inspection.employeeInfo, employees: inspection.employeeInfo.employees.filter(e => e.id !== empId) } });
  };

  const updateEmployee = (empId: string, field: keyof Employee, value: string) => {
    update({
      employeeInfo: {
        ...inspection.employeeInfo,
        employees: inspection.employeeInfo.employees.map(e => e.id === empId ? { ...e, [field]: value } : e),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dolLogo} alt="DoL" className="h-10 rounded bg-card p-0.5" />
            <div>
              <h1 className="text-lg font-bold text-primary-foreground">Inspection: {inspection.companyName}</h1>
              <p className="text-xs text-primary-foreground/70">Step {step} of 5 — {steps[step - 1]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isSigned && <Button variant="outline" size="sm" onClick={handleSaveAndExit} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Save className="mr-1 h-4 w-4" /> Save & Exit</Button>}
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><ArrowLeft className="mr-1 h-4 w-4" /> Dashboard</Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="mx-auto max-w-4xl px-6 pt-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i + 1 <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
              {i < 4 && <div className={`h-1 flex-1 mx-1 rounded ${i + 1 < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          {steps.map((s, i) => <span key={i} className="w-16 text-center">{s}</span>)}
        </div>
      </div>

      <main className="mx-auto max-w-4xl p-6">
        {/* Step 1: Business Information */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Company Name</Label><Input disabled={isSigned} value={inspection.businessInfo.companyName} onChange={e => update({ businessInfo: { ...inspection.businessInfo, companyName: e.target.value } })} /></div>
                <div><Label>Registration Number</Label><Input disabled={isSigned} value={inspection.businessInfo.registrationNumber} onChange={e => update({ businessInfo: { ...inspection.businessInfo, registrationNumber: e.target.value } })} /></div>
                <div><Label>Owner Name</Label><Input disabled={isSigned} value={inspection.businessInfo.ownerName} onChange={e => update({ businessInfo: { ...inspection.businessInfo, ownerName: e.target.value } })} /></div>
                <div><Label>Contact Phone</Label><Input disabled={isSigned} value={inspection.businessInfo.contactPhone} onChange={e => update({ businessInfo: { ...inspection.businessInfo, contactPhone: e.target.value } })} /></div>
                <div><Label>Contact Email</Label><Input disabled={isSigned} value={inspection.businessInfo.contactEmail} onChange={e => update({ businessInfo: { ...inspection.businessInfo, contactEmail: e.target.value } })} /></div>
                <div><Label>Company Address</Label><Input disabled={isSigned} value={inspection.businessInfo.address} onChange={e => update({ businessInfo: { ...inspection.businessInfo, address: e.target.value } })} /></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Employee Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Information</CardTitle>
                {!isSigned && <Button size="sm" onClick={addEmployee}><Plus className="mr-1 h-4 w-4" /> Add Employee</Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Total Number of Employees</Label><Input type="number" disabled={isSigned} value={inspection.employeeInfo.totalEmployees} onChange={e => update({ employeeInfo: { ...inspection.employeeInfo, totalEmployees: parseInt(e.target.value) || 0 } })} /></div>
              {inspection.employeeInfo.employees.map((emp, idx) => (
                <div key={emp.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Employee {idx + 1}</span>
                    {!isSigned && <Button variant="ghost" size="sm" onClick={() => removeEmployee(emp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><Label>Full Name</Label><Input disabled={isSigned} value={emp.name} onChange={e => updateEmployee(emp.id, 'name', e.target.value)} /></div>
                    <div><Label>Position / Role</Label><Input disabled={isSigned} value={emp.position} onChange={e => updateEmployee(emp.id, 'position', e.target.value)} /></div>
                    <div>
                      <Label>Status</Label>
                      <select disabled={isSigned} value={emp.status} onChange={e => updateEmployee(emp.id, 'status', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="contract">Contract</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {inspection.employeeInfo.employees.length === 0 && <p className="text-sm text-muted-foreground">No employees added. Click "Add Employee" to begin.</p>}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Tax Information */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Tax Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Tax Number</Label><Input disabled={isSigned} value={inspection.taxInfo.taxNumber} onChange={e => update({ taxInfo: { ...inspection.taxInfo, taxNumber: e.target.value } })} /></div>
                <div>
                  <Label>Tax Status</Label>
                  <select disabled={isSigned} value={inspection.taxInfo.taxStatus} onChange={e => update({ taxInfo: { ...inspection.taxInfo, taxStatus: e.target.value as any } })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="compliant">Compliant</option>
                    <option value="non-compliant">Non-Compliant</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox disabled={isSigned} checked={inspection.taxInfo.isSubmitted} onCheckedChange={v => update({ taxInfo: { ...inspection.taxInfo, isSubmitted: !!v } })} />
                <Label>Tax returns submitted and up to date</Label>
              </div>
              <div><Label>Last Submission Date</Label><Input type="date" disabled={isSigned} value={inspection.taxInfo.lastSubmissionDate} onChange={e => update({ taxInfo: { ...inspection.taxInfo, lastSubmissionDate: e.target.value } })} /></div>
              <div><Label>Notes</Label><Textarea disabled={isSigned} value={inspection.taxInfo.notes} onChange={e => update({ taxInfo: { ...inspection.taxInfo, notes: e.target.value } })} /></div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Compliance Statuses */}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle>Compliance Statuses</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(['uifStatus', 'cipcStatus', 'payeStatus', 'coidaStatus'] as const).map(field => (
                <div key={field}>
                  <Label>{field.replace('Status', '').toUpperCase()} Status</Label>
                  <select disabled={isSigned} value={inspection.complianceStatuses[field]} onChange={e => update({ complianceStatuses: { ...inspection.complianceStatuses, [field]: e.target.value } })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {statusOptions.map(o => <option key={o} value={o}>{o.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
              ))}
              <div><Label>Notes</Label><Textarea disabled={isSigned} value={inspection.complianceStatuses.notes} onChange={e => update({ complianceStatuses: { ...inspection.complianceStatuses, notes: e.target.value } })} /></div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: OHS Compliance */}
        {step === 5 && (
          <Card>
            <CardHeader><CardTitle>Occupational Health & Safety Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Building Condition</Label>
                <select disabled={isSigned} value={inspection.ohsCompliance.buildingCondition} onChange={e => update({ ohsCompliance: { ...inspection.ohsCompliance, buildingCondition: e.target.value as any } })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {buildingConditions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ['fireExtinguishers', 'Fire Extinguishers Present'],
                  ['emergencyExits', 'Emergency Exits Accessible'],
                  ['firstAidKit', 'First Aid Kit Available'],
                  ['safetySignage', 'Safety Signage Displayed'],
                  ['ventilation', 'Adequate Ventilation'],
                  ['sanitaryFacilities', 'Sanitary Facilities Available'],
                  ['electricalCompliance', 'Electrical Compliance Certificate'],
                  ['overallSafe', 'Overall Building is Safe'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 rounded-md border p-3">
                    <Checkbox disabled={isSigned} checked={inspection.ohsCompliance[key]} onCheckedChange={v => update({ ohsCompliance: { ...inspection.ohsCompliance, [key]: !!v } })} />
                    <Label className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
              <div><Label>Notes</Label><Textarea disabled={isSigned} value={inspection.ohsCompliance.notes} onChange={e => update({ ohsCompliance: { ...inspection.ohsCompliance, notes: e.target.value } })} /></div>

              {/* Signature */}
              <div className="mt-6 border-t pt-4">
                <h3 className="mb-2 font-semibold">Inspector Signature</h3>
                {isSigned && inspection.signature ? (
                  <div>
                    <img src={inspection.signature} alt="Signature" className="h-24 rounded border" />
                    <Badge className="mt-2 bg-success text-success-foreground">Signed on {new Date(inspection.signedAt!).toLocaleString()}</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <canvas ref={canvasRef} width={400} height={150} className="cursor-crosshair rounded border bg-card" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearSignature}>Clear</Button>
                      <Button size="sm" onClick={handleSign}><Check className="mr-1 h-4 w-4" /> Sign & Complete</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1}><ArrowLeft className="mr-1 h-4 w-4" /> Previous</Button>
          <div className="flex gap-2">
            {!isSigned && <Button variant="outline" onClick={handleSave}><Save className="mr-1 h-4 w-4" /> Save</Button>}
            {step < 5 && <Button onClick={handleNext}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InspectionForm;
