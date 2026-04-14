// Local storage-based state management for inspections and companies

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'active' | 'inactive' | 'contract' | 'terminated';
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

const COMPANIES_KEY = 'labour_compliance_companies';
const INSPECTIONS_KEY = 'labour_compliance_inspections';
const AUTH_KEY = 'labour_compliance_auth';

// Seed data
const defaultCompanies: Company[] = [
  { id: '1', name: 'Shoprite Holdings', registrationNumber: '1936/007721/06', ownerName: 'Pieter Engelbrecht', contactPhone: '021 980 4000', contactEmail: 'info@shoprite.co.za', address: 'Cnr William Dabbs & Old Paarl Rd, Brackenfell, Cape Town, 7560' },
  { id: '2', name: 'MTN South Africa', registrationNumber: '1994/009283/06', ownerName: 'Charles Molapisi', contactPhone: '011 912 3000', contactEmail: 'info@mtn.co.za', address: '216 14th Ave, Fairland, Johannesburg, 2195' },
  { id: '3', name: 'Sasol Limited', registrationNumber: '1979/003231/06', ownerName: 'Fleetwood Grobler', contactPhone: '010 344 5000', contactEmail: 'info@sasol.com', address: '50 Katherine St, Sandton, Johannesburg, 2196' },
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
  // Mock auth
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
