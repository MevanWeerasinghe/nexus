import apiClient from './api-client';
import { setAuthToken, setRefreshToken } from './auth';

// ============== Auth Types ==============

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  roles: Role[];
  created_at: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role_codes: string[];
}

export interface UserUpdateRequest {
  email?: string;
  is_active?: boolean;
  role_codes?: string[];
}

// ============== Asset Types ==============

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

// ============== Supplier Types ==============

export interface Supplier {
  id: number;
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
}

export interface SupplierUpdate extends Partial<SupplierCreate> {}

// ============== Warranty Types ==============

export interface Warranty {
  id: number;
  asset_id: number;
  provider_name: string;
  duration_months: number;
  start_date: string;
  end_date: string;
  terms_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyCreate {
  provider_name: string;
  duration_months: number;
  start_date: string;
  terms_conditions?: string;
}

// ============== Component Warranty Types ==============

export interface ComponentWarranty {
  id: number;
  component_id: number;
  provider_name: string;
  duration_months: number;
  start_date: string;
  end_date: string;
  terms_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface ComponentWarrantyCreate {
  provider_name: string;
  duration_months: number;
  start_date: string;
  terms_conditions?: string;
}

// ============== Component Types ==============

export interface Component {
  id: number;
  name: string;
  category: string;
  serial_number?: string;
  purchase_price?: number;
  purchase_date?: string;
  supplier_id?: number;
  status: string;
  specifications?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  warranty?: ComponentWarranty;
}

export interface ComponentCreate {
  name: string;
  category: string;
  serial_number?: string;
  purchase_price?: number;
  purchase_date?: string;
  supplier_id?: number;
  specifications?: string;
  notes?: string;
}

export interface ComponentUpdate extends Partial<ComponentCreate> {
  status?: string;
}

export interface AssetComponentHistory {
  id: number;
  asset_id: number;
  component_id: number;
  installed_date: string;
  installed_by?: string;
  removed_date?: string;
  removal_reason?: string;
  notes?: string;
  component?: Component;
}

export interface InstallComponentRequest {
  component_id: number;
  notes?: string;
  installed_by?: string;
}

// ============== Asset Types ==============

export interface Asset {
  id: number;
  asset_tag: string;
  serial_number?: string;
  category_id: number;
  supplier_id?: number;
  employee_id?: number;
  manufacturer: string;
  model_name: string;
  model_number?: string;
  usage_type: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_months?: number;
  warranty_expiry_date?: string;
  status: string;
  assigned_to?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  supplier?: Supplier;
  employee?: Employee;
  warranty?: Warranty;
  is_warranty_active: boolean;
  days_until_warranty_expiry?: number;
}

export interface AssetCreate {
  asset_tag: string;
  serial_number?: string;
  category_id: number;
  supplier_id?: number;
  manufacturer: string;
  model_name: string;
  model_number?: string;
  usage_type: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_months?: number;
  status?: string;
  assigned_to?: string;
  location?: string;
  notes?: string;
  warranty?: WarrantyCreate;
}

export interface AssetUpdate extends Partial<Omit<AssetCreate, 'warranty'>> {}

export interface DashboardMetrics {
  total_assets: number;
  deployed: number;
  available: number;
  in_maintenance: number;
  retired: number;
}

export interface WarrantyAlert {
  id: number;
  asset_tag: string;
  model_name: string;
  manufacturer: string;
  warranty_expiry_date: string;
  days_remaining: number;
  status: string;
}

export interface AssetFilters {
  status?: string;
  category_id?: number;
  search?: string;
}

export interface AssetReportFields {
  include_serial_number: boolean;
  include_category: boolean;
  include_model: boolean;
  include_supplier: boolean;
  include_assignee: boolean;
  include_purchase_date: boolean;
  include_purchase_price: boolean;
  include_warranty: boolean;
  include_location: boolean;
  include_notes: boolean;
}

export interface AssetReportRequest {
  start_date?: string;
  end_date?: string;
  status: string;
  report_title?: string;
  fields: AssetReportFields;
}

export interface AssetProfileReportFields {
  include_asset_overview: boolean;
  include_financial_details: boolean;
  include_warranty_details: boolean;
  include_assignment_snapshot: boolean;
  include_assignment_history: boolean;
  include_component_history: boolean;
  include_component_specs: boolean;
  include_notes: boolean;
}

export interface AssetProfileReportRequest {
  report_title?: string;
  fields: AssetProfileReportFields;
}

export interface AssignmentHistory {
  id: number;
  asset_id: number;
  employee_id: number | null;
  employee_name: string;
  employee_email: string | null;
  employee_department: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  unassign_reason: string | null;
}

export interface AssetAssignRequest {
  employee_id: number | null;
  unassign_reason?: string;
}

// ============== Auth Functions ==============

export async function loginUser(credentials: LoginRequest): Promise<TokenResponse> {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await apiClient.post<TokenResponse>(
    '/api/v1/auth/login',
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (response.data) {
    setAuthToken(response.data.access_token);
    setRefreshToken(response.data.refresh_token);
  }

  return response.data;
}

export async function createUser(userData: UserCreateRequest): Promise<any> {
  const response = await apiClient.post('/api/v1/auth/create-user', userData);
  return response.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  });

