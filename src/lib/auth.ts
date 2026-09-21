// src/lib/auth.ts
export interface Usuario {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  ocupacion: 'administrador' | 'profesor' | 'alumno' | string;
  avatar?: string;
  dni?: string;
  telefono?: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getCurrentUser(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('usuario');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setSession(token: string, usuario: Usuario): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function normalizarRol(rol?: string): string {
  if (!rol) return '';
  const r = rol.toLowerCase().trim();
  if (r === 'admin' || r === 'administrador') return 'administrador';
  if (r === 'docente' || r === 'profesor') return 'profesor';
  if (r === 'estudiante' || r === 'alumno') return 'alumno';
  return r;
}

export function hasRole(...rolesPermitidos: string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  const rolUser = normalizarRol(user.ocupacion);
  const rolesNorm = rolesPermitidos.map(normalizarRol);

  // El administrador tiene automáticamente acceso a las vistas y funciones del profesor
  if (rolUser === 'administrador' && (rolesNorm.includes('profesor') || rolesNorm.includes('administrador'))) {
    return true;
  }

  return rolesNorm.includes(rolUser);
}

export function requireAuth(rolesPermitidos?: string[]): boolean {
  if (typeof window === 'undefined') return true;

  if (!isAuthenticated()) {
    window.location.href = '/';
    return false;
  }

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    if (!hasRole(...rolesPermitidos)) {
      alert('Acceso no autorizado para tu rol');
      const user = getCurrentUser();
      const rol = normalizarRol(user?.ocupacion);
      if (rol === 'alumno') {
        window.location.href = '/inicio';
      } else {
        window.location.href = '/inicio-dashboard';
      }
      return false;
    }
  }

  return true;
}
