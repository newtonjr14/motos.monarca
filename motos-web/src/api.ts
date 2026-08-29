import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  notifyUnauthorized,
  setAuthTokens,
} from "@/auth/tokens";
import { markSystemOffline, markSystemOnline } from "@/systemStatus";

export type TipoPessoa = "fisica" | "juridica";
export type Status = "ativo" | "inativo" | "deletado";
export type IdiomaUsuario = "pt" | "es";
export type PerfilUsuario = "administrador" | "gestor" | "operador" | "vendedor";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface PerfilAutenticado {
  id: number;
  nome: string;
  login: string;
  email: string;
  perfil: PerfilUsuario;
  idioma: IdiomaUsuario;
  permissoes: string[];
}

export interface Pais {
  id: number;
  nome: string;
  sigla: string;
  usaSiglaDivisao: boolean;
  status: Status;
}

export interface Cidade {
  id: number;
  nome: string;
  idDivisao: number;
  divisaoNome: string;
  divisaoSigla: string | null;
  idPais: number;
  paisNome: string;
  paisSigla: string;
  status: Status;
}

export interface DocumentoTipo {
  id: number;
  idPais: number;
  tipoPessoa: TipoPessoa;
  codigo: string;
  nome: string;
  unico: boolean;
}

export interface Documento {
  id: number;
  idPais: number;
  paisNome: string;
  paisSigla: string;
  idTipoDocumento: number | null;
  tipoCodigo: string | null;
  tipoNome: string;
  numero: string;
  unico: boolean;
}

export interface Pessoa {
  id: number;
  nomeRazaoSocial: string;
  tipoPessoa: TipoPessoa;
  ddi: string | null;
  telefone: string | null;
  email: string | null;
  tipoLogradouro: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cep: string | null;
  complemento: string | null;
  idCidade: number | null;
  status: Status;
  documentos: Documento[];
}

export interface Papel {
  id: number;
  idPessoa: number;
  status: Status;
  pessoa: Pessoa;
}

export interface DocumentoConflito {
  codigo: string;
  message: string;
  pessoa: { id: number; nomeRazaoSocial: string; tipoPessoa: TipoPessoa };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(typeof body === "object" && body && "message" in body ? String((body as { message: string }).message) : `HTTP ${status}`);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as TokenResponse;
    setAuthTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit,
  options?: { retry?: boolean; logoutOn401?: boolean },
): Promise<T> {
  const retry = options?.retry ?? true;
  const logoutOn401 = options?.logoutOn401 ?? true;
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    if (path !== "/health") markSystemOffline();
    throw new ApiError(0, { message: "Sem conexão com o servidor" });
  }

  if (res.status >= 500 && path !== "/health") markSystemOffline();

  if (res.status === 401 && retry && path !== "/auth/login" && path !== "/auth/refresh") {
    if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = null; });
    const ok = await refreshing;
    if (ok) return api<T>(path, init, { retry: false, logoutOn401 });
    if (logoutOn401) {
      clearAuthTokens();
      notifyUnauthorized();
    }
  }

  if (res.status === 204) {
    if (path !== "/health") markSystemOnline();
    return undefined as T;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data);
  if (path !== "/health") markSystemOnline();
  return data as T;
}

export interface Divisao {
  id: number;
  idPais: number;
  nome: string;
  sigla: string | null;
  status: Status;
}

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  email: string;
  perfil: PerfilUsuario;
  idioma: IdiomaUsuario;
  status: Status;
}

export const login = (loginValue: string, senha: string) =>
  api<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginValue, senha }),
  });

export const logout = () =>
  api<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: getRefreshToken() }),
  });

export const perfil = () => api<PerfilAutenticado>("/auth/me");

export const alterarSenha = (senhaAtual: string, senhaNova: string) =>
  api<void>("/auth/senha", {
    method: "PUT",
    body: JSON.stringify({ senhaAtual, senhaNova }),
  });

export const editarPerfil = (nome: string, idioma: IdiomaUsuario) =>
  api<PerfilAutenticado>("/auth/perfil", {
    method: "PUT",
    body: JSON.stringify({ nome, idioma }),
  });