  if (response.data) {
    setAuthToken(response.data.access_token);
    setRefreshToken(response.data.refresh_token);
  }

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/api/v1/auth/me');
  return response.data;
}

export async function getRoles(): Promise<Role[]> {
  const response = await apiClient.get<Role[]>('/api/v1/auth/roles');
  return response.data;
}

export async function getUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>('/api/v1/auth/users');
  return response.data;
}

export async function updateUser(userId: number, data: UserUpdateRequest): Promise<User> {
  const response = await apiClient.put<User>(`/api/v1/auth/users/${userId}`, data);
  return response.data;
}

export async function seedRoles(): Promise<Role[]> {
  const response = await apiClient.post<Role[]>('/api/v1/auth/seed-roles');
  return response.data;
}

// ============== Category Functions ==============

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>('/api/v1/assets/categories');
  return response.data;
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  const response = await apiClient.post<Category>('/api/v1/assets/categories', {
    name,
    description,
  });
  return response.data;
}

export async function seedCategories(): Promise<Category[]> {
  const response = await apiClient.post<Category[]>('/api/v1/assets/seed-categories');
  return response.data;
}

// ============== Asset Functions ==============

export async function getAssets(filters?: AssetFilters): Promise<Asset[]> {
  const params = new URLSearchParams();
  
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.category_id) {
    params.append('category_id', filters.category_id.toString());
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/api/v1/assets/?${queryString}` : '/api/v1/assets/';
  
  const response = await apiClient.get<Asset[]>(url);
  return response.data;
}

export async function getAsset(id: number): Promise<Asset> {
  const response = await apiClient.get<Asset>(`/api/v1/assets/${id}`);
  return response.data;
}

export async function createAsset(data: AssetCreate): Promise<Asset> {
  const response = await apiClient.post<Asset>('/api/v1/assets/', data);
  return response.data;
}

export async function updateAsset(id: number, data: AssetUpdate): Promise<Asset> {
  const response = await apiClient.put<Asset>(`/api/v1/assets/${id}`, data);
  return response.data;
}

export async function deleteAsset(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/assets/${id}`);
}

