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
  | "nav.empresa"
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
  | "papel.registeredBranches"
  | "papel.confirmLinkBranch"
  | "papel.conflict.linkBranch"
  | "papel.viewExisting"
  | "papel.existingPreviewTitle"
  | "papel.alreadyCliente"
  | "papel.alreadyFornecedor"
  | "papel.loadExistingFailed"
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
  | "ficha.confirmDeleteBranch"
  | "ficha.confirmInactivate"
  | "ficha.confirmActivate"
  | "ficha.noContact"
  | "ficha.noAddress"
  | "ficha.moreDocuments"
  | "ficha.prev"
  | "ficha.next"
  | "papel.actionsMenu"
  | "papel.viewSheet"
  | "col.actions"
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
  | "col.searchDocTypes"
  | "dashboard.subtitle"
  | "dashboard.stat.clientes"
  | "dashboard.stat.clientesSub"
  | "dashboard.stat.fornecedores"
  | "dashboard.stat.fornecedoresSub"
  | "dashboard.stat.estoque"
  | "dashboard.stat.estoqueSub"
  | "dashboard.placeholder"
  | "common.error.loadFailed"
  | "common.error.saveFailed"
  | "common.error.deleteFailed"
  | "common.confirmDelete"
  | "common.select"
  | "common.passwordMinHint"
  | "usuario.error.required"
  | "usuario.error.passwordRequired"
  | "usuario.error.passwordMin"
  | "documento.new"
  | "documento.edit"
  | "documento.error.required"
  | "documento.code"
  | "documento.codeHint"
  | "documento.displayName"
  | "documento.uniqueLabel"
  | "documento.confirmDelete"
  | "pais.new"
  | "pais.edit"
  | "pais.error.required"
  | "pais.isoSigla"
  | "pais.isoHint"
  | "pais.useDivisionSigla"
  | "pais.divisionSiglaUf"
  | "pais.divisionSiglaDept"
  | "pais.divisionTypeUf"
  | "pais.divisionTypeDept"
  | "pais.placeholderName"
  | "divisao.new"
  | "divisao.edit"
  | "divisao.error.required"
  | "divisao.siglaHint"
  | "divisao.placeholderName"
  | "cidade.new"
  | "cidade.edit"
  | "cidade.error.required"
  | "cidade.placeholderName"
  | "cidade.selectDivision"
  | "error.conflict.docUnique"
  | "error.conflict.possibleDuplicate"
  | "entity.cliente"
  | "entity.fornecedor"
  | "empresa.title"
  | "empresa.section.company"
  | "empresa.section.branches"
  | "empresa.razaoSocial"
  | "empresa.nomeFantasia"
  | "empresa.ruc"
  | "empresa.representanteNome"
  | "empresa.representanteDocumento"
  | "empresa.branchNew"
  | "empresa.branchEdit"
  | "empresa.principal"
  | "empresa.timbrado"
  | "empresa.timbradoInicio"
  | "empresa.timbradoFim"
  | "empresa.estabelecimento"
  | "empresa.pontoExpedicao"
  | "empresa.error.required"
  | "empresa.error.loadFailed"
  | "empresa.error.saveFailed"
  | "empresa.error.deleteFailed"
  | "empresa.confirmDeleteBranch"
  | "empresa.listClientsBranchOnly"
  | "empresa.listSuppliersBranchOnly"
  | "empresa.branchParameters"
  | "empresa.section.parametersListagem";

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
  "nav.empresa": "Empresa",
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
  "papel.registeredBranches": "Filiais com cadastro",
  "papel.confirmLinkBranch": "Confirmar vínculo nesta filial",
  "papel.conflict.linkBranch": "{nome} já está cadastrado em {filiais}. Vincular também em {filialAlvo}?",
  "papel.viewExisting": "Ver cadastro",
  "papel.existingPreviewTitle": "Cadastro existente",
  "papel.alreadyCliente": "Já é cliente",
  "papel.alreadyFornecedor": "Já é fornecedor",
  "papel.loadExistingFailed": "Não foi possível carregar o cadastro",
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
  "ficha.confirmDeleteBranch": "Remover o vínculo desta filial? O cadastro continua nas demais filiais.",
  "ficha.confirmInactivate": "Inativar este registro?",
  "ficha.confirmActivate": "Reativar este registro?",
  "ficha.noContact": "Sem contato cadastrado",
  "ficha.noAddress": "Sem endereço cadastrado",
  "ficha.moreDocuments": "Outros documentos",
  "ficha.prev": "Anterior",
  "ficha.next": "Próximo",
  "papel.actionsMenu": "Ações",
  "papel.viewSheet": "Ver ficha",
  "col.actions": "",
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
  "dashboard.subtitle": "O que já está no sistema · {app}",
  "dashboard.stat.clientes": "Clientes",
  "dashboard.stat.clientesSub": "Papel cliente ativo",
  "dashboard.stat.fornecedores": "Fornecedores",
  "dashboard.stat.fornecedoresSub": "Papel fornecedor ativo",
  "dashboard.stat.estoque": "Estoque e vendas",
  "dashboard.stat.estoqueSub": "Ainda sem CRUD",
  "dashboard.placeholder": "Motos, vendas e parcelas entram no menu quando o cadastro existir. Por enquanto só o que a API já faz.",
  "common.error.loadFailed": "Falha ao carregar",
  "common.error.saveFailed": "Falha ao salvar",
  "common.error.deleteFailed": "Falha ao excluir",
  "common.confirmDelete": "Excluir {name}?",
  "common.select": "Selecione",
  "common.passwordMinHint": "Mínimo 8 caracteres",
  "usuario.error.required": "Informe nome, login e e-mail",
  "usuario.error.passwordRequired": "Senha é obrigatória",
  "usuario.error.passwordMin": "Senha deve ter pelo menos 8 caracteres",
  "documento.new": "Novo tipo de documento",
  "documento.edit": "Editar tipo de documento",
  "documento.error.required": "Informe país, código e nome",
  "documento.code": "Código",
  "documento.codeHint": "Ex.: CPF, RUC, DNI",
  "documento.displayName": "Nome exibido",
  "documento.uniqueLabel": "Documento único (não permite duplicar número no sistema)",
  "documento.confirmDelete": "Excluir {code}?",
  "pais.new": "Novo país",
  "pais.edit": "Editar país",
  "pais.error.required": "Informe nome e sigla",
  "pais.isoSigla": "Sigla ISO",
  "pais.isoHint": "Duas letras, ex. BR",
  "pais.useDivisionSigla": "Usa sigla na divisão",
  "pais.divisionSiglaUf": "Sim (UF)",
  "pais.divisionSiglaDept": "Não (departamento)",
  "pais.divisionTypeUf": "UF (sigla)",
  "pais.divisionTypeDept": "Departamento",
  "pais.placeholderName": "Brasil",
  "divisao.new": "Nova UF / departamento",
  "divisao.edit": "Editar UF / departamento",
  "divisao.error.required": "Informe país e nome",
  "divisao.siglaHint": "Opcional. Ex. MS. Deixe vazio para departamento.",
  "divisao.placeholderName": "Mato Grosso Do Sul",
  "cidade.new": "Nova cidade",
  "cidade.edit": "Editar cidade",
  "cidade.error.required": "Informe divisão e nome",
  "cidade.placeholderName": "Ponta Porã",
  "cidade.selectDivision": "Selecione",
  "error.conflict.docUnique": "Já existe uma pessoa cadastrada com {tipo} {numero}",
  "error.conflict.possibleDuplicate": "Já existe uma pessoa com o mesmo documento. Confirme se deseja cadastrar outra pessoa.",
  "entity.cliente": "Cliente",
  "entity.fornecedor": "Fornecedor",
  "empresa.title": "Empresa e filiais",
  "empresa.section.company": "Dados da empresa",
  "empresa.section.branches": "Filiais",
  "empresa.razaoSocial": "Razão social",
  "empresa.nomeFantasia": "Nome fantasia",
  "empresa.ruc": "RUC",
  "empresa.representanteNome": "Representante",
  "empresa.representanteDocumento": "Documento do representante",
  "empresa.branchNew": "Nova filial",
  "empresa.branchEdit": "Editar filial",
  "empresa.principal": "Principal",
  "empresa.timbrado": "Timbrado",
  "empresa.timbradoInicio": "Vigência início",
  "empresa.timbradoFim": "Vigência fim",
  "empresa.estabelecimento": "Nº estabelecimento",
  "empresa.pontoExpedicao": "Ponto expedição",
  "empresa.error.required": "Preencha razão social, nome fantasia e RUC",
  "empresa.error.loadFailed": "Não foi possível carregar empresa e filiais",
  "empresa.error.saveFailed": "Não foi possível salvar",
  "empresa.error.deleteFailed": "Não foi possível excluir a filial",
  "empresa.confirmDeleteBranch": "Excluir esta filial?",
  "empresa.listClientsBranchOnly": "Listar só clientes desta filial",
  "empresa.listSuppliersBranchOnly": "Listar só fornecedores desta filial",
  "empresa.branchParameters": "Parâmetros da filial",
  "empresa.section.parametersListagem": "Listagem",
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
  "nav.empresa": "Empresa",
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
  "papel.registeredBranches": "Sucursales con registro",
  "papel.confirmLinkBranch": "Confirmar vínculo en esta sucursal",
  "papel.conflict.linkBranch": "{nome} ya está registrado en {filiais}. ¿Vincular también en {filialAlvo}?",
  "papel.viewExisting": "Ver registro",
  "papel.existingPreviewTitle": "Registro existente",
  "papel.alreadyCliente": "Ya es cliente",
  "papel.alreadyFornecedor": "Ya es proveedor",
  "papel.loadExistingFailed": "No se pudo cargar el registro",
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
  "ficha.confirmDeleteBranch": "¿Quitar el vínculo de esta sucursal? El registro sigue en las demás.",
  "ficha.confirmInactivate": "¿Inactivar este registro?",
  "ficha.confirmActivate": "¿Reactivar este registro?",
  "ficha.noContact": "Sin contacto registrado",
  "ficha.noAddress": "Sin dirección registrada",
  "ficha.moreDocuments": "Otros documentos",
  "ficha.prev": "Anterior",
  "ficha.next": "Siguiente",
  "papel.actionsMenu": "Acciones",
  "papel.viewSheet": "Ver ficha",
  "col.actions": "",
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
  "dashboard.subtitle": "Lo que ya está en el sistema · {app}",
  "dashboard.stat.clientes": "Clientes",
  "dashboard.stat.clientesSub": "Rol cliente activo",
  "dashboard.stat.fornecedores": "Proveedores",
  "dashboard.stat.fornecedoresSub": "Rol proveedor activo",
  "dashboard.stat.estoque": "Stock y ventas",
  "dashboard.stat.estoqueSub": "Aún sin CRUD",
  "dashboard.placeholder": "Motos, ventas y cuotas entrarán en el menú cuando exista el registro. Por ahora solo lo que ya hace la API.",
  "common.error.loadFailed": "Error al cargar",
  "common.error.saveFailed": "Error al guardar",
  "common.error.deleteFailed": "Error al eliminar",
  "common.confirmDelete": "¿Eliminar {name}?",
  "common.select": "Seleccione",
  "common.passwordMinHint": "Mínimo 8 caracteres",
  "usuario.error.required": "Indique nombre, usuario y correo",
  "usuario.error.passwordRequired": "La contraseña es obligatoria",
  "usuario.error.passwordMin": "La contraseña debe tener al menos 8 caracteres",
  "documento.new": "Nuevo tipo de documento",
  "documento.edit": "Editar tipo de documento",
  "documento.error.required": "Indique país, código y nombre",
  "documento.code": "Código",
  "documento.codeHint": "Ej.: CPF, RUC, DNI",
  "documento.displayName": "Nombre mostrado",
  "documento.uniqueLabel": "Documento único (no permite duplicar número en el sistema)",
  "documento.confirmDelete": "¿Eliminar {code}?",
  "pais.new": "Nuevo país",
  "pais.edit": "Editar país",
  "pais.error.required": "Indique nombre y sigla",
  "pais.isoSigla": "Sigla ISO",
  "pais.isoHint": "Dos letras, ej. BR",
  "pais.useDivisionSigla": "Usa sigla en la división",
  "pais.divisionSiglaUf": "Sí (UF)",
  "pais.divisionSiglaDept": "No (departamento)",
  "pais.divisionTypeUf": "UF (sigla)",
  "pais.divisionTypeDept": "Departamento",
  "pais.placeholderName": "Brasil",
  "divisao.new": "Nueva UF / departamento",
  "divisao.edit": "Editar UF / departamento",
  "divisao.error.required": "Indique país y nombre",
  "divisao.siglaHint": "Opcional. Ej. MS. Deje vacío para departamento.",
  "divisao.placeholderName": "Mato Grosso Do Sul",
  "cidade.new": "Nueva ciudad",
  "cidade.edit": "Editar ciudad",
  "cidade.error.required": "Indique división y nombre",
  "cidade.placeholderName": "Ponta Porã",
  "cidade.selectDivision": "Seleccione",
  "error.conflict.docUnique": "Ya existe una persona registrada con {tipo} {numero}",
  "error.conflict.possibleDuplicate": "Ya existe una persona con el mismo documento. Confirme si desea registrar otra persona.",
  "entity.cliente": "Cliente",
  "entity.fornecedor": "Proveedor",
  "empresa.title": "Empresa y sucursales",
  "empresa.section.company": "Datos de la empresa",
  "empresa.section.branches": "Sucursales",
  "empresa.razaoSocial": "Razón social",
  "empresa.nomeFantasia": "Nombre comercial",
  "empresa.ruc": "RUC",
  "empresa.representanteNome": "Representante",
  "empresa.representanteDocumento": "Documento del representante",
  "empresa.branchNew": "Nueva sucursal",
  "empresa.branchEdit": "Editar sucursal",
  "empresa.principal": "Principal",
  "empresa.timbrado": "Timbrado",
  "empresa.timbradoInicio": "Vigencia inicio",
  "empresa.timbradoFim": "Vigencia fin",
  "empresa.estabelecimento": "Nº establecimiento",
  "empresa.pontoExpedicao": "Punto expedición",
  "empresa.error.required": "Complete razón social, nombre comercial y RUC",
  "empresa.error.loadFailed": "No se pudo cargar empresa y sucursales",
  "empresa.error.saveFailed": "No se pudo guardar",
  "empresa.error.deleteFailed": "No se pudo eliminar la sucursal",
  "empresa.confirmDeleteBranch": "¿Eliminar esta sucursal?",
  "empresa.listClientsBranchOnly": "Listar solo clientes de esta sucursal",
  "empresa.listSuppliersBranchOnly": "Listar solo proveedores de esta sucursal",
  "empresa.branchParameters": "Parámetros de la sucursal",
  "empresa.section.parametersListagem": "Listado",
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { pt, es };

export function localeLabel(locale: Locale): string {
  return locale === "pt" ? "PT" : "ES";
}

/** Chaves de tradução para nomes de países no seletor de DDI. */
export function countryTranslationKey(iso: string): TranslationKey {
  return `country.${iso}` as TranslationKey;
}
