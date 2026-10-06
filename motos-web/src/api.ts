import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  notifyUnauthorized,
  setAuthTokens,
} from "@/auth/tokens";

export type TipoPessoa = "fisica" | "juridica";
export type Status = "ativo" | "inativo" | "deletado";
export type PerfilFiscal = "py_iva";
export type IdiomaUsuario = "pt" | "es";
export type PerfilUsuario = "administrador" | "gestor" | "operador" | "vendedor";
export type Moeda = "usd" | "pyg" | "brl";

export const Permissao = {
  USUARIO_LISTAR: "usuario:listar",
  LOCALIDADE_GERENCIAR: "localidade:gerenciar",
  DOCUMENTO_GERENCIAR: "documento:gerenciar",
  PESSOA_GERENCIAR: "pessoa:gerenciar",
  VENDA_REGISTRAR: "venda:registrar",
  VENDA_DESCONTO: "venda:desconto",
  DASHBOARD_CONSULTAR: "dashboard:consultar",
  CONFIGURACAO: "configuracao:gerenciar",
  PRODUTO_GERENCIAR: "produto:gerenciar",
  ESTOQUE_GERENCIAR: "estoque:gerenciar",
  COTACAO_CONSULTAR: "cotacao:consultar",
  COTACAO_GERENCIAR: "cotacao:gerenciar",
  CAIXA_GERENCIAR: "caixa:gerenciar",
  CAIXA_OPERAR: "caixa:operar",
  FINANCEIRO_OPERAR: "financeiro:operar",
} as const;

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface FilialAcesso {
  id: number;
  nome: string;
  principal: boolean;
  moedaOperacao?: Moeda;
  idEstoquePadrao?: number | null;
}