export async function generateAssetPdfReport(payload: AssetReportRequest): Promise<Blob> {
  const response = await apiClient.post('/api/v1/assets/reports/pdf', payload, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function generateAssetProfilePdfReport(
  assetId: number,
  payload: AssetProfileReportRequest
): Promise<Blob> {
  const response = await apiClient.post(`/api/v1/assets/${assetId}/reports/pdf`, payload, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

// ============== Dashboard Functions ==============

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await apiClient.get<DashboardMetrics>('/api/v1/assets/dashboard/metrics');
  return response.data;
}

export async function getExpiringWarranties(days: number = 30): Promise<WarrantyAlert[]> {
  const response = await apiClient.get<WarrantyAlert[]>(
    `/api/v1/assets/dashboard/expiring-warranties?days=${days}`
  );
  return response.data;
}

// ============== Employee Types ==============

export interface EmployeeCreate {
  name: string;
  email: string;
  department?: string;
  ip_address?: string;
}

export interface EmployeeUpdate {
  name?: string;
  email?: string;
  department?: string;
  ip_address?: string;
}

// ============== FAMS Types ==============

export type VehicleType = 'Car' | 'Bike' | 'Van' | 'Lorry';
export type VehicleOwnershipType = 'Office Vehicle' | 'Personal Vehicle';
export type FuelType = 'Petrol' | 'Diesel';
export type PetrolGrade = '92 Octane' | '95 Octane';
export type DieselGrade = 'Auto Diesel' | 'Super Diesel 4 Star';
export type FuelGrade = PetrolGrade | DieselGrade;

export interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: VehicleType;
  model: string;
  ownership_type: VehicleOwnershipType;
  employee_id?: number;
  monthly_allocation: number;
  fuel_capacity_liters?: number | null;
  unlimited_fuel: boolean;
  fuel_type: FuelType;
  remaining_fuel?: number | null;
  issued_fuel: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface VehicleCreate {
  vehicle_number: string;
  vehicle_type: VehicleType;
  model: string;
  ownership_type: VehicleOwnershipType;
  employee_id?: number;
  monthly_allocation?: number;
  fuel_capacity_liters: number;
  unlimited_fuel?: boolean;
  fuel_type: FuelType;
}

export interface VehicleUpdate extends Partial<VehicleCreate> {}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  receipt_number: string;
  liters_issued: number;
  fuel_grade: FuelGrade;
  price_per_liter_lkr: number;
  total_cost_lkr: number;
  issue_date: string;
  created_at: string;
}

export interface FuelLogCreate {
  receipt_number: string;
  liters_issued: number;
  fuel_grade: FuelGrade;
  price_per_liter_lkr: number;
  issue_date?: string;
}

export interface FuelLogUpdate {
  receipt_number: string;
  liters_issued: number;
  fuel_grade: FuelGrade;
  price_per_liter_lkr: number;
  issue_date?: string;
}

export interface FuelLogDetail {
  id: number;
  vehicle_id: number;
  vehicle_number: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  employee_id?: number;
  employee_name?: string | null;
  receipt_number: string;
  liters_issued: number;
  fuel_grade: FuelGrade;
  price_per_liter_lkr: number;
  total_cost_lkr: number;
  issue_date: string;
  created_at: string;
}

export interface FuelUsageReport {
  vehicle_id: number;
  vehicle_number: string;
  fuel_type: FuelType;
  start_date: string;
  end_date: string;
  total_liters_issued: number;
  total_cost_lkr: number;
  transactions: FuelLog[];
}

export interface FuelPrice {
  fuel_grade: FuelGrade;
  fuel_type: FuelType;
  price_per_liter_lkr?: number | null;
  updated_at?: string | null;
}

export interface FuelPriceInput {
  fuel_grade: FuelGrade;
  price_per_liter_lkr: number;
}

// ============== Employee Functions ==============

export async function getEmployees(): Promise<Employee[]> {
  const response = await apiClient.get<Employee[]>('/api/v1/employees/');
  return response.data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const response = await apiClient.get<Employee>(`/api/v1/employees/${id}`);
  return response.data;
}

export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  const response = await apiClient.post<Employee>('/api/v1/employees/', data);
  return response.data;
}

export async function updateEmployee(id: number, data: EmployeeUpdate): Promise<Employee> {
  const response = await apiClient.put<Employee>(`/api/v1/employees/${id}`, data);
  return response.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/employees/${id}`);
}

export async function getEmployeeAssets(employeeId: number): Promise<Asset[]> {
  const response = await apiClient.get<Asset[]>(`/api/v1/employees/${employeeId}/assets`);
  return response.data;
}

// ============== FAMS Functions ==============

export async function getVehicles(search?: string): Promise<Vehicle[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await apiClient.get<Vehicle[]>(`/api/v1/fams/vehicles${params}`);
  return response.data;
}

export async function getVehicle(vehicleId: number): Promise<Vehicle> {
  const response = await apiClient.get<Vehicle>(`/api/v1/fams/vehicles/${vehicleId}`);
  return response.data;
}

export async function createVehicle(data: VehicleCreate): Promise<Vehicle> {
  const response = await apiClient.post<Vehicle>('/api/v1/fams/vehicles', data);
  return response.data;
}

export async function updateVehicle(vehicleId: number, data: VehicleUpdate): Promise<Vehicle> {
  const response = await apiClient.put<Vehicle>(`/api/v1/fams/vehicles/${vehicleId}`, data);
  return response.data;
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  await apiClient.delete(`/api/v1/fams/vehicles/${vehicleId}`);
}

export async function getVehicleFuelLogs(vehicleId: number): Promise<FuelLog[]> {
  const response = await apiClient.get<FuelLog[]>(`/api/v1/fams/vehicles/${vehicleId}/fuel-logs`);
  return response.data;
}

export async function createVehicleFuelLog(vehicleId: number, data: FuelLogCreate): Promise<FuelLog> {
  const response = await apiClient.post<FuelLog>(`/api/v1/fams/vehicles/${vehicleId}/fuel-logs`, data);
  return response.data;
}

export async function updateVehicleFuelLog(vehicleId: number, logId: number, data: FuelLogUpdate): Promise<FuelLog> {
  const response = await apiClient.put<FuelLog>(`/api/v1/fams/vehicles/${vehicleId}/fuel-logs/${logId}`, data);
  return response.data;
}

export async function getFuelLogs(startDate: string, endDate: string): Promise<FuelLogDetail[]> {
  const response = await apiClient.get<FuelLogDetail[]>(
    `/api/v1/fams/fuel-logs?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
  );
  return response.data;
}

