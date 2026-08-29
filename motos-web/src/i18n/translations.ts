export type Locale = "pt" | "es";

export type TranslationKey =
  | "app.name"
  | "login.title"
  | "login.login"
  | "login.password"
  | "login.submit"
  | "login.error"
  | "login.showPassword"
  | "login.hidePassword"
  | "nav.menu"
  | "nav.cadastros"
  | "nav.dashboard"
  | "nav.clientes"
  | "nav.fornecedores"
  | "nav.usuarios"
  | "nav.paises"
  | "nav.divisoes"
  | "nav.cidades"
  | "nav.documentos"
  | "theme.light"
  | "theme.dark"
  | "lang.pt"
  | "lang.es"
  | "lang.label"
  | "user.changePassword"
  | "user.editProfile"
  | "user.defaultLanguage"
  | "user.logout"
  | "user.profile"
  | "common.save"
  | "common.cancel"
  | "common.edit"
  | "common.delete"
  | "common.search"
  | "common.back"
  | "common.saving"
  | "common.noRecords"
  | "common.previous"
  | "common.next"
  | "common.showing"
  | "common.of"
  | "common.connected"
  | "common.offline"
  | "common.connecting"
  | "common.apiBackend"
  | "common.theme"
  | "common.required"
  | "common.name"
  | "common.email"
  | "common.login"
  | "common.password"
  | "common.status"
  | "common.active"
  | "common.inactive"
  | "common.profile"
  | "common.new"
  | "common.registered"
  | "common.yes"
  | "common.no"
  | "usuario.title"
  | "usuario.new"
  | "usuario.edit"
  | "usuario.passwordHint"
  | "perfil.administrador"
  | "perfil.gestor"
  | "perfil.operador"
  | "perfil.vendedor"
  | "password.current"
  | "password.new"
  | "password.confirm"
  | "password.success"
  | "profile.success"
  | "system.online"
  | "system.offline"
  | "system.checking"
  | "password.mismatch"
  | "papel.edit"
  | "papel.new"
  | "papel.section.identification"
  | "papel.section.contact"
  | "papel.section.address"
  | "papel.section.document"
  | "papel.name"
  | "papel.namePlaceholder"
  | "papel.personType"
  | "papel.personType.fisica"
  | "papel.personType.juridica"
  | "papel.streetType"
  | "papel.streetTypePlaceholder"
  | "papel.street"
  | "papel.streetPlaceholder"
  | "papel.number"
  | "papel.numberPlaceholder"
  | "papel.neighborhood"
  | "papel.postalCode"
  | "papel.postalCodePlaceholder"
  | "papel.complement"
  | "papel.city"
  | "papel.noCity"
  | "papel.country"
  | "papel.docType"
  | "papel.docNumber"
  | "papel.noDocType"
  | "papel.manageDocTypes"
  | "papel.useExisting"
  | "papel.searchPlaceholder"
  | "papel.error.nameRequired"
  | "papel.error.phonePair"
  | "papel.error.docRequired"
  | "papel.error.docNumberRequired"
  | "papel.error.saveFailed"
  | "papel.hint.cpf"
  | "papel.hint.cnpj"
  | "papel.hint.ci"
  | "papel.hint.ruc"
  | "ddi.label"
  | "ddi.searchPlaceholder"
  | "ddi.searchInputPlaceholder"
  | "ddi.noPhone"
  | "ddi.other"
  | "ddi.otherManual"
  | "ddi.phonePlaceholder"
  | "ddi.phone"
  | "cidade.searchPlaceholder"
  | "cidade.searchInputPlaceholder"
  | "country.BR"
  | "country.PY"
  | "country.AR"
  | "country.BO"
  | "country.CL"
  | "country.CO"
  | "country.PE"
  | "country.UY"
  | "country.US"
  | "country.PT"
  | "country.ES"
  | "tipoPessoa.fisica"
  | "tipoPessoa.juridica"
  | "tipoPessoa.fisicaShort"
  | "tipoPessoa.juridicaShort"
  | "ficha.title"
  | "ficha.close"
  | "ficha.notInformed"
  | "ficha.inactivate"
  | "ficha.activate"
  | "ficha.confirmDelete"
  | "ficha.confirmInactivate"
  | "ficha.confirmActivate"
  | "col.id"
  | "col.document"
  | "col.phone"
  | "col.city"
  | "col.person"
  | "col.code"
  | "col.unique"
  | "col.initials"
  | "col.division"
  | "col.divisionRegion"
  | "col.searchDocTypes";