export interface PerfilAutenticado {
  id: number;
  nome: string;
  login: string;
  email: string;
  perfil: PerfilUsuario;
  idioma: IdiomaUsuario;
  permissoes: string[];
  filiais: FilialAcesso[];
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
  tipo: "municipio" | "distrito";
  idCidadeMunicipio: number | null;
  municipioNome: string | null;
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

export type TipoEndereco = "fiscal" | "residencial" | "entrega";

export interface PessoaEndereco {
  id: number;
  tipo: TipoEndereco;
  principal: boolean;
  tipoLogradouro: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cep: string | null;
  complemento: string | null;
  idCidade: number | null;
  status: Status;
}

export interface Pessoa {
  id: number;
  nomeRazaoSocial: string;
  tipoPessoa: TipoPessoa;
  ddi: string | null;
  telefone: string | null;
  ddi2?: string | null;
  telefone2?: string | null;
  email: string | null;
  enderecos: PessoaEndereco[];
  status: Status;
  documentos: Documento[];
}

export interface FilialVinculo {
  id: number;
  nome: string;
}

export interface Papel {
  id: number;
  idPessoa: number;
  idFilialCadastro: number | null;
  filialNome?: string | null;
  filiaisVinculadas?: FilialVinculo[];
  status: Status;
  pessoa: Pessoa;
}

export interface Empresa {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  ruc: string;
  representanteNome: string | null;
  representanteDocumento: string | null;
  status: Status;
}

export interface Filial {
  id: number;
  idEmpresa: number;
  empresaRazaoSocial: string;
  empresaNomeFantasia: string;
  nome: string;
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
  cidadeNome: string | null;
  divisaoSigla: string | null;
  paisNome: string | null;
  timbrado: string | null;
  timbradoVigenciaInicio: string | null;
  timbradoVigenciaFim: string | null;
  estabelecimentoNumero: string | null;
  pontoExpedicao: string | null;
  perfilFiscal: PerfilFiscal;
  moedaOperacao: Moeda;
  idEstoquePadrao?: number | null;
  listarApenasClientesFilial: boolean;
  listarApenasFornecedoresFilial: boolean;
  listarApenasProdutosFilial: boolean;
  principal: boolean;
  status: Status;
}

export interface DocumentoConflito {
  codigo: string;
  message: string;
  params?: Record<string, string>;
  pessoa: { id: number; nomeRazaoSocial: string; tipoPessoa: TipoPessoa };
  idPapel?: number | null;
  filiaisVinculadas?: FilialVinculo[];
}

export interface VinculoFilialConflito {
  codigo: "VINCULO_FILIAL";
  message: string;
  idPapel: number;
  pessoa: { id: number; nomeRazaoSocial: string; tipoPessoa: TipoPessoa };
  filiaisVinculadas: FilialVinculo[];
  idFilialAlvo: number;
  filialAlvoNome: string;
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
    throw new ApiError(0, { message: "Sem conexão com o servidor" });
  }

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
    return undefined as T;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (
    res.status === 403 &&
    data?.codigo === "COTACAO_DIA_AUSENTE" &&
    !path.startsWith("/cotacoes")
  ) {
    window.dispatchEvent(new Event("monarca:cotacao-ausente"));
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export function avisarCotacaoMudou() {
  window.dispatchEvent(new Event("monarca:cotacao-mudou"));
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
  filiais: FilialAcesso[];
  caixas?: UsuarioCaixaAcesso[];
}

export interface UsuarioCaixaAcesso {
  id: number;
  nome: string;
  idFilial: number;
  filialNome: string;
  padrao: boolean;
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

const tiposDocumentoCache = new Map<string, DocumentoTipo[]>();
const tiposDocumentoInflight = new Map<string, Promise<DocumentoTipo[]>>();

function filtrarTiposDocumento(
  todos: DocumentoTipo[],
  idPais?: number,
  tipoPessoa?: TipoPessoa,
): DocumentoTipo[] {
  return todos.filter(
    (tp) =>
      (idPais == null || tp.idPais === idPais) &&
      (tipoPessoa == null || tp.tipoPessoa === tipoPessoa),
  );
}

export const listarTipos = (idPais?: number, tipoPessoa?: TipoPessoa) => {
  const key = `${idPais ?? ""}:${tipoPessoa ?? ""}`;
  const cached = tiposDocumentoCache.get(key);
  if (cached) return Promise.resolve(cached);

  const todos = tiposDocumentoCache.get(":");
  if (todos && (idPais != null || tipoPessoa)) {
    const filtrado = filtrarTiposDocumento(todos, idPais, tipoPessoa);
    tiposDocumentoCache.set(key, filtrado);
    return Promise.resolve(filtrado);
  }

  const pending = tiposDocumentoInflight.get(key);
  if (pending) return pending;

  // Se o aquecimento global já está em voo, reutiliza e filtra.
  const aquecendo = tiposDocumentoInflight.get(":");
  if (aquecendo && (idPais != null || tipoPessoa)) {
    const derivado = aquecendo.then((lista) => {
      const filtrado = filtrarTiposDocumento(lista, idPais, tipoPessoa);
      tiposDocumentoCache.set(key, filtrado);
      return filtrado;
    });
    tiposDocumentoInflight.set(key, derivado);
    return derivado;
  }

  const q = new URLSearchParams();
  if (idPais != null) q.set("idPais", String(idPais));
  if (tipoPessoa) q.set("tipoPessoa", tipoPessoa);
  const suffix = q.toString() ? `?${q}` : "";
  const req = api<DocumentoTipo[]>(`/documentos-tipos${suffix}`)
    .then((lista) => {
      tiposDocumentoCache.set(key, lista);
      tiposDocumentoInflight.delete(key);
      return lista;
    })
    .catch((e) => {
      tiposDocumentoInflight.delete(key);
      throw e;
    });
  tiposDocumentoInflight.set(key, req);
  return req;
};

/** Uma chamada lista tudo e popula o cache por país/tipo — usado no boot do app. */
export async function aquecerCacheTiposDocumento(): Promise<DocumentoTipo[]> {
  const cached = tiposDocumentoCache.get(":");
  if (cached) return cached;
  const pending = tiposDocumentoInflight.get(":");
  if (pending) return pending;

  const req = api<DocumentoTipo[]>("/documentos-tipos")
    .then((todos) => {
      tiposDocumentoCache.set(":", todos);
      const porChave = new Map<string, DocumentoTipo[]>();
      for (const tp of todos) {
        const key = `${tp.idPais}:${tp.tipoPessoa}`;
        const lista = porChave.get(key) ?? [];
        lista.push(tp);
        porChave.set(key, lista);
      }
      for (const [key, lista] of porChave) {
        tiposDocumentoCache.set(key, lista);
      }
      tiposDocumentoInflight.delete(":");
      return todos;
    })
    .catch((e) => {
      tiposDocumentoInflight.delete(":");
      throw e;
    });
  tiposDocumentoInflight.set(":", req);
  return req;
}

/** Leitura síncrona do cache (prefetch / form Novo sem esperar rede). */
export function tiposDocumentoEmCache(idPais: number, tipoPessoa: TipoPessoa): DocumentoTipo[] | undefined {
  return tiposDocumentoCache.get(`${idPais}:${tipoPessoa}`);
}

export function invalidarCacheTiposDocumento() {
  tiposDocumentoCache.clear();
  tiposDocumentoInflight.clear();
}

export const buscarTipoDocumento = (id: number) => api<DocumentoTipo>(`/documentos-tipos/${id}`);
export const criarTipoDocumento = (body: {
  idPais: number;
  tipoPessoa: TipoPessoa;
  codigo: string;
  nome: string;
  unico: boolean;
}) =>
  api<DocumentoTipo>("/documentos-tipos", { method: "POST", body: JSON.stringify(body) }).then((r) => {
    invalidarCacheTiposDocumento();
    return r;
  });
export const atualizarTipoDocumento = (
  id: number,
  body: { idPais: number; tipoPessoa: TipoPessoa; codigo: string; nome: string; unico: boolean },
) =>
  api<DocumentoTipo>(`/documentos-tipos/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => {
    invalidarCacheTiposDocumento();
    return r;
  });
export const excluirTipoDocumento = (id: number) =>
  api<void>(`/documentos-tipos/${id}`, { method: "DELETE" }).then((r) => {
    invalidarCacheTiposDocumento();
    return r;
  });

export const listarPapeis = (
  recurso: "clientes" | "fornecedores",
  idFilial?: number,
  options?: { logoutOn401?: boolean },
) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<Papel[]>(`/${recurso}${q}`, undefined, options);
};
export const buscarPapel = (recurso: "clientes" | "fornecedores", id: number) => api<Papel>(`/${recurso}/${id}`);
export const consultarPapelDocumento = (
  recurso: "clientes" | "fornecedores",
  params: {
    idPais: number;
    idTipoDocumento: number;
    numero: string;
    tipoPessoa: TipoPessoa;
    ignorarPessoaId?: number;
  },
) => {
  const q = new URLSearchParams({
    idPais: String(params.idPais),
    idTipoDocumento: String(params.idTipoDocumento),
    numero: params.numero,
    tipoPessoa: params.tipoPessoa,
  });
  if (params.ignorarPessoaId != null) q.set("ignorarPessoaId", String(params.ignorarPessoaId));
  return api<void>(`/${recurso}/documento?${q}`);
};
export const buscarPessoa = (id: number) => api<Pessoa>(`/pessoas/${id}`);
export const criarPapel = (recurso: "clientes" | "fornecedores", body: unknown) =>
  api<Papel>(`/${recurso}`, { method: "POST", body: JSON.stringify(body) });
export const atualizarPapel = (recurso: "clientes" | "fornecedores", id: number, body: unknown) =>
  api<Papel>(`/${recurso}/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirPapel = (recurso: "clientes" | "fornecedores", id: number, idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<void>(`/${recurso}/${id}${q}`, { method: "DELETE" });
};

export const listarUsuarios = () => api<Usuario[]>("/usuarios");
export const criarUsuario = (body: unknown) =>
  api<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(body) });
export const atualizarUsuario = (id: number, body: unknown) =>
  api<Usuario>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirUsuario = (id: number) => api<void>(`/usuarios/${id}`, { method: "DELETE" });

export const listarEmpresas = () => api<Empresa[]>("/empresas");
export const buscarEmpresa = (id: number) => api<Empresa>(`/empresas/${id}`);
export const criarEmpresa = (body: unknown) => api<Empresa>("/empresas", { method: "POST", body: JSON.stringify(body) });
export const atualizarEmpresa = (id: number, body: unknown) =>
  api<Empresa>(`/empresas/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const listarFiliais = (idEmpresa?: number) => {
  const q = idEmpresa != null ? `?idEmpresa=${idEmpresa}` : "";
  return api<Filial[]>(`/filiais${q}`);
};
export const buscarFilialPrincipal = () => api<Filial>("/filiais/principal");
export const criarFilial = (body: unknown) => api<Filial>("/filiais", { method: "POST", body: JSON.stringify(body) });
export const atualizarFilial = (id: number, body: unknown) =>
  api<Filial>(`/filiais/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirFilial = (id: number) => api<void>(`/filiais/${id}`, { method: "DELETE" });

export type TipoProduto = "moto" | "bicicleta";
export type AliquotaIva = 0 | 5 | 10;

export type SituacaoUnidade = "disponivel" | "vendido";

export interface ProdutoUnidade {
  id: number;
  idProduto: number;
  idEstoque: number;
  estoqueNome: string;
  numero: string;
  situacao: SituacaoUnidade;
  idVendaItem?: number | null;
}

export interface ProdutoMoto {
  cor: string | null;
  potenciaMotorW: number | null;
  autonomiaKm: number | null;
  velocidadeMaxKmh: number | null;
  capacidadeBateriaAh: number | null;
  voltagemBateria: number | null;
  tempoCargaHoras: number | null;
  pesoKg: number | null;
  capacidadeCargaKg: number | null;
  assentos: number | null;
  tipoFreio: string | null;
  anoFabricacao: number;
  anoModelo: number;
}

export interface ProdutoBicicleta {
  cor: string | null;
  potenciaMotorW: number | null;
  autonomiaKm: number | null;
  capacidadeBateriaAh: number | null;
  voltagemBateria: number | null;
  tempoCargaHoras: number | null;
  pesoKg: number | null;
  aro: string | null;
  tipoQuadro: string | null;
  numeroMarchas: number | null;
  tipoFreio: string | null;
  numeroSerieQuadro: string | null;
}

export interface ProdutoEstoqueSaldo {
  idEstoque: number;
  estoqueNome: string;
  quantidade: number;
  quantidadeReservada: number;
  quantidadeDisponivel: number;
  padrao?: boolean;
}

export interface Produto {
  id: number;
  codigo: string;
  nome: string;
  idMarca: number;
  marca: string;
  idModelo: number;
  modelo: string;
  descricao: string | null;
  tipo: TipoProduto;
  controlaChassi: boolean;
  idFilialCadastro: number | null;
  filialNome?: string | null;
  filiaisVinculadas?: FilialVinculo[];
  aliquotaIva: AliquotaIva;
  moedaPreco: Moeda;
  precoLista: number;
  custo: number;
  status: Status;
  moto: ProdutoMoto | null;
  bicicleta: ProdutoBicicleta | null;
  quantidade?: number;
  quantidadeReservada?: number;
  quantidadeDisponivel?: number;
  estoques?: ProdutoEstoqueSaldo[];
  temFoto?: boolean;
}

export interface VinculoFilialProdutoConflito {
  codigo: "VINCULO_FILIAL";
  message: string;
  idProduto: number;
  produto: { id: number; codigo: string; nome: string; tipo: TipoProduto };
  filiaisVinculadas: FilialVinculo[];
  idFilialAlvo: number;
  filialAlvoNome: string;
}

export interface Estoque {
  id: number;
  idFilial: number;
  filialNome: string;
  nome: string;
  status: Status;
}

export interface EstoqueProduto {
  id: number;
  idEstoque: number;
  estoqueNome: string;
  idFilial: number;
  filialNome: string;
  idProduto: number;
  produtoCodigo: string;
  produtoNome: string;
  produtoTipo: TipoProduto;
  quantidade: number;
  quantidadeReservada: number;
  quantidadeDisponivel: number;
  status: Status;
}

export const listarProdutos = (idFilial?: number, tipo?: TipoProduto) => {
  const q = new URLSearchParams();
  if (idFilial != null) q.set("idFilial", String(idFilial));
  if (tipo) q.set("tipo", tipo);
  const suffix = q.toString() ? `?${q}` : "";
  return api<Produto[]>(`/produtos${suffix}`);
};
export const buscarProduto = (id: number, idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<Produto>(`/produtos/${id}${q}`);
};
export const criarProduto = (body: unknown) =>
  api<Produto>("/produtos", { method: "POST", body: JSON.stringify(body) });
export const atualizarProduto = (id: number, body: unknown) =>
  api<Produto>(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const atualizarProdutoStatus = (id: number, status: "ativo" | "inativo") =>
  api<Produto>(`/produtos/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
export const excluirProduto = (id: number, idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<void>(`/produtos/${id}${q}`, { method: "DELETE" });
};

export async function buscarFotoProduto(id: number): Promise<string | null> {
  const token = getAccessToken();
  const res = await fetch(`/produtos/${id}/foto`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  return URL.createObjectURL(await res.blob());
}

export async function enviarFotoProduto(id: number, blob: Blob): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`/produtos/${id}/foto`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": blob.type || "image/jpeg",
    },
    body: blob,
  });
  if (res.status === 204 || res.ok) return;
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  throw new ApiError(res.status, data);
}

export const excluirFotoProduto = (id: number) =>
  api<void>(`/produtos/${id}/foto`, { method: "DELETE" });

export const listarUnidades = (idProduto: number, idFilial?: number, situacao?: SituacaoUnidade) => {
  const q = new URLSearchParams();
  if (idFilial != null) q.set("idFilial", String(idFilial));
  if (situacao) q.set("situacao", situacao);
  const suffix = q.toString() ? `?${q}` : "";
  return api<ProdutoUnidade[]>(`/produtos/${idProduto}/unidades${suffix}`);
};
export const adicionarUnidades = (idProduto: number, body: { numeros: string[]; idEstoque?: number | null }) =>
  api<ProdutoUnidade[]>(`/produtos/${idProduto}/unidades`, { method: "POST", body: JSON.stringify(body) });
export const excluirUnidade = (idProduto: number, idUnidade: number) =>
  api<void>(`/produtos/${idProduto}/unidades/${idUnidade}`, { method: "DELETE" });

export interface Marca {
  id: number;
  nome: string;
  status: Status;
}

export interface Modelo {
  id: number;
  idMarca: number;
  marcaNome: string;
  nome: string;
  tipo: TipoProduto;
  status: Status;
}

export const listarMarcas = () => api<Marca[]>("/marcas");
export const criarMarca = (body: unknown) =>
  api<Marca>("/marcas", { method: "POST", body: JSON.stringify(body) });
export const atualizarMarca = (id: number, body: unknown) =>
  api<Marca>(`/marcas/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirMarca = (id: number) => api<void>(`/marcas/${id}`, { method: "DELETE" });

export const listarModelos = (idMarca?: number, tipo?: TipoProduto) => {
  const q = new URLSearchParams();
  if (idMarca != null) q.set("idMarca", String(idMarca));
  if (tipo) q.set("tipo", tipo);
  const suffix = q.toString() ? `?${q}` : "";
  return api<Modelo[]>(`/modelos${suffix}`);
};
export const criarModelo = (body: unknown) =>
  api<Modelo>("/modelos", { method: "POST", body: JSON.stringify(body) });
export const atualizarModelo = (id: number, body: unknown) =>
  api<Modelo>(`/modelos/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirModelo = (id: number) => api<void>(`/modelos/${id}`, { method: "DELETE" });

export const listarEstoques = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<Estoque[]>(`/estoques${q}`);
};
export const criarEstoque = (body: unknown) =>
  api<Estoque>("/estoques", { method: "POST", body: JSON.stringify(body) });
export const atualizarEstoque = (id: number, body: unknown) =>
  api<Estoque>(`/estoques/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirEstoque = (id: number) => api<void>(`/estoques/${id}`, { method: "DELETE" });

export const listarEstoqueProdutos = (idEstoque?: number, idFilial?: number) => {
  const q = new URLSearchParams();
  if (idEstoque != null) q.set("idEstoque", String(idEstoque));
  if (idFilial != null) q.set("idFilial", String(idFilial));
  const suffix = q.toString() ? `?${q}` : "";
  return api<EstoqueProduto[]>(`/estoque-produtos${suffix}`);
};
export const criarEstoqueProduto = (body: unknown) =>
  api<EstoqueProduto>("/estoque-produtos", { method: "POST", body: JSON.stringify(body) });
export const atualizarEstoqueProduto = (id: number, body: unknown) =>
  api<EstoqueProduto>(`/estoque-produtos/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirEstoqueProduto = (id: number) =>
  api<void>(`/estoque-produtos/${id}`, { method: "DELETE" });

export interface Cotacao {
  id: number;
  data: string;
  usdPyg: number;
  brlPyg: number;
  status: Status;
}

export const listarCotacoes = () => api<Cotacao[]>("/cotacoes");
export const buscarCotacaoHoje = () => api<Cotacao>("/cotacoes/hoje");
export const criarCotacao = (body: unknown) =>
  api<Cotacao>("/cotacoes", { method: "POST", body: JSON.stringify(body) });
export const atualizarCotacao = (id: number, body: unknown) =>
  api<Cotacao>(`/cotacoes/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirCotacao = (id: number) => api<void>(`/cotacoes/${id}`, { method: "DELETE" });

export type TipoFinalizador = "dinheiro" | "cartao" | "deposito" | "cheque" | "outro";
export type TipoMovimentacaoCaixa =
  | "abertura"
  | "fechamento"
  | "venda"
  | "recebimento"
  | "pagamento"
  | "transferencia_saida"
  | "transferencia_entrada"
  | "suprimento"
  | "sangria";
export type StatusSessaoCaixa = "aberto" | "fechado";
export type StatusVenda = "finalizada" | "cancelada";

export interface Finalizador {
  id: number;
  nome: string;
  tipo: TipoFinalizador;
  geraContasReceber?: boolean;
  geraContasPagar?: boolean;
  fundoTroco?: boolean;
  permiteLancamentoAvulso?: boolean;
  status: Status;
}

export interface Caixa {
  id: number;
  idFilial: number;
  filialNome: string;
  nome: string;
  status: Status;
  sessaoAbertaId?: number | null;
  padrao?: boolean;
}

export interface ValorFinalizador {
  idFinalizador: number;
  finalizadorNome?: string | null;
  valor: number;
  moeda?: Moeda;
  valorPyg?: number;
}

export interface CaixaSessao {
  id: number;
  idCaixa: number;
  caixaNome: string;
  idFilial: number;
  data: string;
  abertoEm: number;
  fechadoEm: number | null;
  idUsuarioAbertura: number;
  usuarioAberturaNome: string;
  idUsuarioFechamento?: number | null;
  observacaoAbertura?: string | null;
  observacaoFechamento?: string | null;
  status: StatusSessaoCaixa;
  saldos: ValorFinalizador[];
}

export interface CaixaMovimentacao {
  id: number;
  idCaixaSessao: number;
  tipo: TipoMovimentacaoCaixa;
  idUsuario: number;
  usuarioNome: string;
  idVenda?: number | null;
  criadoEm: number;
  observacao?: string | null;
  finalizadores: ValorFinalizador[];
}

export interface VendaItem {
  id: number;
  idProduto: number;
  produtoCodigo: string;
  produtoNome: string;
  idEstoque: number;
  estoqueNome: string;
  quantidade: number;
  aliquotaIva: number;
  moedaPreco: string;
  precoLista: number;
  precoUnitarioPyg: number;
  descontoPct?: number;
  descontoPyg?: number;
  totalPyg: number;
  chassis?: string[];
}

export interface VendaNegociacao {
  id: number;
  idFinalizador: number;
  finalizadorNome: string;
  moeda: Moeda;
  valor: number;
  valorPyg: number;
}

export interface Venda {
  id: number;
  idFilial: number;
  filialNome: string;
  idCliente: number;
  clienteNome: string;
  idVendedor: number;
  vendedorNome: string;
  idCaixaSessao: number;
  idCotacao: number;
  totalPyg: number;
  descontoPct?: number;
  descontoPyg?: number;
  observacao?: string | null;
  criadoEm: number;
  status: StatusVenda;
  itens: VendaItem[];
  negociacao: VendaNegociacao[];
}

export const listarFinalizadores = () => api<Finalizador[]>("/finalizadores");
export const criarFinalizador = (body: unknown) =>
  api<Finalizador>("/finalizadores", { method: "POST", body: JSON.stringify(body) });
export const atualizarFinalizador = (id: number, body: unknown) =>
  api<Finalizador>(`/finalizadores/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirFinalizador = (id: number) => api<void>(`/finalizadores/${id}`, { method: "DELETE" });

export const listarCaixas = (idFilial?: number, somenteComAcesso = false) => {
  const q = new URLSearchParams();
  if (idFilial != null) q.set("idFilial", String(idFilial));
  if (somenteComAcesso) q.set("somenteComAcesso", "true");
  const suffix = q.toString() ? `?${q}` : "";
  return api<Caixa[]>(`/caixas${suffix}`);
};
export const criarCaixa = (body: unknown) =>
  api<Caixa>("/caixas", { method: "POST", body: JSON.stringify(body) });
export const atualizarCaixa = (id: number, body: unknown) =>
  api<Caixa>(`/caixas/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const excluirCaixa = (id: number) => api<void>(`/caixas/${id}`, { method: "DELETE" });

export const listarMeusCaixas = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<UsuarioCaixaAcesso[]>(`/meus-caixas${q}`);
};
export const listarCaixaSessoes = (idCaixa: number) => api<CaixaSessao[]>(`/caixas/${idCaixa}/sessoes`);
export const buscarCaixaSessao = (id: number) => api<CaixaSessao>(`/caixa-sessoes/${id}`);
export const abrirCaixaSessao = (body: unknown) =>
  api<CaixaSessao>("/caixa-sessoes", { method: "POST", body: JSON.stringify(body) });
export const fecharCaixaSessao = (id: number, body: unknown) =>
  api<CaixaSessao>(`/caixa-sessoes/${id}/fechar`, { method: "POST", body: JSON.stringify(body) });
export const transferirCaixa = (idSessao: number, body: unknown) =>
  api<void>(`/caixa-sessoes/${idSessao}/transferencias`, { method: "POST", body: JSON.stringify(body) });
export const lancamentoAvulsoCaixa = (idSessao: number, body: unknown) =>
  api<CaixaMovimentacao>(`/caixa-sessoes/${idSessao}/lancamentos`, { method: "POST", body: JSON.stringify(body) });
export const listarCaixaMovimentacoes = (idSessao: number) =>
  api<CaixaMovimentacao[]>(`/caixa-sessoes/${idSessao}/movimentacoes`);

export interface VendedorOpcao {
  id: number;
  nome: string;
}

export const listarVendas = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<Venda[]>(`/vendas${q}`);
};
export const listarVendedoresVenda = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<VendedorOpcao[]>(`/vendas/vendedores${q}`);
};
export const buscarVenda = (id: number) => api<Venda>(`/vendas/${id}`);
export const criarVenda = (body: unknown) =>
  api<Venda>("/vendas", { method: "POST", body: JSON.stringify(body) });

export interface DocumentoEletronicoPreview {
  idVenda: number;
  pronto: boolean;
  avisos: string[];
  documento?: unknown;
  payload?: unknown;
}

export const previewDocumentoEletronico = (idVenda: number) =>
  api<DocumentoEletronicoPreview>(`/vendas/${idVenda}/documento-eletronico`);

export type EstadoFactura = "pendente" | "processando" | "aprobado" | "rechazado" | "cancelado";

export interface FacturaResumo {
  id: number;
  idFilial: number;
  idVenda: number;
  referencia: string;
  sudtaxId: number | null;
  cdc: string | null;
  cdcFormatado: string | null;
  estado: EstadoFactura | string;
  mensagem: string | null;
  protocoloLote: string | null;
  codigoSifen: string | null;
  estabelecimento: string | null;
  pontoExpedicao: string | null;
  clienteNome: string;
  totalPyg: number;
  criadoEm: number;
  atualizadoEm: number;
}

export interface Factura extends FacturaResumo {
  payloadEnvio: string | null;
}

export interface VendaElegivelFactura {
  id: number;
  clienteNome: string;
  totalPyg: number;
  criadoEm: number;
}

export const listarFacturas = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<FacturaResumo[]>(`/facturas${q}`);
};
export const listarVendasElegiveisFactura = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<VendaElegivelFactura[]>(`/facturas/vendas-elegiveis${q}`);
};
export const buscarFactura = (id: number) => api<Factura>(`/facturas/${id}`);
export const buscarFacturaPorVenda = (idVenda: number) =>
  api<Factura | undefined>(`/facturas/por-venda?idVenda=${idVenda}`);
export const emitirFactura = (body: { idVenda: number; enviar?: boolean }) =>
  api<Factura>("/facturas", { method: "POST", body: JSON.stringify(body) });
export const enviarFactura = (id: number) =>
  api<Factura>(`/facturas/${id}/enviar`, { method: "POST", body: "{}" });
export const consultarFactura = (id: number) =>
  api<Factura>(`/facturas/${id}/consultar`, { method: "POST", body: "{}" });

export type ModoVencimento = "intervalo_30" | "dia_fixo";
export type OrigemTitulo = "venda" | "manual" | "compra";
export type StatusTitulo = "aberto" | "parcial" | "quitado" | "cancelado";
export type StatusParcela = "aberta" | "parcial" | "paga" | "cancelada";

export interface ParcelasConfig {
  quantidade: number;
  modoVencimento: ModoVencimento;
  diaVencimento?: number | null;
}

export interface ParcelaTitulo {
  id: number;
  numero: number;
  vencimento: string;
  valor: number;
  valorPyg: number;
  saldo: number;
  status: StatusParcela;
}

export interface BaixaTitulo {
  id: number;
  idParcela: number;
  idFinalizador: number;
  finalizadorNome: string;
  idCaixaSessao: number;
  moeda: Moeda;
  valor: number;
  valorPyg: number;
  desconto?: number;
  descontoPyg?: number;
  acrescimo?: number;
  acrescimoPyg?: number;
  criadoEm: number;
  observacao?: string | null;
}

export interface TituloReceberResumo {
  id: number;
  idFilial: number;
  idCliente: number;
  clienteNome: string;
  origem: OrigemTitulo;
  idVenda?: number | null;
  moeda: Moeda;
  valor: number;
  valorPyg: number;
  saldoPyg: number;
  criadoEm: number;
  status: StatusTitulo;
  proximoVencimento?: string | null;
}

export interface TituloPagarResumo {
  id: number;
  idFilial: number;
  idFornecedor: number;
  fornecedorNome: string;
  origem: OrigemTitulo;
  moeda: Moeda;
  valor: number;
  valorPyg: number;
  saldoPyg: number;
  criadoEm: number;
  status: StatusTitulo;
  proximoVencimento?: string | null;
}

export interface TituloReceber extends TituloReceberResumo {
  filialNome: string;
  idCotacao: number;
  usdPyg: number;
  brlPyg: number;
  observacao?: string | null;
  parcelas: ParcelaTitulo[];
  baixas: BaixaTitulo[];
}

export interface TituloPagar extends TituloPagarResumo {
  filialNome: string;
  idCotacao: number;
  usdPyg: number;
  brlPyg: number;
  observacao?: string | null;
  parcelas: ParcelaTitulo[];
  baixas: BaixaTitulo[];
}

export const listarTitulosReceber = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<TituloReceberResumo[]>(`/titulos-receber${q}`);
};
export const buscarTituloReceber = (id: number) => api<TituloReceber>(`/titulos-receber/${id}`);
export const criarTituloReceber = (body: unknown) =>
  api<TituloReceber>("/titulos-receber", { method: "POST", body: JSON.stringify(body) });
export const baixarRecebimento = (body: unknown) =>
  api<TituloReceber>("/recebimentos", { method: "POST", body: JSON.stringify(body) });

export const listarTitulosPagar = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<TituloPagarResumo[]>(`/titulos-pagar${q}`);
};
export const buscarTituloPagar = (id: number) => api<TituloPagar>(`/titulos-pagar/${id}`);
export const criarTituloPagar = (body: unknown) =>
  api<TituloPagar>("/titulos-pagar", { method: "POST", body: JSON.stringify(body) });
export const baixarPagamento = (body: unknown) =>
  api<TituloPagar>("/pagamentos", { method: "POST", body: JSON.stringify(body) });

export type TipoDocumentoEntrada = "py_factura" | "exterior";
export type CondicionEntrada = "contado" | "credito";
export type StatusEntrada = "finalizada" | "cancelada";

export interface EntradaResumo {
  id: number;
  idFilial: number;
  idFornecedor: number;
  fornecedorNome: string;
  tipoDocumento: TipoDocumentoEntrada;
  dataEmissao: string;
  moeda: Moeda;
  valor: number;
  valorPyg: number;
  documentoLabel: string;
  criadoEm: number;
  status: StatusEntrada;
}

export interface EntradaItem {
  id: number;
  idProduto: number;
  produtoCodigo: string;
  produtoNome: string;
  idEstoque: number;
  estoqueNome: string;
  quantidade: number;
  aliquotaIva: number;
  moeda: Moeda;
  valorUnitario: number;
  valor: number;
  valorPyg: number;
  chassis: string[];
}

export interface EntradaNegociacao {
  id: number;
  idFinalizador: number;
  finalizadorNome: string;
  moeda: Moeda;
  valor: number;
  valorPyg: number;
}

export interface Entrada extends EntradaResumo {
  filialNome: string;
  idCotacao: number;
  usdPyg: number;
  brlPyg: number;
  timbrado?: string | null;
  establecimiento?: string | null;
  puntoExpedicion?: string | null;
  numero?: string | null;
  cdc?: string | null;
  condicion?: CondicionEntrada | null;
  numeroDocumento?: string | null;
  incoterm?: string | null;
  idCaixaSessao?: number | null;
  idTituloPagar?: number | null;
  observacao?: string | null;
  itens: EntradaItem[];
  negociacao: EntradaNegociacao[];
}

export const listarEntradas = (idFilial?: number) => {
  const q = idFilial != null ? `?idFilial=${idFilial}` : "";
  return api<EntradaResumo[]>(`/entradas${q}`);
};
export const buscarEntrada = (id: number) => api<Entrada>(`/entradas/${id}`);
export const criarEntrada = (body: unknown) =>
  api<Entrada>("/entradas", { method: "POST", body: JSON.stringify(body) });

export interface SeedDemoStatus {
  habilitado?: boolean;
  aplicado: boolean;
  clientes: number;
  fornecedores?: number;
  produtos: number;
  vendas: number;
  caixas: number;
  finalizadores: number;
  usuarios?: number;
  marcas?: number;
  estoques?: number;
}

export const statusSeedDemo = () => api<SeedDemoStatus>("/seed/demo");
export const aplicarSeedDemo = () => api<SeedDemoStatus>("/seed/demo", { method: "POST" });
export const removerSeedDemo = () => api<SeedDemoStatus>("/seed/demo", { method: "DELETE" });
