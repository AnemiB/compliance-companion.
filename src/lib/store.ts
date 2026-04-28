// Local storage-based state management for inspections and companies

export type CompanyType = 'sole-proprietor' | 'pty-ltd' | 'cc' | 'npo' | 'public' | 'partnership';
export type OwnerType = 'south-african' | 'foreign-national' | 'permanent-resident' | 'corporate';
export type Province =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Free State'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Northern Cape';

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  companyType: CompanyType;
  ownerType: OwnerType;
  province: Province;
  industry: string;
  employeeCount: number;
  // Snapshot of latest known compliance — used for filtering & AI recommendations
  complianceScore: number; // 0-100, lower = more non-compliant
  lastInspectionDate?: string;
}

export type EmployeeStatus = 'active' | 'inactive' | 'contract' | 'terminated';
export type ContractType = 'permanent' | 'fixed-term' | 'casual' | 'learnership' | 'none';

export interface EmployeeAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  category: 'id' | 'contract' | 'payslip' | 'other';
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  status: EmployeeStatus;
  // Core compliance
  age?: number;
  idNumber?: string;
  monthlySalary?: number;
  contractType?: ContractType;
  // Extended compliance
  hoursPerWeek?: number;
  annualLeaveDays?: number;
  uifRegistered?: boolean;
  taxRegistered?: boolean;
  attachments?: EmployeeAttachment[];
}

export interface TaxInfo {
  taxNumber: string;
  taxStatus: 'compliant' | 'non-compliant' | 'pending';
  isSubmitted: boolean;
  lastSubmissionDate: string;
  notes: string;
}

export interface ComplianceStatuses {
  uifStatus: 'compliant' | 'non-compliant' | 'pending' | 'not-registered';
  cipcStatus: 'compliant' | 'non-compliant' | 'pending' | 'not-registered';
  payeStatus: 'compliant' | 'non-compliant' | 'pending' | 'not-registered';
  coidaStatus: 'compliant' | 'non-compliant' | 'pending' | 'not-registered';
  notes: string;
}

export interface OHSCompliance {
  buildingCondition: 'good' | 'fair' | 'poor' | 'dangerous';
  fireExtinguishers: boolean;
  emergencyExits: boolean;
  firstAidKit: boolean;
  safetySignage: boolean;
  ventilation: boolean;
  sanitaryFacilities: boolean;
  electricalCompliance: boolean;
  overallSafe: boolean;
  notes: string;
}

export interface StepAttachments {
  [step: number]: Array<{
    id: string;
    name: string;
    type: string;
    dataUrl: string;
    addedAt: string;
    source: 'upload' | 'scan' | 'qr';
  }>;
}

export interface AudioRecording {
  id: string;
  step: number;
  durationSec: number;
  transcript: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  companyId: string;
  companyName: string;
  inspectorName: string;
  status: 'draft' | 'in-progress' | 'completed' | 'signed';
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  signature?: string;
  attachments?: StepAttachments;
  recordings?: AudioRecording[];
  businessInfo: {
    companyName: string;
    registrationNumber: string;
    ownerName: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
  };
  employeeInfo: {
    totalEmployees: number;
    employees: Employee[];
  };
  taxInfo: TaxInfo;
  complianceStatuses: ComplianceStatuses;
  ohsCompliance: OHSCompliance;
}

const COMPANIES_KEY = 'labour_compliance_companies_v2';
const INSPECTIONS_KEY = 'labour_compliance_inspections';
const AUTH_KEY = 'labour_compliance_auth';