const pt: Record<TranslationKey, string> = {
  "app.name": "Monarca Bike",
  "login.title": "Acesso ao sistema",
  "login.login": "Login",
  "login.password": "Senha",
  "login.submit": "Entrar",
  "login.error": "Login ou senha inválidos",
  "login.showPassword": "Mostrar senha",
  "login.hidePassword": "Ocultar senha",
  "nav.menu": "Menu",
  "nav.cadastros": "Cadastros",
  "nav.dashboard": "Dashboard",
  "nav.clientes": "Clientes",
  "nav.fornecedores": "Fornecedores",
  "nav.usuarios": "Usuários",
  "nav.paises": "Países",
  "nav.divisoes": "UFs / Departamentos",
  "nav.cidades": "Cidades",
  "nav.documentos": "Tipos de documento",
  "theme.light": "Claro",
  "theme.dark": "Escuro",
  "lang.pt": "Português",
  "lang.es": "Español",
  "lang.label": "Idioma",
  "user.changePassword": "Alterar Senha",
  "user.editProfile": "Editar Perfil",
  "user.defaultLanguage": "Idioma Padrão do Usuário",
  "user.logout": "Sair",
  "user.profile": "Perfil",
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Excluir",
  "common.search": "Buscar...",
  "common.back": "Voltar para a lista",
  "common.saving": "Salvando...",
  "common.noRecords": "Nenhum registro",
  "common.previous": "Anterior",
  "common.next": "Próxima",
  "common.showing": "Mostrando",
  "common.of": "de",
  "common.connected": "Conectado",
  "common.offline": "Offline",
  "common.connecting": "Conectando...",
  "common.apiBackend": "API Backend",
  "common.theme": "Tema",
  "common.required": "obrigatório",
  "common.name": "Nome",
  "common.email": "E-mail",
  "common.login": "Login",
  "common.password": "Senha",
  "common.status": "Status",
  "common.active": "Ativo",
  "common.inactive": "Inativo",
  "common.profile": "Perfil",
  "common.new": "Novo",
  "common.registered": "cadastrados",
  "common.yes": "Sim",
  "common.no": "Não",
  "usuario.title": "Usuários",
  "usuario.new": "Novo usuário",
  "usuario.edit": "Editar usuário",
  "usuario.passwordHint": "Deixe em branco para manter a senha atual",
  "perfil.administrador": "Administrador",
  "perfil.gestor": "Gestor",
  "perfil.operador": "Operador",
  "perfil.vendedor": "Vendedor",
  "password.current": "Senha atual",
  "password.new": "Nova senha",
  "password.confirm": "Confirmar nova senha",
  "password.success": "Senha alterada com sucesso",
  "profile.success": "Perfil atualizado com sucesso",
  "system.online": "Sistema online",
  "system.offline": "Sistema indisponível",
  "system.checking": "Verificando...",
  "password.mismatch": "Senhas não conferem",
  "papel.edit": "Editar",
  "papel.new": "Novo",
  "papel.section.identification": "Identificação",
  "papel.section.contact": "Contato",
  "papel.section.address": "Endereço",
  "papel.section.document": "Documento",
  "papel.name": "Nome / razão social",
  "papel.namePlaceholder": "Nome completo",
  "papel.personType": "Tipo de pessoa",
  "papel.personType.fisica": "Pessoa física",
  "papel.personType.juridica": "Pessoa jurídica",
  "papel.streetType": "Tipo",
  "papel.streetTypePlaceholder": "Rua",
  "papel.street": "Logradouro",
  "papel.streetPlaceholder": "Nome da rua",
  "papel.number": "Nº",
  "papel.numberPlaceholder": "Nº",
  "papel.neighborhood": "Bairro",
  "papel.postalCode": "CEP / Código Postal",
  "papel.postalCodePlaceholder": "00000000",
  "papel.complement": "Complemento",
  "papel.city": "Cidade",
  "papel.noCity": "Sem cidade",
  "papel.country": "País",
  "papel.docType": "Tipo",
  "papel.docNumber": "Número",
  "papel.noDocType": "Nenhum tipo — cadastre em Tipos de documento",
  "papel.manageDocTypes": "Gerenciar tipos de documento",
  "papel.useExisting": "Usar como",
  "papel.searchPlaceholder": "Nome, documento, cidade...",
  "papel.error.nameRequired": "Informe o nome / razão social",
  "papel.error.phonePair": "Informe DDI e telefone juntos, ou deixe ambos vazios",
  "papel.error.docRequired": "Informe o documento",
  "papel.error.docNumberRequired": "Informe o número do documento",
  "papel.error.saveFailed": "Falha ao salvar",
  "papel.hint.cpf": "Com ou sem pontuação; validamos os dígitos verificadores",
  "papel.hint.cnpj": "14 caracteres (numérico ou alfanumérico); aceita letras A–Z nas 12 primeiras posições",
  "papel.hint.ci": "6 a 10 dígitos (Paraguai)",
  "papel.hint.ruc": "Formato 1234567-8 ou 12345678 — validamos o dígito verificador",
  "ddi.label": "País / DDI",
  "ddi.searchPlaceholder": "Buscar país ou código…",
  "ddi.searchInputPlaceholder": "País, sigla ou +55…",
  "ddi.noPhone": "— Sem telefone",
  "ddi.other": "Outro (DDI manual)",
  "ddi.otherManual": "Outro — informe o DDI",
  "ddi.phonePlaceholder": "Número",
  "ddi.phone": "Telefone",
  "cidade.searchPlaceholder": "Buscar cidade…",
  "cidade.searchInputPlaceholder": "Nome, UF ou país…",
  "country.BR": "Brasil",
  "country.PY": "Paraguai",
  "country.AR": "Argentina",
  "country.BO": "Bolívia",
  "country.CL": "Chile",
  "country.CO": "Colômbia",
  "country.PE": "Peru",
  "country.UY": "Uruguai",
  "country.US": "EUA / Canadá",
  "country.PT": "Portugal",
  "country.ES": "Espanha",
  "tipoPessoa.fisica": "Pessoa física",
  "tipoPessoa.juridica": "Pessoa jurídica",
  "tipoPessoa.fisicaShort": "Física",
  "tipoPessoa.juridicaShort": "Jurídica",
  "ficha.title": "Ficha",
  "ficha.close": "Fechar",
  "ficha.notInformed": "Não informado",
  "ficha.inactivate": "Inativar",
  "ficha.activate": "Reativar",
  "ficha.confirmDelete": "Excluir este registro?",
  "ficha.confirmInactivate": "Inativar este registro?",
  "ficha.confirmActivate": "Reativar este registro?",
  "col.id": "ID",
  "col.document": "Documento",
  "col.phone": "Telefone",
  "col.city": "Cidade",
  "col.person": "Pessoa",
  "col.code": "Código",
  "col.unique": "Único",
  "col.initials": "Sigla",
  "col.division": "Divisão",
  "col.divisionRegion": "UF / departamento",
  "col.searchDocTypes": "Buscar código, nome, país...",
};

