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

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'user';
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
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  asset_tag: string;
  serial_number?: string;
  category_id: number;
  employee_id?: number;
  manufacturer: string;
  model_name: string;
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
  employee?: Employee;
  is_warranty_active: boolean;
  days_until_warranty_expiry?: number;
}

export interface AssetCreate {
  asset_tag: string;
  serial_number?: string;
  category_id: number;
  manufacturer: string;
  model_name: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_months?: number;
  status?: string;
  assigned_to?: string;
  location?: string;
  notes?: string;
}

export interface AssetUpdate extends Partial<AssetCreate> {}

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
}

export interface EmployeeUpdate {
  name?: string;
  email?: string;
  department?: string;
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

// ============== Asset Assignment Functions ==============

export async function assignAsset(assetId: number, employeeId: number | null): Promise<Asset> {
  const response = await apiClient.post<Asset>(`/api/v1/assets/${assetId}/assign`, {
    employee_id: employeeId,
  });
  return response.data;
}