export async function getVehicleFuelUsageReport(
  vehicleId: number,
  startDate: string,
  endDate: string
): Promise<FuelUsageReport> {
  const response = await apiClient.get<FuelUsageReport>(
    `/api/v1/fams/vehicles/${vehicleId}/report?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
  );
  return response.data;
}

export async function getFuelPrices(): Promise<FuelPrice[]> {
  const response = await apiClient.get<FuelPrice[]>('/api/v1/fams/fuel-prices');
  return response.data;
}

export async function updateFuelPrices(prices: FuelPriceInput[]): Promise<FuelPrice[]> {
  const response = await apiClient.put<FuelPrice[]>('/api/v1/fams/fuel-prices', { prices });
  return response.data;
}

// ============== Asset Assignment Functions ==============

export async function assignAsset(
  assetId: number,
  employeeId: number | null,
  unassignReason?: string
): Promise<Asset> {
  const payload: AssetAssignRequest = {
    employee_id: employeeId,
  };

  if (employeeId === null && unassignReason?.trim()) {
    payload.unassign_reason = unassignReason.trim();
  }

  const response = await apiClient.post<Asset>(`/api/v1/assets/${assetId}/assign`, payload);
  return response.data;
}

export async function getAssignmentHistory(assetId: number): Promise<AssignmentHistory[]> {
  const response = await apiClient.get<AssignmentHistory[]>(`/api/v1/assets/${assetId}/history`);
  return response.data;
}

// ============== Supplier Functions ==============

export async function getSuppliers(search?: string): Promise<Supplier[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await apiClient.get<Supplier[]>(`/api/v1/suppliers/${params}`);
  return response.data;
}

export async function getSupplier(id: number): Promise<Supplier> {
  const response = await apiClient.get<Supplier>(`/api/v1/suppliers/${id}`);
  return response.data;
}

export async function createSupplier(data: SupplierCreate): Promise<Supplier> {
  const response = await apiClient.post<Supplier>('/api/v1/suppliers/', data);
  return response.data;
}

export async function updateSupplier(id: number, data: SupplierUpdate): Promise<Supplier> {
  const response = await apiClient.put<Supplier>(`/api/v1/suppliers/${id}`, data);
  return response.data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/suppliers/${id}`);
}

// ============== Component Functions ==============

export interface ComponentFilters {
  search?: string;
  category?: string;
  status?: string;
  supplier_id?: number;
}

export async function getComponents(filters?: ComponentFilters): Promise<Component[]> {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id.toString());
  
  const queryString = params.toString();
  const url = queryString ? `/api/v1/components/?${queryString}` : '/api/v1/components/';
  
  const response = await apiClient.get<Component[]>(url);
  return response.data;
}

export async function getAvailableComponents(category?: string): Promise<Component[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await apiClient.get<Component[]>(`/api/v1/components/available${params}`);
  return response.data;
}

export async function getComponentCategories(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/api/v1/components/categories');
  return response.data;
}

export async function getComponent(id: number): Promise<Component> {
  const response = await apiClient.get<Component>(`/api/v1/components/${id}`);
  return response.data;
}

export async function createComponent(data: ComponentCreate): Promise<Component> {
  const response = await apiClient.post<Component>('/api/v1/components/', data);
  return response.data;
}

export async function updateComponent(id: number, data: ComponentUpdate): Promise<Component> {
  const response = await apiClient.put<Component>(`/api/v1/components/${id}`, data);
  return response.data;
}

export async function deleteComponent(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/components/${id}`);
}

// ============== Component Warranty Functions ==============

export async function addComponentWarranty(
  componentId: number,
  data: ComponentWarrantyCreate
): Promise<ComponentWarranty> {
  const response = await apiClient.post<ComponentWarranty>(
    `/api/v1/components/${componentId}/warranty`,
    data
  );
  return response.data;
}

export async function updateComponentWarranty(
  componentId: number,
  data: ComponentWarrantyCreate
): Promise<ComponentWarranty> {
  const response = await apiClient.put<ComponentWarranty>(
    `/api/v1/components/${componentId}/warranty`,
    data
  );
  return response.data;
}

export async function deleteComponentWarranty(componentId: number): Promise<void> {
  await apiClient.delete(`/api/v1/components/${componentId}/warranty`);
}

export async function getComponentWarranty(componentId: number): Promise<ComponentWarranty> {
  const response = await apiClient.get<ComponentWarranty>(`/api/v1/components/${componentId}/warranty`);
  return response.data;
}

// ============== Asset Component Functions ==============

export async function getAssetComponents(assetId: number): Promise<AssetComponentHistory[]> {
  const response = await apiClient.get<AssetComponentHistory[]>(`/api/v1/assets/${assetId}/components`);
  return response.data;
}

export async function installComponent(assetId: number, data: InstallComponentRequest): Promise<AssetComponentHistory> {
  const response = await apiClient.post<AssetComponentHistory>(`/api/v1/assets/${assetId}/install-component`, data);
  return response.data;
}

export async function removeComponent(assetId: number, historyId: number, reason?: string): Promise<AssetComponentHistory> {
  const response = await apiClient.post<AssetComponentHistory>(
    `/api/v1/assets/${assetId}/remove-component/${historyId}`,
    { removal_reason: reason }
  );
  return response.data;
}
