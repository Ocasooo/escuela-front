// src/lib/api.ts
import { getToken, clearSession } from './auth';

function resolveApiUrl(): string {
  // 1. Permitir override manual en localStorage (muy útil para depurar sin esperar un nuevo build)
  if (typeof window !== 'undefined') {
    try {
      const localOverride = localStorage.getItem('API_URL') || localStorage.getItem('PUBLIC_API_URL');
      if (localOverride) {
        let clean = localOverride.trim().replace(/\/+$/, '');
        if (!clean.endsWith('/api')) clean = `${clean}/api`;
        return clean;
      }
    } catch (_) {}
  }

  // 2. Leer cualquier nombre de variable disponible (API_URL, BACKEND_URL, VITE_API_URL, etc.)
  let url = (
    import.meta.env.API_URL ||
    import.meta.env.BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.NEXT_PUBLIC_API_URL ||
    import.meta.env.PUBLIC_API_URL ||
    ''
  ).trim();

  // Si no se configuró la variable de entorno, usar valor por defecto
  if (!url) {
    return 'http://localhost:4000/api';
  }

  // Quitar barras finales
  url = url.replace(/\/+$/, '');

  // Si no termina en /api, agregárselo automáticamente
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
}

export const API_BASE_URL = resolveApiUrl();
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export function getFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${SERVER_BASE_URL}/${cleanPath}`;
}

interface RequestOptions extends RequestInit {
  isFormData?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== 'undefined' && window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
      window.location.href = '/';
    }
    throw new Error('Sesión expirada o no autorizada');
  }

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.body || data.error || 'Error en la solicitud al servidor');
  }

  return data.body as T;
}

export const api = {
  auth: {
    login: (correo: string, contrasena: string) =>
      request<{ token: string; usuario: any }>('/login', {
        method: 'POST',
        body: JSON.stringify({ correo, contrasena }),
      }),
  },

  alumno: {
    todos: () => request<any[]>('/alumno'),
    uno: (id: number | string) => request<any>(`/alumno/${id}`),
    agregar: (datos: any) =>
      request<any>('/alumno', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    editar: (id: number | string, datos: any) =>
      request<any>(`/alumno/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      }),
    eliminar: (id: number | string) =>
      request<any>('/alumno', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      }),
    cambiarContrasena: (id: number, actualContrasena: string, nuevaContrasena: string) =>
      request<any>('/alumno/cambiar-contrasena', {
        method: 'PATCH',
        body: JSON.stringify({ id, actualContrasena, nuevaContrasena }),
      }),
    reemplazarContrasena: (id: number, nuevaContrasena: string) =>
      request<any>('/alumno/reemplazar-contrasena', {
        method: 'PATCH',
        body: JSON.stringify({ id, nuevaContrasena }),
      }),
    editarDatosPersonales: (id: number, datos: { nombre: string; apellido: string; correo: string; telefono?: string }) =>
      request<any>('/alumno/editarDatosPersonales', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...datos }),
      }),
    subirImagen: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('id', id.toString());
      fd.append('imagen', file);
      return request<any>('/alumno/subir-imagen', {
        method: 'POST',
        body: fd,
        isFormData: true,
      });
    },
  },

  personal: {
    todos: () => request<any[]>('/personal'),
    uno: (id: number | string) => request<any>(`/personal/${id}`),
    agregar: (datos: any) =>
      request<any>('/personal', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    editar: (id: number | string, datos: any) =>
      request<any>('/personal/editar', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...datos }),
      }),
    eliminar: (id: number | string) =>
      request<any>('/personal', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      }),
    cambiarContrasena: (id: number, actualContrasena: string, nuevaContrasena: string) =>
      request<any>('/personal/cambiar-contrasena', {
        method: 'PATCH',
        body: JSON.stringify({ id, actualContrasena, nuevaContrasena }),
      }),
    reemplazarContrasena: (id: number, nuevaContrasena: string) =>
      request<any>('/personal/reemplazar-contrasena', {
        method: 'PATCH',
        body: JSON.stringify({ id, nuevaContrasena }),
      }),
    editarDatosPersonales: (id: number, datos: { nombre: string; apellido: string; correo: string; telefono?: string }) =>
      request<any>('/personal/editarDatosPersonales', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...datos }),
      }),
    subirImagen: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('id', id.toString());
      fd.append('imagen', file);
      return request<any>('/personal/subir-imagen', {
        method: 'POST',
        body: fd,
        isFormData: true,
      });
    },
  },

  curso: {
    todos: () => request<any[]>('/curso'),
    uno: (id: number | string) => request<any>(`/curso/${id}`),
    agregar: (datos: any) =>
      request<any>('/curso', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    editar: (id: number | string, datos: any) =>
      request<any>(`/curso/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      }),
    eliminar: (id: number | string) =>
      request<any>('/curso', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      }),
    cursosPorAlumno: (id: number | string) => request<any[]>(`/curso/alumno/${id}/cursos`),
    cursosAprobadosPorAlumno: (id: number | string) => request<any[]>(`/curso/alumno/${id}/cursos-aprobados`),
    cursosDesaprobadosPorAlumno: (id: number | string) => request<any[]>(`/curso/alumno/${id}/cursos-desaprobados`),
    cursosPorPersonal: (id: number | string) => request<any[]>(`/curso/personal/${id}/cursos`),
    alumnosPorCurso: (id: number | string) => request<any[]>(`/curso/${id}/alumnos-simples`),
    obtenerNotasPorCurso: (id: number | string, anio?: number | string) =>
      request<any[]>(`/curso/${id}/notasDelCurso${anio ? `?anio=${anio}` : ''}`),
    cargarNotaCursado: (datos: any) =>
      request<any>('/curso/cargarNotaCursado', {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    resumen: () => request<any[]>('/curso/resumen'),
    profesoresConCursos: () => request<any[]>('/curso/profesores-con-cursos'),
    profesoresPorCurso: (id: number | string) => request<any[]>(`/curso/${id}/profesores`),
    asignarPersonal: (datos: { id_personal: number; id_curso: number }) =>
      request<any>('/curso/asignar-personal', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    quitarPersonal: (datos: { id_personal: number; id_curso: number }) =>
      request<any>('/curso/quitar-personal', {
        method: 'DELETE',
        body: JSON.stringify(datos),
      }),
    asignarAlumno: (datos: { id_alumno: number; id_curso: number; anio?: number }) =>
      request<any>('/curso/asignar-alumno', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    quitarAlumno: (datos: { id_alumno: number; id_curso: number; anio?: number }) =>
      request<any>('/curso/quitar-alumno', {
        method: 'DELETE',
        body: JSON.stringify(datos),
      }),
    alumnosConCursos: () => request<any[]>('/curso/alumnos-cursos'),
    egresarAlumno: (datos: { id_alumno: number; nota: number }) =>
      request<any>('/curso/egresar-alumno', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    titular: (datos: { id_alumno: number; id_curso: number; anio: number; nota: number }) =>
      request<any>('/curso/titular', {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    quitarEgresado: (datos: { id_alumno: number; id_curso: number; anio: number }) =>
      request<any>('/curso/quitar-egresado', {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
  },

  unidades: {
    todos: () => request<any[]>('/unidades'),
    uno: (id: number | string) => request<any>(`/unidades/${id}`),
    agregar: (datos: { curso_id?: number; nombre: string; descripcion?: string; orden?: number; contenido?: string; links?: string }) =>
      request<any>('/unidades', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    editar: (id: number | string, datos: { nombre?: string; descripcion?: string; orden?: number; contenido?: string; links?: string }) =>
      request<any>('/unidades', {
        method: 'POST',
        body: JSON.stringify({ id, ...datos }),
      }),
    eliminar: (id: number | string) =>
      request<any>('/unidades', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      }),
  },

  material: {
    todos: () => request<any[]>('/material'),
    porCurso: (cursoId: number | string) => request<any[]>(`/material/curso/${cursoId}`),
    uno: (id: number | string) => request<any>(`/material/${id}`),
    porAlumno: (id: number | string) => request<any[]>(`/material/alumno/${id}`),
    examenesCurso: (cursoId: number | string) => request<any[]>(`/material/examenes/curso/${cursoId}`),
    examenesAlumno: (alumnoId: number | string, cursoId: number | string) =>
      request<any[]>(`/material/examenes/alumno/${alumnoId}/curso/${cursoId}`),
    subirMaterial: (formData: FormData) =>
      request<any>('/material', {
        method: 'POST',
        body: formData,
        isFormData: true,
      }),
    subirEntrega: (formData: FormData) =>
      request<any>('/material/entrega', {
        method: 'POST',
        body: formData,
        isFormData: true,
      }),
    calificar: (alumno_id: number, calificacion: number | string, carpeta: string, id?: number) =>
      request<any>('/material/calificar', {
        method: 'PATCH',
        body: JSON.stringify({ alumno_id, calificacion, carpeta, id, material_id: id }),
      }),
    tpsGestion: (cursoId?: number | string) =>
      request<any[]>(`/material/tps-gestion${cursoId ? `?curso_id=${cursoId}` : ''}`),
    limpiarHistorial: (cursoId?: number | string) =>
      request<any>(`/material/historial${cursoId ? `?curso_id=${cursoId}` : ''}`, {
        method: 'DELETE',
      }),
    eliminarConsigna: (id: number | string) =>
      request<any>(`/material/consigna/${id}`, {
        method: 'DELETE',
      }),
    eliminar: (id: number | string) =>
      request<any>('/material', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      }),
    eliminarPorCarpeta: (nombre: string) =>
      request<any>(`/material/carpeta/${encodeURIComponent(nombre)}`, {
        method: 'DELETE',
      }),
    urlDescarga: (id: number | string) => `${API_BASE_URL}/material/descargar/${id}`,
    descargarArchivo: async (id: number | string, nombreSugerido?: string) => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/material/descargar/${id}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.body || data.error || 'Error al descargar archivo');
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.body || data.error || 'Error en el archivo');
        }

        const blob = await response.blob();
        let filename = nombreSugerido || `documento_${id}.pdf`;
        const disposition = response.headers.get('content-disposition');
        if (disposition && disposition.includes('filename=')) {
          const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1]);
          }
        }

        if (!filename.toLowerCase().endsWith('.pdf')) {
          filename += '.pdf';
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err: any) {
        console.error('Error al descargar archivo:', err);
        throw err;
      }
    },
  },

  examen: {
    todos: () => request<any[]>('/examen'),
    uno: (id: number | string) => request<any>(`/examen/${id}`),
    porCurso: (cursoId: number | string) => request<any[]>(`/examen/curso/${cursoId}`),
    examenConInfo: () => request<any[]>('/examen/info/completa'),
    agregar: (datos: any) =>
      request<any>('/examen', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    editar: (id: number | string, datos: any) =>
      request<any>(`/examen/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      }),
    eliminar: (id: number | string) =>
      request<any>('/examen', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      }),
  },

  aula: {
    obtenerAulas: () => request<any[]>('/aula'),
    agregarAula: (datos: { nombre: string; capacidad?: number }) =>
      request<any>('/aula', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    eliminarAula: (id: number | string) =>
      request<any>(`/aula/${id}`, {
        method: 'DELETE',
      }),
    agregarHorario: (datos: { dia: string; hora_inicio: string; hora_fin: string }) =>
      request<any>('/aula/horarios', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    asignarCursoAulaHorario: (datos: { idCurso: number; idAula: number; dia: string; hora_inicio: string; hora_fin: string }) =>
      request<any>('/aula/asignar-curso-aula-horario', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    obtenerInfoCompleta: () => request<any[]>('/aula/info-completa'),
    eliminarCursoAsignacion: (datos: number | { id?: number; horario_id?: number; idHorario?: number; curso_id?: number; aula_id?: number }) => {
      const body = typeof datos === 'number' ? { id: datos } : datos;
      return request<any>('/aula/eliminar-curso-asignacion', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    desasignarTurno: (horarioId: number | string) =>
      request<any>(`/aula/desasignar-turno/${horarioId}`, {
        method: 'DELETE',
      }),
  },

  foro: {
    porCurso: (cursoId: number | string) => request<any[]>(`/foro/curso/${cursoId}`),
    uno: (id: number | string) => request<{ tema: any; respuestas: any[] }>(`/foro/${id}`),
    crearTema: (formData: FormData) =>
      request<any>('/foro', {
        method: 'POST',
        body: formData,
        isFormData: true,
      }),
    editarTema: (id: number | string, formData: FormData) =>
      request<any>(`/foro/${id}`, {
        method: 'PUT',
        body: formData,
        isFormData: true,
      }),
    eliminarTema: (id: number | string) =>
      request<any>(`/foro/${id}`, {
        method: 'DELETE',
      }),
    crearRespuesta: (foroId: number | string, formData: FormData) =>
      request<any>(`/foro/${foroId}/respuesta`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      }),
    editarRespuesta: (id: number | string, formData: FormData) =>
      request<any>(`/foro/respuesta/${id}`, {
        method: 'PUT',
        body: formData,
        isFormData: true,
      }),
    eliminarRespuesta: (id: number | string) =>
      request<any>(`/foro/respuesta/${id}`, {
        method: 'DELETE',
      }),
  },
  getFileUrl,
};
