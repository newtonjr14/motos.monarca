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
  | "nav.produtos"
  | "nav.marcas"
  | "nav.modelos"
  | "nav.estoques"
  | "nav.cotacoes"
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
  | "common.loading"
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
  | "papel.addressType"
  | "papel.addressType.fiscal"
  | "papel.addressType.residencial"
  | "papel.addressType.entrega"
  | "papel.addressPrincipal"
  | "papel.addressAdd"
  | "papel.addressRemove"
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
  | "usuario.branches"
  | "usuario.error.branchesRequired"
  | "usuario.error.systemProtected"
  | "filial.selectTitle"
  | "filial.selectHint"
  | "filial.noAccess"
  | "filial.noAccessHint"
  | "filial.switch"
  | "filial.current"
  | "access.vendasSoon"
  | "access.vendasSoonHint"
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
  | "api.NAO_ENCONTRADO"
  | "api.ACESSO_NEGADO"
  | "api.NAO_AUTENTICADO"
  | "api.PERMISSAO_INSUFICIENTE"
  | "api.SEM_ACESSO_FILIAL"
  | "api.SYSTEM_PROTEGIDO"
  | "api.GESTOR_PERFIL"
  | "api.GESTOR_ALTERAR_SUPERIOR"
  | "api.SEM_PERMISSAO_USUARIOS"
  | "api.TOKEN_INVALIDO"
  | "api.USE_DELETE"
  | "api.CAMPO_OBRIGATORIO"
  | "api.VALOR_NEGATIVO"
  | "api.SENHA_OBRIGATORIA"
  | "api.LOGIN_SENHA_INVALIDOS"
  | "api.USUARIO_INATIVO"
  | "api.REFRESH_OBRIGATORIO"
  | "api.REFRESH_INVALIDO"
  | "api.REFRESH_EXPIRADO"
  | "api.SENHA_ATUAL_INCORRETA"
  | "api.LOGIN_INVALIDO"
  | "api.NOME_OBRIGATORIO"
  | "api.SENHA_MINIMA"
  | "api.USUARIO_LOGIN_DUPLICADO"
  | "api.USUARIO_EMAIL_DUPLICADO"
  | "api.FILIAIS_OBRIGATORIAS"
  | "api.LOGIN_MINIMO"
  | "api.LOGIN_RESERVADO"
  | "api.EMAIL_OBRIGATORIO"
  | "api.EMAIL_INVALIDO"
  | "api.FILIAL_PRINCIPAL_AUSENTE"
  | "api.FILIAL_NAO_ENCONTRADA"
  | "api.FILIAL_INATIVA"
  | "api.MARCA_NOME_DUPLICADO"
  | "api.MARCA_COM_MODELOS"
  | "api.MODELO_NOME_DUPLICADO"
  | "api.MODELO_TIPO_COM_PRODUTOS"
  | "api.MODELO_COM_PRODUTOS"
  | "api.PRODUTO_TIPO_IMUTAVEL"
  | "api.PRODUTO_CODIGO_DUPLICADO"
  | "api.PRODUTO_EM_ESTOQUE"
  | "api.PRODUTO_CODIGO_OBRIGATORIO"
  | "api.MODELO_MARCA_DIVERGENTE"
  | "api.MODELO_TIPO_DIVERGENTE"
  | "api.MOTO_DADOS_OBRIGATORIOS"
  | "api.ANO_MODELO_ANTERIOR"
  | "api.ANO_FORA_FAIXA"
  | "api.CHASSI_DUPLICADO"
  | "api.SERIE_QUADRO_DUPLICADA"
  | "api.ESTOQUE_NOME_DUPLICADO"
  | "api.ESTOQUE_COM_PRODUTOS"
  | "api.ESTOQUE_PRODUTO_DUPLICADO"
  | "api.ESTOQUE_NOME_OBRIGATORIO"
  | "api.COTACAO_DIA_AUSENTE"
  | "api.COTACAO_DIA_DUPLICADA"
  | "api.COTACAO_DATA_INVALIDA"
  | "api.COTACAO_DATA_FUTURA"
  | "api.COTACAO_TAXA_INVALIDA"
  | "api.IVA_ALIQUOTA_INVALIDA"
  | "api.QTD_NEGATIVA"
  | "api.QTD_RESERVADA_NEGATIVA"
  | "api.QTD_RESERVADA_MAIOR"
  | "api.EMPRESA_RUC_DUPLICADO"
  | "api.EMPRESA_COM_FILIAIS"
  | "api.FILIAL_PRINCIPAL_EXCLUIR"
  | "api.FILIAL_COM_CADASTROS"
  | "api.PAIS_SIGLA_DUPLICADA"
  | "api.PAIS_COM_CIDADES"
  | "api.DIVISAO_NOME_DUPLICADO"
  | "api.DIVISAO_COM_CIDADES"
  | "api.DIVISAO_SIGLA_TAMANHO"
  | "api.PAIS_SIGLA_ISO"
  | "api.CIDADE_NOME_DUPLICADO"
  | "api.DOCUMENTO_TIPO_CODIGO_DUPLICADO"
  | "api.DOCUMENTO_TIPO_EM_USO"
  | "api.DOCUMENTO_OBRIGATORIO"
  | "api.TELEFONE_PAR"
  | "api.DOCUMENTO_TIPO_XOR"
  | "api.DOCUMENTO_TIPO_OBRIGATORIO"
  | "api.DOCUMENTO_TIPO_PAIS"
  | "api.DOCUMENTO_TIPO_PESSOA"
  | "api.DOCUMENTO_NUMERO_OBRIGATORIO"
  | "api.DOCUMENTOS_REPETIDOS"
  | "api.ENDERECO_PRINCIPAL_UNICO"
  | "api.ENDERECO_PRINCIPAL_OBRIGATORIO"
  | "api.CPF_TAMANHO"
  | "api.CPF_INVALIDO"
  | "api.CNPJ_TAMANHO"
  | "api.CNPJ_INVALIDO"
  | "api.CNPJ_DV_NUMERICO"
  | "api.CI_TAMANHO"
  | "api.RUC_FORMATO"
  | "api.RUC_INVALIDO"
  | "api.RUC_BASE"
  | "api.RUC_DV"
  | "api.PAPEL_JA_VINCULADO"
  | "api.PESSOA_XOR"
  | "api.PESSOA_OBRIGATORIA"
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
  | "empresa.section.fiscal"
  | "empresa.perfilFiscal"
  | "empresa.perfilFiscal.py_iva"
  | "empresa.perfilFiscal.hint"
  | "empresa.error.required"
  | "empresa.error.loadFailed"
  | "empresa.error.saveFailed"
  | "empresa.error.deleteFailed"
  | "empresa.confirmDeleteBranch"
  | "empresa.listClientsBranchOnly"
  | "empresa.listSuppliersBranchOnly"
  | "empresa.listProductsBranchOnly"
  | "produto.new"
  | "produto.edit"
  | "produto.codigo"
  | "produto.codigoHint"
  | "produto.tipo"
  | "produto.tipo.moto"
  | "produto.tipo.bicicleta"
  | "produto.marca"
  | "produto.modelo"
  | "produto.descricao"
  | "produto.section.general"
  | "produto.section.price"
  | "produto.section.estoque"
  | "produto.section.moto"
  | "produto.section.bicicleta"
  | "produto.noStock"
  | "produto.chassi"
  | "produto.cor"
  | "produto.potencia"
  | "produto.autonomia"
  | "produto.velocidade"
  | "produto.bateria"
  | "produto.voltagem"
  | "produto.carga"
  | "produto.peso"
  | "produto.capacidadeCarga"
  | "produto.assentos"
  | "produto.aro"
  | "produto.quadro"
  | "produto.marchas"
  | "produto.freio"
  | "produto.error.required"
  | "produto.error.yearsRequired"
  | "produto.error.price"
  | "produto.iva"
  | "produto.ivaHint"
  | "produto.currency"
  | "produto.currency.usd"
  | "produto.currency.pyg"
  | "produto.currency.brl"
  | "produto.listPrice"
  | "produto.listPriceHint"
  | "produto.cost"
  | "produto.costHint"
  | "produto.confirmLinkBranch"
  | "produto.anoFabricacao"
  | "produto.anoModelo"
  | "produto.serieQuadro"
  | "produto.nomeHint"
  | "marca.new"
  | "marca.edit"
  | "marca.error.nameRequired"
  | "modelo.new"
  | "modelo.edit"
  | "modelo.error.required"
  | "estoque.new"
  | "estoque.edit"
  | "estoque.placeholderName"
  | "estoque.items"
  | "estoque.itemNew"
  | "estoque.itemEdit"
  | "estoque.product"
  | "estoque.qty"
  | "estoque.reserved"
  | "estoque.reservedHint"
  | "estoque.available"
  | "estoque.backList"
  | "estoque.backItems"
  | "estoque.error.nameRequired"
  | "estoque.error.productRequired"
  | "estoque.error.qtyInvalid"
  | "cotacao.new"
  | "cotacao.edit"
  | "cotacao.date"
  | "cotacao.dateHint"
  | "cotacao.usdPyg"
  | "cotacao.usdPygHint"
  | "cotacao.brlPyg"
  | "cotacao.brlPygHint"
  | "cotacao.error.required"
  | "cotacao.error.rate"
  | "cotacao.banner.missing"
  | "cotacao.banner.wait"
  | "cotacao.banner.save"
  | "cotacao.banner.rates"
  | "nav.finalizadores"
  | "nav.caixas"
  | "nav.caixa"
  | "nav.vendas"
  | "finalizador.new"
  | "finalizador.edit"
  | "finalizador.type"
  | "finalizador.tipo.dinheiro"
  | "finalizador.tipo.cartao"
  | "finalizador.tipo.deposito"
  | "finalizador.tipo.cheque"
  | "finalizador.tipo.outro"
  | "finalizador.error.nameRequired"
  | "caixa.new"
  | "caixa.edit"
  | "caixa.session"
  | "caixa.session.open"
  | "caixa.session.closed"
  | "caixa.open"
  | "caixa.close"
  | "caixa.transfer"
  | "caixa.movements"
  | "caixa.conferencia"
  | "caixa.note"
  | "caixa.destination"
  | "caixa.expected"
  | "caixa.user"
  | "caixa.amount"
  | "caixa.movementType"
  | "caixa.default"
  | "caixa.error.nameRequired"
  | "caixa.error.conferencia"
  | "caixa.error.destino"
  | "caixa.error.valor"
  | "caixa.error.noneClosed"
  | "caixa.mov.abertura"
  | "caixa.mov.fechamento"
  | "caixa.mov.venda"
  | "caixa.mov.transferencia_saida"
  | "caixa.mov.transferencia_entrada"
  | "venda.new"
  | "venda.view"
  | "venda.client"
  | "venda.till"
  | "venda.tillHint"
  | "venda.items"
  | "venda.product"
  | "venda.qty"
  | "venda.stock"
  | "venda.add"
  | "venda.total"
  | "venda.pay"
  | "venda.finalizer"
  | "venda.amount"
  | "venda.addPay"
  | "venda.finish"
  | "venda.seller"
  | "venda.error.product"
  | "venda.error.qty"
  | "venda.error.client"
  | "venda.error.items"
  | "venda.error.pay"
  | "venda.clientSearch"
  | "venda.clientSearchPlaceholder"
  | "venda.changeClient"
  | "venda.productSearch"
  | "venda.productSearchPlaceholder"
  | "venda.emptyCart"
  | "venda.subtotal"
  | "venda.paid"
  | "venda.remaining"
  | "venda.noTill"
  | "venda.unit"
  | "usuario.caixas"
  | "usuario.caixaPadrao"
  | "api.FINALIZADOR_NOME_DUPLICADO"
  | "api.FINALIZADOR_EM_USO"
  | "api.FINALIZADOR_NOME_OBRIGATORIO"
  | "api.CAIXA_NOME_DUPLICADO"
  | "api.CAIXA_SESSAO_ABERTA"
  | "api.CAIXA_COM_SESSOES"
  | "api.CAIXA_PADRAO_INVALIDO"
  | "api.CAIXA_INATIVO"
  | "api.CAIXA_SESSAO_FECHADA"
  | "api.CAIXA_CONFERENCIA_OBRIGATORIA"
  | "api.CAIXA_TRANSFERENCIA_MESMO"
  | "api.CAIXA_TRANSFERENCIA_FILIAL"
  | "api.CAIXA_DESTINO_FECHADO"
  | "api.CAIXA_VALOR_INVALIDO"
  | "api.CAIXA_SALDO_INSUFICIENTE"
  | "api.CAIXA_FILIAL_DIVERGENTE"
  | "api.CAIXA_NOME_OBRIGATORIO"
  | "api.CAIXAS_OBRIGATORIOS"
  | "api.CAIXA_ACESSO_AUSENTE"
  | "api.CAIXA_SESSAO_AUSENTE"
  | "api.SEM_ACESSO_CAIXA"
  | "api.CLIENTE_INATIVO"
  | "api.CLIENTE_FILIAL"
  | "api.VENDA_ITENS_OBRIGATORIOS"
  | "api.VENDA_QTD_INVALIDA"
  | "api.VENDA_PRECO_AUSENTE"
  | "api.VENDA_TOTAL_INVALIDO"
  | "api.VENDA_NEGOCIACAO_OBRIGATORIA"
  | "api.VENDA_VALOR_INVALIDO"
  | "api.VENDA_NEGOCIACAO_DIVERGENTE"
  | "api.ESTOQUE_INSUFICIENTE"
  | "api.ESTOQUE_FILIAL"
  | "api.ESTOQUE_PRODUTO_AUSENTE"
  | "api.PRODUTO_INATIVO"
  | "empresa.branchParameters"
  | "empresa.section.parametersListagem"
  | "empresa.seed.title"
  | "empresa.seed.hint"
  | "empresa.seed.statusOn"
  | "empresa.seed.statusOff"
  | "empresa.seed.apply"
  | "empresa.seed.remove"
  | "empresa.seed.confirmRemove"
  | "empresa.seed.error";

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
  "nav.produtos": "Produtos",
  "nav.marcas": "Marcas",
  "nav.modelos": "Modelos",
  "nav.estoques": "Estoques",
  "nav.cotacoes": "Cotações",
  "nav.finalizadores": "Finalizadores",
  "nav.caixas": "Caixas",
  "nav.caixa": "Caixa do dia",
  "nav.vendas": "Vendas",
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
  "common.loading": "Carregando...",
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
  "papel.addressType": "Tipo de endereço",
  "papel.addressType.fiscal": "Fiscal",
  "papel.addressType.residencial": "Residencial",
  "papel.addressType.entrega": "Entrega",
  "papel.addressPrincipal": "Principal",
  "papel.addressAdd": "Adicionar endereço",
  "papel.addressRemove": "Remover",
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
  "dashboard.stat.estoqueSub": "Produtos e depósitos da filial",
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
  "usuario.branches": "Filiais",
  "usuario.error.branchesRequired": "Selecione ao menos uma filial",
  "usuario.error.systemProtected": "O usuário SYSTEM não pode ser alterado ou excluído",
  "filial.selectTitle": "Escolha a filial",
  "filial.selectHint": "Seu usuário tem acesso a mais de uma filial",
  "filial.noAccess": "Sem filial",
  "filial.noAccessHint": "Peça a um administrador para vincular seu usuário a uma filial",
  "filial.switch": "Trocar filial",
  "filial.current": "Filial atual",
  "access.vendasSoon": "Vendas em breve",
  "access.vendasSoonHint": "Este perfil acessa somente vendas. O módulo ainda não está disponível.",
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
  "api.NAO_ENCONTRADO": "Registro não encontrado",
  "api.ACESSO_NEGADO": "Acesso negado",
  "api.NAO_AUTENTICADO": "Não autenticado",
  "api.PERMISSAO_INSUFICIENTE": "Permissão insuficiente",
  "api.SEM_ACESSO_FILIAL": "Sem acesso a esta filial",
  "api.SYSTEM_PROTEGIDO": "O usuário SYSTEM não pode ser alterado ou excluído",
  "api.GESTOR_PERFIL": "Gestor não pode atribuir perfil Administrador ou Gestor",
  "api.GESTOR_ALTERAR_SUPERIOR": "Gestor não pode alterar usuários Administrador ou Gestor",
  "api.SEM_PERMISSAO_USUARIOS": "Sem permissão para gerenciar usuários",
  "api.TOKEN_INVALIDO": "Sessão expirada. Entre novamente",
  "api.USE_DELETE": "Use a exclusão para marcar como deletado",
  "api.CAMPO_OBRIGATORIO": "Preencha os campos obrigatórios",
  "api.VALOR_NEGATIVO": "O valor não pode ser negativo",
  "api.SENHA_OBRIGATORIA": "A senha é obrigatória",
  "api.LOGIN_SENHA_INVALIDOS": "Login ou senha inválidos",
  "api.USUARIO_INATIVO": "Usuário inativo",
  "api.REFRESH_OBRIGATORIO": "O token de renovação é obrigatório",
  "api.REFRESH_INVALIDO": "Token de renovação inválido",
  "api.REFRESH_EXPIRADO": "Token de renovação expirado",
  "api.SENHA_ATUAL_INCORRETA": "Senha atual incorreta",
  "api.LOGIN_INVALIDO": "Login inválido",
  "api.NOME_OBRIGATORIO": "O nome é obrigatório",
  "api.SENHA_MINIMA": "A senha deve ter pelo menos 8 caracteres",
  "api.USUARIO_LOGIN_DUPLICADO": "Já existe um usuário com o login {login}",
  "api.USUARIO_EMAIL_DUPLICADO": "Já existe um usuário com o e-mail {email}",
  "api.FILIAIS_OBRIGATORIAS": "Selecione ao menos uma filial",
  "api.LOGIN_MINIMO": "O login deve ter pelo menos 3 caracteres",
  "api.LOGIN_RESERVADO": "Este login é reservado",
  "api.EMAIL_OBRIGATORIO": "O e-mail é obrigatório",
  "api.EMAIL_INVALIDO": "E-mail inválido",
  "api.FILIAL_PRINCIPAL_AUSENTE": "Filial principal não configurada",
  "api.FILIAL_NAO_ENCONTRADA": "Filial não encontrada",
  "api.FILIAL_INATIVA": "A filial não está ativa",
  "api.MARCA_NOME_DUPLICADO": "Já existe uma marca com o nome {nome}",
  "api.MARCA_COM_MODELOS": "Não é possível excluir uma marca que possui modelos",
  "api.MODELO_NOME_DUPLICADO": "Já existe um modelo com o nome {nome} nesta marca",
  "api.MODELO_TIPO_COM_PRODUTOS": "Não é possível alterar o tipo de um modelo que possui produtos",
  "api.MODELO_COM_PRODUTOS": "Não é possível excluir um modelo que possui produtos",
  "api.PRODUTO_TIPO_IMUTAVEL": "Não é possível alterar o tipo do produto",
  "api.PRODUTO_CODIGO_DUPLICADO": "Já existe um produto com o código {codigo}",
  "api.PRODUTO_EM_ESTOQUE": "Não é possível excluir um produto lançado em estoque",
  "api.PRODUTO_CODIGO_OBRIGATORIO": "O código do produto é obrigatório",
  "api.MODELO_MARCA_DIVERGENTE": "O modelo não pertence à marca selecionada",
  "api.MODELO_TIPO_DIVERGENTE": "O modelo não corresponde ao tipo selecionado",
  "api.MOTO_DADOS_OBRIGATORIOS": "Informe os dados da moto",
  "api.ANO_MODELO_ANTERIOR": "O ano modelo não pode ser anterior ao ano de fabricação",
  "api.ANO_FORA_FAIXA": "O ano deve estar entre {min} e {max}",
  "api.CHASSI_DUPLICADO": "Já existe uma moto com o chassi {chassi}",
  "api.SERIE_QUADRO_DUPLICADA": "Já existe uma bicicleta com o número de série {serie}",
  "api.ESTOQUE_NOME_DUPLICADO": "Já existe um estoque com o nome {nome} nesta filial",
  "api.ESTOQUE_COM_PRODUTOS": "Não é possível excluir um estoque que possui produtos",
  "api.ESTOQUE_PRODUTO_DUPLICADO": "Este produto já está neste estoque",
  "api.ESTOQUE_NOME_OBRIGATORIO": "O nome do estoque é obrigatório",
  "api.COTACAO_DIA_AUSENTE": "Informe a cotação do dia para vender, receber, pagar ou emitir factura",
  "api.COTACAO_DIA_DUPLICADA": "Já existe cotação para {data}",
  "api.COTACAO_DATA_INVALIDA": "Data inválida. Use AAAA-MM-DD",
  "api.COTACAO_DATA_FUTURA": "Não é possível informar cotação de data futura",
  "api.COTACAO_TAXA_INVALIDA": "A taxa deve ser maior que zero",
  "api.FINALIZADOR_NOME_DUPLICADO": "Já existe um finalizador com o nome {nome}",
  "api.FINALIZADOR_EM_USO": "Não é possível excluir um finalizador em uso",
  "api.FINALIZADOR_NOME_OBRIGATORIO": "O nome do finalizador é obrigatório",
  "api.CAIXA_NOME_DUPLICADO": "Já existe um caixa com o nome {nome} nesta filial",
  "api.CAIXA_SESSAO_ABERTA": "Este caixa já possui sessão aberta",
  "api.CAIXA_COM_SESSOES": "Não é possível excluir um caixa que já teve movimento",
  "api.CAIXA_PADRAO_INVALIDO": "O caixa padrão precisa estar entre os selecionados",
  "api.CAIXA_INATIVO": "O caixa não está ativo",
  "api.CAIXA_SESSAO_FECHADA": "A sessão do caixa está fechada",
  "api.CAIXA_CONFERENCIA_OBRIGATORIA": "Informe a conferência de fechamento",
  "api.CAIXA_TRANSFERENCIA_MESMO": "Origem e destino precisam ser caixas diferentes",
  "api.CAIXA_TRANSFERENCIA_FILIAL": "A transferência precisa ser na mesma filial",
  "api.CAIXA_DESTINO_FECHADO": "Abra o caixa de destino antes de transferir",
  "api.CAIXA_VALOR_INVALIDO": "O valor não pode ser negativo",
  "api.CAIXA_SALDO_INSUFICIENTE": "Saldo insuficiente para transferir",
  "api.CAIXA_FILIAL_DIVERGENTE": "O caixa não pertence a esta filial",
  "api.CAIXA_NOME_OBRIGATORIO": "O nome do caixa é obrigatório",
  "api.CAIXAS_OBRIGATORIOS": "Selecione ao menos um caixa",
  "api.CAIXA_ACESSO_AUSENTE": "O usuário não tem caixa nesta filial",
  "api.CAIXA_SESSAO_AUSENTE": "Abra o caixa antes de vender",
  "api.SEM_ACESSO_CAIXA": "Sem acesso a este caixa",
  "api.CLIENTE_INATIVO": "O cliente não está ativo",
  "api.CLIENTE_FILIAL": "O cliente não pertence a esta filial",
  "api.VENDA_ITENS_OBRIGATORIOS": "Informe ao menos um item",
  "api.VENDA_QTD_INVALIDA": "A quantidade deve ser maior que zero",
  "api.VENDA_PRECO_AUSENTE": "Informe o preço de lista do produto",
  "api.VENDA_TOTAL_INVALIDO": "O total da venda deve ser maior que zero",
  "api.VENDA_NEGOCIACAO_OBRIGATORIA": "Informe ao menos uma forma de pagamento",
  "api.VENDA_VALOR_INVALIDO": "O valor do pagamento deve ser maior que zero",
  "api.VENDA_NEGOCIACAO_DIVERGENTE": "A soma das formas de pagamento deve igualar o total",
  "api.ESTOQUE_INSUFICIENTE": "Saldo insuficiente para vender",
  "api.ESTOQUE_FILIAL": "O estoque não pertence a esta filial",
  "api.ESTOQUE_PRODUTO_AUSENTE": "Produto sem saldo neste estoque",
  "api.PRODUTO_INATIVO": "O produto não está ativo",
  "api.IVA_ALIQUOTA_INVALIDA": "A alíquota de IVA deve ser 0, 5 ou 10",
  "api.QTD_NEGATIVA": "A quantidade não pode ser negativa",
  "api.QTD_RESERVADA_NEGATIVA": "A quantidade reservada não pode ser negativa",
  "api.QTD_RESERVADA_MAIOR": "A quantidade reservada não pode ser maior que a quantidade",
  "api.EMPRESA_RUC_DUPLICADO": "Já existe uma empresa com o RUC {ruc}",
  "api.EMPRESA_COM_FILIAIS": "Não é possível excluir uma empresa que possui filiais",
  "api.FILIAL_PRINCIPAL_EXCLUIR": "Não é possível excluir a filial principal",
  "api.FILIAL_COM_CADASTROS": "Não é possível excluir uma filial vinculada a cadastros",
  "api.PAIS_SIGLA_DUPLICADA": "Já existe um país com a sigla {sigla}",
  "api.PAIS_COM_CIDADES": "Não é possível excluir um país que possui cidades",
  "api.DIVISAO_NOME_DUPLICADO": "Já existe uma divisão “{nome}” neste país",
  "api.DIVISAO_COM_CIDADES": "Não é possível excluir uma divisão que possui cidades",
  "api.DIVISAO_SIGLA_TAMANHO": "A sigla da divisão deve ter até 10 caracteres",
  "api.PAIS_SIGLA_ISO": "A sigla do país deve ter 2 letras (ISO)",
  "api.CIDADE_NOME_DUPLICADO": "Já existe uma cidade “{nome}” nesta divisão",
  "api.DOCUMENTO_TIPO_CODIGO_DUPLICADO": "Já existe um tipo com o código {codigo} neste país",
  "api.DOCUMENTO_TIPO_EM_USO": "Tipo em uso por pessoas cadastradas e não pode ser excluído",
  "api.DOCUMENTO_OBRIGATORIO": "Informe pelo menos um documento",
  "api.TELEFONE_PAR": "Informe DDI e telefone juntos, ou deixe ambos vazios",
  "api.DOCUMENTO_TIPO_XOR": "Informe o tipo de catálogo ou o tipo livre, não os dois",
  "api.DOCUMENTO_TIPO_OBRIGATORIO": "Informe o tipo de documento",
  "api.DOCUMENTO_TIPO_PAIS": "O tipo {codigo} não pertence a este país",
  "api.DOCUMENTO_TIPO_PESSOA": "{nome} não corresponde a esta classe de pessoa",
  "api.DOCUMENTO_NUMERO_OBRIGATORIO": "O número do documento é obrigatório",
  "api.DOCUMENTOS_REPETIDOS": "Há documentos repetidos na requisição",
  "api.ENDERECO_PRINCIPAL_UNICO": "Só pode existir um endereço principal ativo por pessoa",
  "api.ENDERECO_PRINCIPAL_OBRIGATORIO": "Informe um endereço principal",
  "api.CPF_TAMANHO": "O CPF deve ter 11 dígitos",
  "api.CPF_INVALIDO": "CPF inválido",
  "api.CNPJ_TAMANHO": "O CNPJ deve ter 14 caracteres",
  "api.CNPJ_INVALIDO": "CNPJ inválido",
  "api.CNPJ_DV_NUMERICO": "CNPJ inválido: os dois últimos caracteres devem ser numéricos",
  "api.CI_TAMANHO": "A cédula (CI) deve ter entre 6 e 10 dígitos",
  "api.RUC_FORMATO": "RUC inválido: use o formato 1234567-8",
  "api.RUC_INVALIDO": "RUC inválido",
  "api.RUC_BASE": "RUC inválido: a base deve ter 3 a 8 dígitos",
  "api.RUC_DV": "RUC inválido: dígito verificador incorreto",
  "api.PAPEL_JA_VINCULADO": "Esta pessoa já está vinculada a esta filial neste papel",
  "api.PESSOA_XOR": "Informe a pessoa ou o identificador, não os dois",
  "api.PESSOA_OBRIGATORIA": "Informe a pessoa",
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
  "empresa.section.fiscal": "Fiscal",
  "empresa.perfilFiscal": "Perfil fiscal",
  "empresa.perfilFiscal.py_iva": "IVA Paraguai",
  "empresa.perfilFiscal.hint": "Define o motor da factura desta sucursal. Hoje só IVA paraguaio (0 / 5 / 10 %).",
  "empresa.error.required": "Preencha razão social, nome fantasia e RUC",
  "empresa.error.loadFailed": "Não foi possível carregar empresa e filiais",
  "empresa.error.saveFailed": "Não foi possível salvar",
  "empresa.error.deleteFailed": "Não foi possível excluir a filial",
  "empresa.confirmDeleteBranch": "Excluir esta filial?",
  "empresa.listClientsBranchOnly": "Listar só clientes desta filial",
  "empresa.listSuppliersBranchOnly": "Listar só fornecedores desta filial",
  "empresa.listProductsBranchOnly": "Listar só produtos desta filial",
  "produto.new": "Novo produto",
  "produto.edit": "Editar produto",
  "produto.codigo": "Código (SKU)",
  "produto.codigoHint": "Código interno editável. O ID do sistema é gerado à parte.",
  "produto.tipo": "Tipo",
  "produto.tipo.moto": "Moto elétrica",
  "produto.tipo.bicicleta": "Bicicleta elétrica",
  "produto.marca": "Marca",
  "produto.modelo": "Modelo",
  "produto.descricao": "Descrição",
  "produto.section.general": "Dados do produto",
  "produto.section.price": "Preço e IVA",
  "produto.section.estoque": "Estoque nesta filial",
  "produto.section.moto": "Ficha da moto",
  "produto.section.bicicleta": "Ficha da bicicleta",
  "produto.noStock": "Sem saldo nesta filial",
  "produto.chassi": "Chassi",
  "produto.cor": "Cor",
  "produto.potencia": "Potência (W)",
  "produto.autonomia": "Autonomia (km)",
  "produto.velocidade": "Velocidade máx. (km/h)",
  "produto.bateria": "Bateria (Ah)",
  "produto.voltagem": "Voltagem (V)",
  "produto.carga": "Tempo de carga (h)",
  "produto.peso": "Peso (kg)",
  "produto.capacidadeCarga": "Carga (kg)",
  "produto.assentos": "Assentos",
  "produto.aro": "Aro",
  "produto.quadro": "Tipo de quadro",
  "produto.marchas": "Marchas",
  "produto.freio": "Freio",
  "produto.error.required": "Informe código, marca e modelo",
  "produto.error.yearsRequired": "Informe ano de fabricação e ano modelo válidos",
  "produto.error.price": "Informe preço de lista e custo válidos (zero ou mais)",
  "produto.iva": "IVA",
  "produto.ivaHint": "Preço de gôndola com IVA incluído. 0, 5 ou 10%.",
  "produto.currency": "Moeda",
  "produto.currency.usd": "Dólar (USD)",
  "produto.currency.pyg": "Guarani (PYG)",
  "produto.currency.brl": "Real (BRL)",
  "produto.listPrice": "Preço de lista",
  "produto.listPriceHint": "Preço de gôndola com IVA incluído, na moeda escolhida.",
  "produto.cost": "Custo",
  "produto.costHint": "Custo na mesma moeda do preço de lista.",
  "produto.confirmLinkBranch": "O produto {codigo} já existe em {filiais}. Vincular a esta filial?",
  "produto.anoFabricacao": "Ano de fabricação",
  "produto.anoModelo": "Ano modelo",
  "produto.serieQuadro": "Nº de série do quadro",
  "produto.nomeHint": "Montado automaticamente com marca e modelo",
  "marca.new": "Nova marca",
  "marca.edit": "Editar marca",
  "marca.error.nameRequired": "Informe o nome da marca",
  "modelo.new": "Novo modelo",
  "modelo.edit": "Editar modelo",
  "modelo.error.required": "Informe marca e nome do modelo",
  "estoque.new": "Novo estoque",
  "estoque.edit": "Editar estoque",
  "estoque.placeholderName": "Estoque Geral",
  "estoque.items": "Itens",
  "estoque.itemNew": "Adicionar produto",
  "estoque.itemEdit": "Editar quantidade",
  "estoque.product": "Produto",
  "estoque.qty": "Quantidade",
  "estoque.reserved": "Reservada",
  "estoque.reservedHint": "Para venda em aberto. Disponível = quantidade − reservada.",
  "estoque.available": "Disponível",
  "estoque.backList": "Voltar para estoques",
  "estoque.backItems": "Voltar para os itens",
  "estoque.error.nameRequired": "Informe o nome do estoque",
  "estoque.error.productRequired": "Selecione o produto",
  "estoque.error.qtyInvalid": "Quantidade e reserva devem ser inteiros ≥ 0, e a reserva não pode ser maior que a quantidade",
  "cotacao.new": "Nova cotação",
  "cotacao.edit": "Editar cotação",
  "cotacao.date": "Data",
  "cotacao.dateHint": "Fuso America/Asunción. Não é possível informar data futura.",
  "cotacao.usdPyg": "USD → PYG",
  "cotacao.usdPygHint": "Quantos guaranis equivalem a 1 dólar hoje.",
  "cotacao.brlPyg": "BRL → PYG",
  "cotacao.brlPygHint": "Quantos guaranis equivalem a 1 real hoje.",
  "cotacao.error.required": "Informe a data da cotação",
  "cotacao.error.rate": "Informe as duas taxas, maiores que zero",
  "cotacao.banner.missing": "Sem cotação do dia. Vendas, recebimentos, pagamentos e facturas eletrônicas ficam bloqueados.",
  "cotacao.banner.wait": "Sem cotação do dia. Aguarde um administrador ou gestor informar as taxas para liberar vendas e facturas.",
  "cotacao.banner.save": "Informar",
  "cotacao.banner.rates": "Cotação do dia",
  "finalizador.new": "Novo finalizador",
  "finalizador.edit": "Editar finalizador",
  "finalizador.type": "Tipo",
  "finalizador.tipo.dinheiro": "Dinheiro",
  "finalizador.tipo.cartao": "Cartão",
  "finalizador.tipo.deposito": "Depósito",
  "finalizador.tipo.cheque": "Cheque",
  "finalizador.tipo.outro": "Outro",
  "finalizador.error.nameRequired": "Informe o nome do finalizador",
  "caixa.new": "Novo caixa",
  "caixa.edit": "Editar caixa",
  "caixa.session": "Sessão",
  "caixa.session.open": "Aberto",
  "caixa.session.closed": "Fechado",
  "caixa.open": "Abrir caixa",
  "caixa.close": "Fechar caixa",
  "caixa.transfer": "Transferir",
  "caixa.movements": "Movimentos",
  "caixa.conferencia": "Conferência",
  "caixa.note": "Observação",
  "caixa.destination": "Caixa de destino",
  "caixa.expected": "Saldo esperado",
  "caixa.user": "Usuário",
  "caixa.amount": "Valor",
  "caixa.movementType": "Tipo",
  "caixa.default": "Padrão",
  "caixa.error.nameRequired": "Informe o nome do caixa",
  "caixa.error.conferencia": "Informe a conferência de fechamento",
  "caixa.error.destino": "Selecione o caixa de destino",
  "caixa.error.valor": "Informe ao menos um valor",
  "caixa.error.noneClosed": "Não há caixa fechado para abrir",
  "caixa.mov.abertura": "Abertura",
  "caixa.mov.fechamento": "Fechamento",
  "caixa.mov.venda": "Venda",
  "caixa.mov.transferencia_saida": "Transferência (saída)",
  "caixa.mov.transferencia_entrada": "Transferência (entrada)",
  "venda.new": "Nova venda",
  "venda.view": "Venda",
  "venda.client": "Cliente",
  "venda.till": "Caixa",
  "venda.tillHint": "Precisa estar aberto na filial atual",
  "venda.items": "Itens",
  "venda.product": "Produto",
  "venda.qty": "Qtd.",
  "venda.stock": "estoque",
  "venda.add": "Adicionar",
  "venda.total": "Total",
  "venda.pay": "Pagamento",
  "venda.finalizer": "Forma",
  "venda.amount": "Valor (Gs.)",
  "venda.addPay": "+ outra forma",
  "venda.finish": "Finalizar venda",
  "venda.seller": "Vendedor",
  "venda.error.product": "Selecione um produto",
  "venda.error.qty": "Informe uma quantidade válida",
  "venda.error.client": "Selecione o cliente",
  "venda.error.items": "Adicione ao menos um item",
  "venda.error.pay": "Informe o pagamento",
  "venda.clientSearch": "Buscar cliente",
  "venda.clientSearchPlaceholder": "Nome ou documento",
  "venda.changeClient": "Trocar",
  "venda.productSearch": "Produto / SKU",
  "venda.productSearchPlaceholder": "Código, SKU ou nome — Enter lança",
  "venda.emptyCart": "Nenhum item. Busque e pressione Enter.",
  "venda.subtotal": "Subtotal",
  "venda.paid": "Pago",
  "venda.remaining": "Falta",
  "venda.noTill": "Nenhum caixa aberto nesta filial",
  "venda.unit": "Unit.",
  "usuario.caixas": "Caixas",
  "usuario.caixaPadrao": "Caixa padrão",
  "empresa.branchParameters": "Parâmetros da filial",
  "empresa.section.parametersListagem": "Listagem",
  "empresa.seed.title": "Dados de teste",
  "empresa.seed.hint": "Cria clientes, produtos com estoque, um caixa extra, um finalizador e três vendas na filial principal. Dá para ligar e desligar quando quiser. Não apaga o Caixa 1 nem Dinheiro, Cartão e Depósito.",
  "empresa.seed.statusOn": "Dados de teste ativos",
  "empresa.seed.statusOff": "Dados de teste desligados",
  "empresa.seed.apply": "Ligar dados de teste",
  "empresa.seed.remove": "Desligar e remover",
  "empresa.seed.confirmRemove": "Remover clientes, produtos, caixas e vendas de teste? O que você cadastrou fora do seed permanece.",
  "empresa.seed.error": "Não foi possível atualizar os dados de teste",
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
  "nav.produtos": "Productos",
  "nav.marcas": "Marcas",
  "nav.modelos": "Modelos",
  "nav.estoques": "Depósitos",
  "nav.cotacoes": "Cotizaciones",
  "nav.finalizadores": "Finalizadores",
  "nav.caixas": "Cajas",
  "nav.caixa": "Caja del día",
  "nav.vendas": "Ventas",
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
  "common.loading": "Cargando...",
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
  "papel.addressType": "Tipo de dirección",
  "papel.addressType.fiscal": "Fiscal",
  "papel.addressType.residencial": "Residencial",
  "papel.addressType.entrega": "Entrega",
  "papel.addressPrincipal": "Principal",
  "papel.addressAdd": "Agregar dirección",
  "papel.addressRemove": "Quitar",
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
  "dashboard.stat.estoqueSub": "Productos y depósitos de la sucursal",
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
  "usuario.branches": "Sucursales",
  "usuario.error.branchesRequired": "Seleccione al menos una sucursal",
  "usuario.error.systemProtected": "El usuario SYSTEM no puede modificarse ni eliminarse",
  "filial.selectTitle": "Elija la sucursal",
  "filial.selectHint": "Su usuario tiene acceso a más de una sucursal",
  "filial.noAccess": "Sin sucursal",
  "filial.noAccessHint": "Pida a un administrador que vincule su usuario a una sucursal",
  "filial.switch": "Cambiar sucursal",
  "filial.current": "Sucursal actual",
  "access.vendasSoon": "Ventas pronto",
  "access.vendasSoonHint": "Este perfil solo accede a ventas. El módulo aún no está disponible.",
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
  "api.NAO_ENCONTRADO": "Registro no encontrado",
  "api.ACESSO_NEGADO": "Acceso denegado",
  "api.NAO_AUTENTICADO": "No autenticado",
  "api.PERMISSAO_INSUFICIENTE": "Permiso insuficiente",
  "api.SEM_ACESSO_FILIAL": "Sin acceso a esta sucursal",
  "api.SYSTEM_PROTEGIDO": "El usuario SYSTEM no puede modificarse ni eliminarse",
  "api.GESTOR_PERFIL": "El gestor no puede asignar perfil Administrador o Gestor",
  "api.GESTOR_ALTERAR_SUPERIOR": "El gestor no puede modificar usuarios Administrador o Gestor",
  "api.SEM_PERMISSAO_USUARIOS": "Sin permiso para gestionar usuarios",
  "api.TOKEN_INVALIDO": "Sesión expirada. Ingrese de nuevo",
  "api.USE_DELETE": "Use la eliminación para marcar como eliminado",
  "api.CAMPO_OBRIGATORIO": "Complete los campos obligatorios",
  "api.VALOR_NEGATIVO": "El valor no puede ser negativo",
  "api.SENHA_OBRIGATORIA": "La contraseña es obligatoria",
  "api.LOGIN_SENHA_INVALIDOS": "Usuario o contraseña inválidos",
  "api.USUARIO_INATIVO": "Usuario inactivo",
  "api.REFRESH_OBRIGATORIO": "El token de renovación es obligatorio",
  "api.REFRESH_INVALIDO": "Token de renovación inválido",
  "api.REFRESH_EXPIRADO": "Token de renovación expirado",
  "api.SENHA_ATUAL_INCORRETA": "La contraseña actual es incorrecta",
  "api.LOGIN_INVALIDO": "Usuario inválido",
  "api.NOME_OBRIGATORIO": "El nombre es obligatorio",
  "api.SENHA_MINIMA": "La contraseña debe tener al menos 8 caracteres",
  "api.USUARIO_LOGIN_DUPLICADO": "Ya existe un usuario con el login {login}",
  "api.USUARIO_EMAIL_DUPLICADO": "Ya existe un usuario con el correo {email}",
  "api.FILIAIS_OBRIGATORIAS": "Seleccione al menos una sucursal",
  "api.LOGIN_MINIMO": "El usuario debe tener al menos 3 caracteres",
  "api.LOGIN_RESERVADO": "Este usuario está reservado",
  "api.EMAIL_OBRIGATORIO": "El correo es obligatorio",
  "api.EMAIL_INVALIDO": "Correo inválido",
  "api.FILIAL_PRINCIPAL_AUSENTE": "Sucursal principal no configurada",
  "api.FILIAL_NAO_ENCONTRADA": "Sucursal no encontrada",
  "api.FILIAL_INATIVA": "La sucursal no está activa",
  "api.MARCA_NOME_DUPLICADO": "Ya existe una marca con el nombre {nome}",
  "api.MARCA_COM_MODELOS": "No se puede eliminar una marca que tiene modelos",
  "api.MODELO_NOME_DUPLICADO": "Ya existe un modelo con el nombre {nome} en esta marca",
  "api.MODELO_TIPO_COM_PRODUTOS": "No se puede cambiar el tipo de un modelo que tiene productos",
  "api.MODELO_COM_PRODUTOS": "No se puede eliminar un modelo que tiene productos",
  "api.PRODUTO_TIPO_IMUTAVEL": "No se puede cambiar el tipo del producto",
  "api.PRODUTO_CODIGO_DUPLICADO": "Ya existe un producto con el código {codigo}",
  "api.PRODUTO_EM_ESTOQUE": "No se puede eliminar un producto con movimiento de stock",
  "api.PRODUTO_CODIGO_OBRIGATORIO": "El código del producto es obligatorio",
  "api.MODELO_MARCA_DIVERGENTE": "El modelo no pertenece a la marca seleccionada",
  "api.MODELO_TIPO_DIVERGENTE": "El modelo no corresponde al tipo seleccionado",
  "api.MOTO_DADOS_OBRIGATORIOS": "Indique los datos de la moto",
  "api.ANO_MODELO_ANTERIOR": "El año modelo no puede ser anterior al año de fabricación",
  "api.ANO_FORA_FAIXA": "El año debe estar entre {min} y {max}",
  "api.CHASSI_DUPLICADO": "Ya existe una moto con el chasis {chassi}",
  "api.SERIE_QUADRO_DUPLICADA": "Ya existe una bicicleta con el número de serie {serie}",
  "api.ESTOQUE_NOME_DUPLICADO": "Ya existe un depósito con el nombre {nome} en esta sucursal",
  "api.ESTOQUE_COM_PRODUTOS": "No se puede eliminar un depósito que tiene productos",
  "api.ESTOQUE_PRODUTO_DUPLICADO": "Este producto ya está en este depósito",
  "api.ESTOQUE_NOME_OBRIGATORIO": "El nombre del depósito es obligatorio",
  "api.COTACAO_DIA_AUSENTE": "Indique la cotización del día para vender, cobrar, pagar o emitir factura",
  "api.COTACAO_DIA_DUPLICADA": "Ya existe cotización para {data}",
  "api.COTACAO_DATA_INVALIDA": "Fecha inválida. Use AAAA-MM-DD",
  "api.COTACAO_DATA_FUTURA": "No es posible informar cotización de fecha futura",
  "api.COTACAO_TAXA_INVALIDA": "La tasa debe ser mayor que cero",
  "api.FINALIZADOR_NOME_DUPLICADO": "Ya existe un finalizador con el nombre {nome}",
  "api.FINALIZADOR_EM_USO": "No es posible eliminar un finalizador en uso",
  "api.FINALIZADOR_NOME_OBRIGATORIO": "El nombre del finalizador es obligatorio",
  "api.CAIXA_NOME_DUPLICADO": "Ya existe una caja con el nombre {nome} en esta sucursal",
  "api.CAIXA_SESSAO_ABERTA": "Esta caja ya tiene sesión abierta",
  "api.CAIXA_COM_SESSOES": "No es posible eliminar una caja que ya tuvo movimiento",
  "api.CAIXA_PADRAO_INVALIDO": "La caja predeterminada debe estar entre las seleccionadas",
  "api.CAIXA_INATIVO": "La caja no está activa",
  "api.CAIXA_SESSAO_FECHADA": "La sesión de la caja está cerrada",
  "api.CAIXA_CONFERENCIA_OBRIGATORIA": "Indique el conteo de cierre",
  "api.CAIXA_TRANSFERENCIA_MESMO": "Origen y destino deben ser cajas distintas",
  "api.CAIXA_TRANSFERENCIA_FILIAL": "La transferencia debe ser en la misma sucursal",
  "api.CAIXA_DESTINO_FECHADO": "Abra la caja de destino antes de transferir",
  "api.CAIXA_VALOR_INVALIDO": "El valor no puede ser negativo",
  "api.CAIXA_SALDO_INSUFICIENTE": "Saldo insuficiente para transferir",
  "api.CAIXA_FILIAL_DIVERGENTE": "La caja no pertenece a esta sucursal",
  "api.CAIXA_NOME_OBRIGATORIO": "El nombre de la caja es obligatorio",
  "api.CAIXAS_OBRIGATORIOS": "Seleccione al menos una caja",
  "api.CAIXA_ACESSO_AUSENTE": "El usuario no tiene caja en esta sucursal",
  "api.CAIXA_SESSAO_AUSENTE": "Abra la caja antes de vender",
  "api.SEM_ACESSO_CAIXA": "Sin acceso a esta caja",
  "api.CLIENTE_INATIVO": "El cliente no está activo",
  "api.CLIENTE_FILIAL": "El cliente no pertenece a esta sucursal",
  "api.VENDA_ITENS_OBRIGATORIOS": "Indique al menos un ítem",
  "api.VENDA_QTD_INVALIDA": "La cantidad debe ser mayor que cero",
  "api.VENDA_PRECO_AUSENTE": "Indique el precio de lista del producto",
  "api.VENDA_TOTAL_INVALIDO": "El total de la venta debe ser mayor que cero",
  "api.VENDA_NEGOCIACAO_OBRIGATORIA": "Indique al menos una forma de pago",
  "api.VENDA_VALOR_INVALIDO": "El valor del pago debe ser mayor que cero",
  "api.VENDA_NEGOCIACAO_DIVERGENTE": "La suma de las formas de pago debe igualar el total",
  "api.ESTOQUE_INSUFICIENTE": "Saldo insuficiente para vender",
  "api.ESTOQUE_FILIAL": "El depósito no pertenece a esta sucursal",
  "api.ESTOQUE_PRODUTO_AUSENTE": "Producto sin saldo en este depósito",
  "api.PRODUTO_INATIVO": "El producto no está activo",
  "api.IVA_ALIQUOTA_INVALIDA": "La alícuota de IVA debe ser 0, 5 o 10",
  "api.QTD_NEGATIVA": "La cantidad no puede ser negativa",
  "api.QTD_RESERVADA_NEGATIVA": "La cantidad reservada no puede ser negativa",
  "api.QTD_RESERVADA_MAIOR": "La cantidad reservada no puede ser mayor que la cantidad",
  "api.EMPRESA_RUC_DUPLICADO": "Ya existe una empresa con el RUC {ruc}",
  "api.EMPRESA_COM_FILIAIS": "No se puede eliminar una empresa que tiene sucursales",
  "api.FILIAL_PRINCIPAL_EXCLUIR": "No se puede eliminar la sucursal principal",
  "api.FILIAL_COM_CADASTROS": "No se puede eliminar una sucursal vinculada a registros",
  "api.PAIS_SIGLA_DUPLICADA": "Ya existe un país con la sigla {sigla}",
  "api.PAIS_COM_CIDADES": "No se puede eliminar un país que tiene ciudades",
  "api.DIVISAO_NOME_DUPLICADO": "Ya existe una división “{nome}” en este país",
  "api.DIVISAO_COM_CIDADES": "No se puede eliminar una división que tiene ciudades",
  "api.DIVISAO_SIGLA_TAMANHO": "La sigla de la división debe tener hasta 10 caracteres",
  "api.PAIS_SIGLA_ISO": "La sigla del país debe tener 2 letras (ISO)",
  "api.CIDADE_NOME_DUPLICADO": "Ya existe una ciudad “{nome}” en esta división",
  "api.DOCUMENTO_TIPO_CODIGO_DUPLICADO": "Ya existe un tipo con el código {codigo} en este país",
  "api.DOCUMENTO_TIPO_EM_USO": "El tipo está en uso por personas registradas y no puede eliminarse",
  "api.DOCUMENTO_OBRIGATORIO": "Indique al menos un documento",
  "api.TELEFONE_PAR": "Indique DDI y teléfono juntos, o deje ambos vacíos",
  "api.DOCUMENTO_TIPO_XOR": "Indique el tipo de catálogo o el tipo libre, no ambos",
  "api.DOCUMENTO_TIPO_OBRIGATORIO": "Indique el tipo de documento",
  "api.DOCUMENTO_TIPO_PAIS": "El tipo {codigo} no pertenece a este país",
  "api.DOCUMENTO_TIPO_PESSOA": "{nome} no corresponde a esta clase de persona",
  "api.DOCUMENTO_NUMERO_OBRIGATORIO": "El número del documento es obligatorio",
  "api.DOCUMENTOS_REPETIDOS": "Hay documentos repetidos en la solicitud",
  "api.ENDERECO_PRINCIPAL_UNICO": "Solo puede existir una dirección principal activa por persona",
  "api.ENDERECO_PRINCIPAL_OBRIGATORIO": "Indique una dirección principal",
  "api.CPF_TAMANHO": "El CPF debe tener 11 dígitos",
  "api.CPF_INVALIDO": "CPF inválido",
  "api.CNPJ_TAMANHO": "El CNPJ debe tener 14 caracteres",
  "api.CNPJ_INVALIDO": "CNPJ inválido",
  "api.CNPJ_DV_NUMERICO": "CNPJ inválido: los dos últimos caracteres deben ser numéricos",
  "api.CI_TAMANHO": "La cédula (CI) debe tener entre 6 y 10 dígitos",
  "api.RUC_FORMATO": "RUC inválido: use el formato 1234567-8",
  "api.RUC_INVALIDO": "RUC inválido",
  "api.RUC_BASE": "RUC inválido: la base debe tener de 3 a 8 dígitos",
  "api.RUC_DV": "RUC inválido: dígito verificador incorrecto",
  "api.PAPEL_JA_VINCULADO": "Esta persona ya está vinculada a esta sucursal en este rol",
  "api.PESSOA_XOR": "Indique la persona o el identificador, no ambos",
  "api.PESSOA_OBRIGATORIA": "Indique la persona",
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
  "empresa.section.fiscal": "Fiscal",
  "empresa.perfilFiscal": "Perfil fiscal",
  "empresa.perfilFiscal.py_iva": "IVA Paraguay",
  "empresa.perfilFiscal.hint": "Define el motor de la factura de esta sucursal. Hoy solo IVA paraguayo (0 / 5 / 10 %).",
  "empresa.error.required": "Complete razón social, nombre comercial y RUC",
  "empresa.error.loadFailed": "No se pudo cargar empresa y sucursales",
  "empresa.error.saveFailed": "No se pudo guardar",
  "empresa.error.deleteFailed": "No se pudo eliminar la sucursal",
  "empresa.confirmDeleteBranch": "¿Eliminar esta sucursal?",
  "empresa.listClientsBranchOnly": "Listar solo clientes de esta sucursal",
  "empresa.listSuppliersBranchOnly": "Listar solo proveedores de esta sucursal",
  "empresa.branchParameters": "Parámetros de la sucursal",
  "empresa.section.parametersListagem": "Listado",
  "empresa.seed.title": "Datos de prueba",
  "empresa.seed.hint": "Crea clientes, productos con stock, una caja extra, un finalizador y tres ventas en la sucursal principal. Se puede activar y desactivar cuando quieras. No borra la Caja 1 ni Dinero, Tarjeta y Depósito.",
  "empresa.seed.statusOn": "Datos de prueba activos",
  "empresa.seed.statusOff": "Datos de prueba desactivados",
  "empresa.seed.apply": "Activar datos de prueba",
  "empresa.seed.remove": "Desactivar y quitar",
  "empresa.seed.confirmRemove": "¿Quitar clientes, productos, cajas y ventas de prueba? Lo que cargaste fuera del seed se mantiene.",
  "empresa.seed.error": "No se pudieron actualizar los datos de prueba",
  "empresa.listProductsBranchOnly": "Listar solo productos de esta sucursal",
  "produto.new": "Nuevo producto",
  "produto.edit": "Editar producto",
  "produto.codigo": "Código (SKU)",
  "produto.codigoHint": "Código interno editable. El ID del sistema se genera aparte.",
  "produto.tipo": "Tipo",
  "produto.tipo.moto": "Moto eléctrica",
  "produto.tipo.bicicleta": "Bicicleta eléctrica",
  "produto.marca": "Marca",
  "produto.modelo": "Modelo",
  "produto.descricao": "Descripción",
  "produto.section.general": "Datos del producto",
  "produto.section.price": "Precio e IVA",
  "produto.section.estoque": "Stock en esta sucursal",
  "produto.section.moto": "Ficha de la moto",
  "produto.section.bicicleta": "Ficha de la bicicleta",
  "produto.noStock": "Sin saldo en esta sucursal",
  "produto.chassi": "Chasis",
  "produto.cor": "Color",
  "produto.potencia": "Potencia (W)",
  "produto.autonomia": "Autonomía (km)",
  "produto.velocidade": "Velocidad máx. (km/h)",
  "produto.bateria": "Batería (Ah)",
  "produto.voltagem": "Voltaje (V)",
  "produto.carga": "Tiempo de carga (h)",
  "produto.peso": "Peso (kg)",
  "produto.capacidadeCarga": "Carga (kg)",
  "produto.assentos": "Asientos",
  "produto.aro": "Aro",
  "produto.quadro": "Tipo de cuadro",
  "produto.marchas": "Marchas",
  "produto.freio": "Freno",
  "produto.error.required": "Indique código, marca y modelo",
  "produto.error.yearsRequired": "Indique año de fabricación y año modelo válidos",
  "produto.error.price": "Indique precio de lista y costo válidos (cero o más)",
  "produto.iva": "IVA",
  "produto.ivaHint": "Precio de góndola con IVA incluido. 0, 5 o 10%.",
  "produto.currency": "Moneda",
  "produto.currency.usd": "Dólar (USD)",
  "produto.currency.pyg": "Guaraní (PYG)",
  "produto.currency.brl": "Real (BRL)",
  "produto.listPrice": "Precio de lista",
  "produto.listPriceHint": "Precio de góndola con IVA incluido, en la moneda elegida.",
  "produto.cost": "Costo",
  "produto.costHint": "Costo en la misma moneda del precio de lista.",
  "produto.confirmLinkBranch": "El producto {codigo} ya existe en {filiais}. ¿Vincular a esta sucursal?",
  "produto.anoFabricacao": "Año de fabricación",
  "produto.anoModelo": "Año modelo",
  "produto.serieQuadro": "Nº de serie del cuadro",
  "produto.nomeHint": "Armado automáticamente con marca y modelo",
  "marca.new": "Nueva marca",
  "marca.edit": "Editar marca",
  "marca.error.nameRequired": "Indique el nombre de la marca",
  "modelo.new": "Nuevo modelo",
  "modelo.edit": "Editar modelo",
  "modelo.error.required": "Indique marca y nombre del modelo",
  "estoque.new": "Nuevo depósito",
  "estoque.edit": "Editar depósito",
  "estoque.placeholderName": "Depósito general",
  "estoque.items": "Ítems",
  "estoque.itemNew": "Agregar producto",
  "estoque.itemEdit": "Editar cantidad",
  "estoque.product": "Producto",
  "estoque.qty": "Cantidad",
  "estoque.reserved": "Reservada",
  "estoque.reservedHint": "Para venta abierta. Disponible = cantidad − reservada.",
  "estoque.available": "Disponible",
  "estoque.backList": "Volver a depósitos",
  "estoque.backItems": "Volver a los ítems",
  "estoque.error.nameRequired": "Indique el nombre del depósito",
  "estoque.error.productRequired": "Seleccione el producto",
  "estoque.error.qtyInvalid": "Cantidad y reserva deben ser enteros ≥ 0, y la reserva no puede ser mayor que la cantidad",
  "cotacao.new": "Nueva cotización",
  "cotacao.edit": "Editar cotización",
  "cotacao.date": "Fecha",
  "cotacao.dateHint": "Zona America/Asunción. No es posible informar fecha futura.",
  "cotacao.usdPyg": "USD → PYG",
  "cotacao.usdPygHint": "Cuántos guaraníes equivalen a 1 dólar hoy.",
  "cotacao.brlPyg": "BRL → PYG",
  "cotacao.brlPygHint": "Cuántos guaraníes equivalen a 1 real hoy.",
  "cotacao.error.required": "Indique la fecha de la cotización",
  "cotacao.error.rate": "Indique las dos tasas, mayores que cero",
  "cotacao.banner.missing": "Sin cotización del día. Ventas, cobros, pagos y facturas electrónicas quedan bloqueados.",
  "cotacao.banner.wait": "Sin cotización del día. Espere a que un administrador o gestor informe las tasas para liberar ventas y facturas.",
  "cotacao.banner.save": "Informar",
  "cotacao.banner.rates": "Cotización del día",
  "finalizador.new": "Nuevo finalizador",
  "finalizador.edit": "Editar finalizador",
  "finalizador.type": "Tipo",
  "finalizador.tipo.dinheiro": "Efectivo",
  "finalizador.tipo.cartao": "Tarjeta",
  "finalizador.tipo.deposito": "Depósito",
  "finalizador.tipo.cheque": "Cheque",
  "finalizador.tipo.outro": "Otro",
  "finalizador.error.nameRequired": "Indique el nombre del finalizador",
  "caixa.new": "Nueva caja",
  "caixa.edit": "Editar caja",
  "caixa.session": "Sesión",
  "caixa.session.open": "Abierta",
  "caixa.session.closed": "Cerrada",
  "caixa.open": "Abrir caja",
  "caixa.close": "Cerrar caja",
  "caixa.transfer": "Transferir",
  "caixa.movements": "Movimientos",
  "caixa.conferencia": "Conteo",
  "caixa.note": "Observación",
  "caixa.destination": "Caja de destino",
  "caixa.expected": "Saldo esperado",
  "caixa.user": "Usuario",
  "caixa.amount": "Valor",
  "caixa.movementType": "Tipo",
  "caixa.default": "Predeterminada",
  "caixa.error.nameRequired": "Indique el nombre de la caja",
  "caixa.error.conferencia": "Indique el conteo de cierre",
  "caixa.error.destino": "Seleccione la caja de destino",
  "caixa.error.valor": "Indique al menos un valor",
  "caixa.error.noneClosed": "No hay caja cerrada para abrir",
  "caixa.mov.abertura": "Apertura",
  "caixa.mov.fechamento": "Cierre",
  "caixa.mov.venda": "Venta",
  "caixa.mov.transferencia_saida": "Transferencia (salida)",
  "caixa.mov.transferencia_entrada": "Transferencia (entrada)",
  "venda.new": "Nueva venta",
  "venda.view": "Venta",
  "venda.client": "Cliente",
  "venda.till": "Caja",
  "venda.tillHint": "Debe estar abierta en la sucursal actual",
  "venda.items": "Ítems",
  "venda.product": "Producto",
  "venda.qty": "Cant.",
  "venda.stock": "stock",
  "venda.add": "Agregar",
  "venda.total": "Total",
  "venda.pay": "Pago",
  "venda.finalizer": "Forma",
  "venda.amount": "Valor (Gs.)",
  "venda.addPay": "+ otra forma",
  "venda.finish": "Finalizar venta",
  "venda.seller": "Vendedor",
  "venda.error.product": "Seleccione un producto",
  "venda.error.qty": "Indique una cantidad válida",
  "venda.error.client": "Seleccione el cliente",
  "venda.error.items": "Agregue al menos un ítem",
  "venda.error.pay": "Indique el pago",
  "venda.clientSearch": "Buscar cliente",
  "venda.clientSearchPlaceholder": "Nombre o documento",
  "venda.changeClient": "Cambiar",
  "venda.productSearch": "Producto / SKU",
  "venda.productSearchPlaceholder": "Código, SKU o nombre — Enter lanza",
  "venda.emptyCart": "Ningún ítem. Busque y pulse Enter.",
  "venda.subtotal": "Subtotal",
  "venda.paid": "Pagado",
  "venda.remaining": "Falta",
  "venda.noTill": "Ninguna caja abierta en esta sucursal",
  "venda.unit": "Unit.",
  "usuario.caixas": "Cajas",
  "usuario.caixaPadrao": "Caja predeterminada",
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { pt, es };

export function localeLabel(locale: Locale): string {
  return locale === "pt" ? "PT" : "ES";
}

/** Chaves de tradução para nomes de países no seletor de DDI. */
export function countryTranslationKey(iso: string): TranslationKey {
  return `country.${iso}` as TranslationKey;
}
