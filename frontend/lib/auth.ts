export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('refresh_token', token);
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Decode JWT token payload (without verification - just for UI purposes)
function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Get current user's roles from the access token
export function getUserRoles(): string[] {
  const token = getAuthToken();
  if (!token) return [];
  
  const payload = decodeToken(token);
  return payload?.roles || [];
}

// Check if user has a specific role (or is admin)
export function hasRole(roleCode: string): boolean {
  const roles = getUserRoles();
  return roles.includes('admin') || roles.includes(roleCode);
}

// Check if user is admin
export function isAdmin(): boolean {
  return getUserRoles().includes('admin');
}

// Check if user can access ITAM module
export function canAccessITAM(): boolean {
  return hasRole('itam_manager');
}

// Check if user can access FAMS module
export function canAccessFAMS(): boolean {
  return hasRole('fuel_manager');
}