// Seed data with rich filter attributes
const defaultCompanies: Company[] = [
  { id: '1', name: 'Shoprite Holdings', registrationNumber: '1936/007721/06', ownerName: 'Pieter Engelbrecht', contactPhone: '021 980 4000', contactEmail: 'info@shoprite.co.za', address: 'Cnr William Dabbs & Old Paarl Rd, Brackenfell, Cape Town, 7560', companyType: 'public', ownerType: 'south-african', province: 'Western Cape', industry: 'Retail', employeeCount: 149000, complianceScore: 88, lastInspectionDate: '2025-11-12' },
  { id: '2', name: 'MTN South Africa', registrationNumber: '1994/009283/06', ownerName: 'Charles Molapisi', contactPhone: '011 912 3000', contactEmail: 'info@mtn.co.za', address: '216 14th Ave, Fairland, Johannesburg, 2195', companyType: 'pty-ltd', ownerType: 'south-african', province: 'Gauteng', industry: 'Telecommunications', employeeCount: 4800, complianceScore: 92, lastInspectionDate: '2026-01-08' },
  { id: '3', name: 'Sasol Limited', registrationNumber: '1979/003231/06', ownerName: 'Fleetwood Grobler', contactPhone: '010 344 5000', contactEmail: 'info@sasol.com', address: '50 Katherine St, Sandton, Johannesburg, 2196', companyType: 'public', ownerType: 'south-african', province: 'Gauteng', industry: 'Energy & Chemicals', employeeCount: 28800, complianceScore: 81 },
  { id: '4', name: 'Durban Textile Co.', registrationNumber: '2014/110234/07', ownerName: 'Nadia Pillay', contactPhone: '031 305 7700', contactEmail: 'admin@durbantextile.co.za', address: '12 Sydney Rd, Durban, 4001', companyType: 'pty-ltd', ownerType: 'south-african', province: 'KwaZulu-Natal', industry: 'Manufacturing', employeeCount: 78, complianceScore: 38 },
  { id: '5', name: 'Karoo Farms CC', registrationNumber: '2009/045123/23', ownerName: 'Johan van der Merwe', contactPhone: '054 332 1100', contactEmail: 'office@karoofarms.co.za', address: 'Plot 14, Upington, 8801', companyType: 'cc', ownerType: 'south-african', province: 'Northern Cape', industry: 'Agriculture', employeeCount: 22, complianceScore: 45 },
  { id: '6', name: 'Cape Coastal Catering', registrationNumber: '2018/667881/07', ownerName: 'Aisha Karim', contactPhone: '021 555 0234', contactEmail: 'hello@capecoastal.co.za', address: '88 Long St, Cape Town, 8001', companyType: 'pty-ltd', ownerType: 'foreign-national', province: 'Western Cape', industry: 'Hospitality', employeeCount: 34, complianceScore: 62 },
  { id: '7', name: 'Polokwane Logistics', registrationNumber: '2016/220011/07', ownerName: 'Thabo Mokoena', contactPhone: '015 290 8800', contactEmail: 'ops@polokwanelog.co.za', address: '5 Industrial Rd, Polokwane, 0700', companyType: 'pty-ltd', ownerType: 'south-african', province: 'Limpopo', industry: 'Logistics', employeeCount: 110, complianceScore: 29 },
  { id: '8', name: 'East London Construction', registrationNumber: '2011/334456/07', ownerName: 'Sipho Ndlovu', contactPhone: '043 700 4400', contactEmail: 'info@elconstruct.co.za', address: '99 Settlers Way, East London, 5201', companyType: 'pty-ltd', ownerType: 'south-african', province: 'Eastern Cape', industry: 'Construction', employeeCount: 220, complianceScore: 41 },
  { id: '9', name: 'Mpumalanga Mining Services', registrationNumber: '2007/118899/07', ownerName: 'James Cole', contactPhone: '013 656 2200', contactEmail: 'jcole@mpms.co.za', address: '4 Coal Rd, Witbank, 1035', companyType: 'pty-ltd', ownerType: 'permanent-resident', province: 'Mpumalanga', industry: 'Mining', employeeCount: 540, complianceScore: 55 },
  { id: '10', name: 'Bloem Care NPO', registrationNumber: '2015/991234/08', ownerName: 'Lerato Mofokeng', contactPhone: '051 444 7800', contactEmail: 'admin@bloemcare.org', address: '17 Hospital Rd, Bloemfontein, 9301', companyType: 'npo', ownerType: 'south-african', province: 'Free State', industry: 'Healthcare', employeeCount: 45, complianceScore: 73 },
  { id: '11', name: 'Rustenburg Auto Spares', registrationNumber: '1998/007733/23', ownerName: 'Willem Botha', contactPhone: '014 597 3300', contactEmail: 'sales@rustenbergauto.co.za', address: '2 Main St, Rustenburg, 0299', companyType: 'cc', ownerType: 'south-african', province: 'North West', industry: 'Retail', employeeCount: 18, complianceScore: 58 },
  { id: '12', name: 'Sandton Tech Partners', registrationNumber: '2020/445566/07', ownerName: 'Priya Naidoo & Partners', contactPhone: '011 783 9900', contactEmail: 'hello@sandtontech.co.za', address: '21 West St, Sandton, 2196', companyType: 'partnership', ownerType: 'south-african', province: 'Gauteng', industry: 'Technology', employeeCount: 42, complianceScore: 84 },
];