const es: Record<TranslationKey, string> = {
  "app.name": "Monarca Bike",
  "login.title": "Acceso al sistema",
  "login.login": "Usuario",
  "login.password": "Contraseña",
  "login.submit": "Ingresar",
  "login.error": "Usuario o contraseña inválidos",
  "login.showPassword": "Mostrar contraseña",
  "login.hidePassword": "Ocultar contraseña",
  "nav.menu": "Menú",
  "nav.cadastros": "Registros",
  "nav.dashboard": "Panel",
  "nav.clientes": "Clientes",
  "nav.fornecedores": "Proveedores",
  "nav.usuarios": "Usuarios",
  "nav.paises": "Países",
  "nav.divisoes": "UF / Departamentos",
  "nav.cidades": "Ciudades",
  "nav.documentos": "Tipos de documento",
  "theme.light": "Claro",
  "theme.dark": "Oscuro",
  "lang.pt": "Português",
  "lang.es": "Español",
  "lang.label": "Idioma",
  "user.changePassword": "Cambiar contraseña",
  "user.editProfile": "Editar perfil",
  "user.defaultLanguage": "Idioma predeterminado",
  "user.logout": "Salir",
  "user.profile": "Perfil",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Eliminar",
  "common.search": "Buscar...",
  "common.back": "Volver a la lista",
  "common.saving": "Guardando...",
  "common.noRecords": "Sin registros",
  "common.previous": "Anterior",
  "common.next": "Siguiente",
  "common.showing": "Mostrando",
  "common.of": "de",
  "common.connected": "Conectado",
  "common.offline": "Desconectado",
  "common.connecting": "Conectando...",
  "common.apiBackend": "API Backend",
  "common.theme": "Tema",
  "common.required": "obligatorio",
  "common.name": "Nombre",
  "common.email": "Correo electrónico",
  "common.login": "Usuario",
  "common.password": "Contraseña",
  "common.status": "Estado",
  "common.active": "Activo",
  "common.inactive": "Inactivo",
  "common.profile": "Perfil",
  "common.new": "Nuevo",
  "common.registered": "registrados",
  "common.yes": "Sí",
  "common.no": "No",
  "usuario.title": "Usuarios",
  "usuario.new": "Nuevo usuario",
  "usuario.edit": "Editar usuario",
  "usuario.passwordHint": "Deje en blanco para mantener la contraseña actual",
  "perfil.administrador": "Administrador",
  "perfil.gestor": "Gestor",
  "perfil.operador": "Operador",
  "perfil.vendedor": "Vendedor",
  "password.current": "Contraseña actual",
  "password.new": "Nueva contraseña",
  "password.confirm": "Confirmar nueva contraseña",
  "password.success": "Contraseña cambiada con éxito",
  "profile.success": "Perfil actualizado con éxito",
  "system.online": "Sistema en línea",
  "system.offline": "Sistema no disponible",
  "system.checking": "Verificando...",
  "password.mismatch": "Las contraseñas no coinciden",
  "papel.edit": "Editar",
  "papel.new": "Nuevo",
  "papel.section.identification": "Identificación",
  "papel.section.contact": "Contacto",
  "papel.section.address": "Dirección",
  "papel.section.document": "Documento",
  "papel.name": "Nombre / razón social",
  "papel.namePlaceholder": "Nombre completo",
  "papel.personType": "Tipo de persona",
  "papel.personType.fisica": "Persona física",
  "papel.personType.juridica": "Persona jurídica",
  "papel.streetType": "Tipo",
  "papel.streetTypePlaceholder": "Calle",
  "papel.street": "Dirección",
  "papel.streetPlaceholder": "Nombre de la calle",
  "papel.number": "Nº",
  "papel.numberPlaceholder": "Nº",
  "papel.neighborhood": "Barrio",
  "papel.postalCode": "CEP / Código Postal",
  "papel.postalCodePlaceholder": "00000000",
  "papel.complement": "Complemento",
  "papel.city": "Ciudad",
  "papel.noCity": "Sin ciudad",
  "papel.country": "País",
  "papel.docType": "Tipo",
  "papel.docNumber": "Número",
  "papel.noDocType": "Ningún tipo — regístrelo en Tipos de documento",
  "papel.manageDocTypes": "Administrar tipos de documento",
  "papel.useExisting": "Usar como",
  "papel.searchPlaceholder": "Nombre, documento, ciudad...",
  "papel.error.nameRequired": "Indique el nombre / razón social",
  "papel.error.phonePair": "Indique DDI y teléfono juntos, o deje ambos vacíos",
  "papel.error.docRequired": "Indique el documento",
  "papel.error.docNumberRequired": "Indique el número del documento",
  "papel.error.saveFailed": "Error al guardar",
  "papel.hint.cpf": "Con o sin puntuación; validamos los dígitos verificadores",
  "papel.hint.cnpj": "14 caracteres (numérico o alfanumérico); acepta letras A–Z en las 12 primeras posiciones",
  "papel.hint.ci": "6 a 10 dígitos (Paraguay)",
  "papel.hint.ruc": "Formato 1234567-8 o 12345678 — validamos el dígito verificador",
  "ddi.label": "País / DDI",
  "ddi.searchPlaceholder": "Buscar país o código…",
  "ddi.searchInputPlaceholder": "País, sigla o +55…",
  "ddi.noPhone": "— Sin teléfono",
  "ddi.other": "Otro (DDI manual)",
  "ddi.otherManual": "Otro — indique el DDI",
  "ddi.phonePlaceholder": "Número",
  "ddi.phone": "Teléfono",
  "cidade.searchPlaceholder": "Buscar ciudad…",
  "cidade.searchInputPlaceholder": "Nombre, UF o país…",
  "country.BR": "Brasil",
  "country.PY": "Paraguay",
  "country.AR": "Argentina",
  "country.BO": "Bolivia",
  "country.CL": "Chile",
  "country.CO": "Colombia",
  "country.PE": "Perú",
  "country.UY": "Uruguay",
  "country.US": "EE.UU. / Canadá",
  "country.PT": "Portugal",
  "country.ES": "España",
  "tipoPessoa.fisica": "Persona física",
  "tipoPessoa.juridica": "Persona jurídica",
  "tipoPessoa.fisicaShort": "Física",
  "tipoPessoa.juridicaShort": "Jurídica",
  "ficha.title": "Ficha",
  "ficha.close": "Cerrar",
  "ficha.notInformed": "No informado",
  "ficha.inactivate": "Inactivar",
  "ficha.activate": "Reactivar",
  "ficha.confirmDelete": "¿Eliminar este registro?",
  "ficha.confirmInactivate": "¿Inactivar este registro?",
  "ficha.confirmActivate": "¿Reactivar este registro?",
  "col.id": "ID",
  "col.document": "Documento",
  "col.phone": "Teléfono",
  "col.city": "Ciudad",
  "col.person": "Persona",
  "col.code": "Código",
  "col.unique": "Único",
  "col.initials": "Sigla",
  "col.division": "División",
  "col.divisionRegion": "UF / departamento",
  "col.searchDocTypes": "Buscar código, nombre, país...",
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { pt, es };

export function localeLabel(locale: Locale): string {
  return locale === "pt" ? "PT" : "ES";
}

/** Chaves de tradução para nomes de países no seletor de DDI. */
export function countryTranslationKey(iso: string): TranslationKey {
  return `country.${iso}` as TranslationKey;
}
