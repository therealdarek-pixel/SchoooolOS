

















const TOKEN_KEY = "schoolos_token";

// ====================================================
// TOKEN STORAGE (con guard SSR)
// ====================================================
export const tokenStorage = {
  get() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

// ====================================================
// FETCH BASE
// ====================================================
async function apiFetch(
  ruta,
  opciones = {},
  conAuth = true
) {
  const headers = new Headers(opciones.headers);

  if (!(opciones.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (conAuth) {
    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(ruta, { ...opciones, headers });

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const data = await res.json();
      mensaje = data.detail || data.error || mensaje;
    } catch {
      // body no era JSON
    }
    throw new Error(mensaje);
  }

  if (res.status === 204) return undefined ;
  return res.json() ;
}

// ====================================================
// AUTH
// ====================================================
export const authApi = {
  async register(payload) {
    const data = await apiFetch(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
      false
    );
    tokenStorage.set(data.access_token);
    return data;
  },

  async login(email, password) {
    const data = await apiFetch(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    );
    tokenStorage.set(data.access_token);
    return data;
  },

  async me() {
    return apiFetch("/api/auth/me");
  },

  logout() {
    tokenStorage.clear();
  },
};

// ====================================================
// TAREAS
// ====================================================
export const tareasApi = {
  async subirTarea(archivo, descripcion) {
    const formData = new FormData();
    formData.append("archivo", archivo);
    if (descripcion) formData.append("descripcion", descripcion);

    return apiFetch("/api/tareas/upload", {
      method: "POST",
      body: formData,
    });
  },

  async listarMisTareas() {
    return apiFetch("/api/tareas");
  },

  async listarTodas() {
    return apiFetch("/api/tareas/all");
  },

  async actualizarNota(tareaId, nota) {
    return apiFetch(`/api/tareas/${tareaId}/nota`, {
      method: "PATCH",
      body: JSON.stringify({ nota }),
    });
  },

  // Borra una tarea del alumno actual.
  // Llama al endpoint DELETE /api/tareas/[id].
  async eliminar(tareaId) {
    return apiFetch(`/api/tareas/${tareaId}`, {
      method: "DELETE",
    });
  },
};

// ====================================================
// CHAT
// ====================================================
export const chatApi = {
  async enviarMensaje(mensaje, sesionId) {
    return apiFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ mensaje, session_id: sesionId }),
    });
  },
};