export function getCompanies(): Company[] {
  const data = localStorage.getItem(COMPANIES_KEY);
  if (!data) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(defaultCompanies));
    return defaultCompanies;
  }
  return JSON.parse(data);
}

export function addCompany(company: Omit<Company, 'id'>): Company {
  const companies = getCompanies();
  const newCompany = { ...company, id: Date.now().toString() };
  companies.push(newCompany);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  return newCompany;
}

export function searchCompanies(query: string): Company[] {
  return getCompanies().filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
}

export interface CompanyFilters {
  search?: string;
  companyType?: CompanyType | 'all';
  ownerType?: OwnerType | 'all';
  province?: Province | 'all';
  industry?: string | 'all';
  complianceBand?: 'all' | 'high-risk' | 'medium-risk' | 'compliant';
}

export function filterCompanies(filters: CompanyFilters): Company[] {
  let list = getCompanies();
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.ownerName.toLowerCase().includes(q));
  }
  if (filters.companyType && filters.companyType !== 'all') list = list.filter(c => c.companyType === filters.companyType);
  if (filters.ownerType && filters.ownerType !== 'all') list = list.filter(c => c.ownerType === filters.ownerType);
  if (filters.province && filters.province !== 'all') list = list.filter(c => c.province === filters.province);
  if (filters.industry && filters.industry !== 'all') list = list.filter(c => c.industry === filters.industry);
  if (filters.complianceBand && filters.complianceBand !== 'all') {
    list = list.filter(c => {
      if (filters.complianceBand === 'high-risk') return c.complianceScore < 50;
      if (filters.complianceBand === 'medium-risk') return c.complianceScore >= 50 && c.complianceScore < 75;
      return c.complianceScore >= 75;
    });
  }
  return list;
}

export function getInspections(): Inspection[] {
  const data = localStorage.getItem(INSPECTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveInspection(inspection: Inspection): void {
  const inspections = getInspections();
  const idx = inspections.findIndex(i => i.id === inspection.id);
  inspection.updatedAt = new Date().toISOString();
  if (idx >= 0) inspections[idx] = inspection;
  else inspections.push(inspection);
  localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections));
}

export function getInspection(id: string): Inspection | undefined {
  return getInspections().find(i => i.id === id);
}

export function createNewInspection(companyId: string, companyName: string, inspectorName: string): Inspection {
  return {
    id: Date.now().toString(),
    companyId,
    companyName,
    inspectorName,
    status: 'draft',
    currentStep: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    businessInfo: { companyName: '', registrationNumber: '', ownerName: '', contactPhone: '', contactEmail: '', address: '' },
    employeeInfo: { totalEmployees: 0, employees: [] },
    taxInfo: { taxNumber: '', taxStatus: 'pending', isSubmitted: false, lastSubmissionDate: '', notes: '' },
    complianceStatuses: { uifStatus: 'pending', cipcStatus: 'pending', payeStatus: 'pending', coidaStatus: 'pending', notes: '' },
    ohsCompliance: { buildingCondition: 'fair', fireExtinguishers: false, emergencyExits: false, firstAidKit: false, safetySignage: false, ventilation: false, sanitaryFacilities: false, electricalCompliance: false, overallSafe: false, notes: '' },
  };
}

export interface AuthUser {
  email: string;
  role: 'inspector' | 'admin';
  name: string;
}

export function login(email: string, _password: string, role: 'inspector' | 'admin'): AuthUser | null {
  const user: AuthUser = { email, role, name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function getAuth(): AuthUser | null {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