export const listarPaises = (options?: { logoutOn401?: boolean }) =>
  api<Pais[]>("/paises", undefined, options);
export const criarPais = (body: unknown) => api<Pais>("/paises", { method: "POST", body: JSON.stringify(body) });
export const atualizarPais = (id: number, body: unknown) =>
  api<Pais>(`/paises/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirPais = (id: number) => api<void>(`/paises/${id}`, { method: "DELETE" });

export const listarDivisoes = (idPais?: number) => {
  const q = idPais != null ? `?idPais=${idPais}` : "";
  return api<Divisao[]>(`/divisoes${q}`);
};
export const criarDivisao = (body: unknown) => api<Divisao>("/divisoes", { method: "POST", body: JSON.stringify(body) });
export const atualizarDivisao = (id: number, body: unknown) =>
  api<Divisao>(`/divisoes/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirDivisao = (id: number) => api<void>(`/divisoes/${id}`, { method: "DELETE" });

export const listarCidades = (idPais?: number, idDivisao?: number, options?: { logoutOn401?: boolean }) => {
  const q = new URLSearchParams();
  if (idPais != null) q.set("idPais", String(idPais));
  if (idDivisao != null) q.set("idDivisao", String(idDivisao));
  const suffix = q.toString() ? `?${q}` : "";
  return api<Cidade[]>(`/cidades${suffix}`, undefined, options);
};
export const criarCidade = (body: unknown) => api<Cidade>("/cidades", { method: "POST", body: JSON.stringify(body) });
export const atualizarCidade = (id: number, body: unknown) =>
  api<Cidade>(`/cidades/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirCidade = (id: number) => api<void>(`/cidades/${id}`, { method: "DELETE" });
export const listarTipos = (idPais?: number, tipoPessoa?: TipoPessoa) => {
  const q = new URLSearchParams();
  if (idPais != null) q.set("idPais", String(idPais));
  if (tipoPessoa) q.set("tipoPessoa", tipoPessoa);
  const suffix = q.toString() ? `?${q}` : "";
  return api<DocumentoTipo[]>(`/documentos-tipos${suffix}`);
};
export const buscarTipoDocumento = (id: number) => api<DocumentoTipo>(`/documentos-tipos/${id}`);
export const criarTipoDocumento = (body: {
  idPais: number;
  tipoPessoa: TipoPessoa;
  codigo: string;
  nome: string;
  unico: boolean;
}) => api<DocumentoTipo>("/documentos-tipos", { method: "POST", body: JSON.stringify(body) });
export const atualizarTipoDocumento = (
  id: number,
  body: { idPais: number; tipoPessoa: TipoPessoa; codigo: string; nome: string; unico: boolean },
) => api<DocumentoTipo>(`/documentos-tipos/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirTipoDocumento = (id: number) => api<void>(`/documentos-tipos/${id}`, { method: "DELETE" });

export const listarPapeis = (recurso: "clientes" | "fornecedores", options?: { logoutOn401?: boolean }) =>
  api<Papel[]>(`/${recurso}`, undefined, options);
export const buscarPapel = (recurso: "clientes" | "fornecedores", id: number) => api<Papel>(`/${recurso}/${id}`);
export const criarPapel = (recurso: "clientes" | "fornecedores", body: unknown) =>
  api<Papel>(`/${recurso}`, { method: "POST", body: JSON.stringify(body) });
export const atualizarPapel = (recurso: "clientes" | "fornecedores", id: number, body: unknown) =>
  api<Papel>(`/${recurso}/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirPapel = (recurso: "clientes" | "fornecedores", id: number) =>
  api<void>(`/${recurso}/${id}`, { method: "DELETE" });

export const listarUsuarios = () => api<Usuario[]>("/usuarios");
export const criarUsuario = (body: unknown) =>
  api<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(body) });
export const atualizarUsuario = (id: number, body: unknown) =>
  api<Usuario>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirUsuario = (id: number) => api<void>(`/usuarios/${id}`, { method: "DELETE" });
