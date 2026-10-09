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
  | "nav.group.vendas"
  | "nav.group.financeiro"
  | "nav.group.catalogo"
  | "nav.group.pessoas"
  | "nav.group.configuracao"
  | "nav.group.localidade"
  | "nav.group.relatorios"
  | "nav.relatorioReceber"
  | "nav.relatorioPagar"
  | "nav.relatorioVendas"
  | "nav.relatorioEstoque"
  | "nav.relatorioCaixa"
  | "relatorio.vendas"
  | "relatorio.receber"
  | "relatorio.pagar"
  | "relatorio.estoque"
  | "relatorio.posicao"
  | "relatorio.parcelas"
  | "relatorio.baixas"
  | "relatorio.movimentos"
  | "relatorio.de"
  | "relatorio.ate"
  | "relatorio.total"
  | "relatorio.registros"
  | "relatorio.movimentoInicio"
  | "relatorio.tipo"
  | "relatorio.tipo.venda"
  | "relatorio.tipo.entrada"
  | "relatorio.tipo.ajuste"
  | "relatorio.atraso"
  | "relatorio.saldoDepois"
  | "relatorio.anterior"
  | "relatorio.saida"
  | "relatorio.saldoEstoque"
  | "relatorio.comSaldo"
  | "relatorio.todosSaldos"
  | "relatorio.finalizador"
  | "relatorio.dias"
  | "relatorio.pdf"
  | "relatorio.excel"
  | "relatorio.exportar"
  | "relatorio.agrupar"
  | "relatorio.agrupar.nenhum"
  | "relatorio.agrupar.cliente"
  | "relatorio.agrupar.fornecedor"
  | "relatorio.agrupar.vencimento"
  | "relatorio.nominal"
  | "relatorio.cotacao"
  | "relatorio.parcela"
  | "relatorio.documento"
  | "relatorio.venda"
  | "relatorio.vencidas"
  | "relatorio.busca.receber"
  | "relatorio.busca.pagar"
  | "relatorio.busca.baixasReceber"
  | "relatorio.busca.baixasPagar"
  | "relatorio.busca.vendas"
  | "relatorio.busca.estoque"
  | "relatorio.busca.movimentos"
  | "relatorio.busca.caixa"
  | "relatorio.caixa"
  | "relatorio.legendaGs"
  | "relatorio.legendaGsPagar"
  | "relatorio.emAberto"
  | "relatorio.recebidos"
  | "relatorio.pagos"
  | "relatorio.recebido"
  | "relatorio.saldo"
  | "relatorio.totalDia"
  | "relatorio.situacao"
  | "relatorio.somenteAbertos"
  | "relatorio.periodo"
  | "relatorio.periodo.todas"
  | "relatorio.periodo.emissao"
  | "relatorio.periodo.vencimento"
  | "relatorio.periodo.recebimento"
  | "relatorio.periodo.pagamento"
  | "relatorio.fechamento"
  | "relatorio.periodoInvalido"
  | "estoque.ajusteObs"
  | "produto.movimentos"
  | "produto.movimentosEmpty"
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
  | "common.saveAndNew"
  | "common.cancel"
  | "common.edit"
  | "common.delete"
  | "common.search"
  | "common.f2Search"
  | "searchModal.hint"
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
  | "filter.status.label"
  | "filter.status.all"
  | "filter.status.active"
  | "filter.status.inactive"
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
  | "form.tab.data"
  | "form.tab.address"
  | "form.tab.document"
  | "produto.tab.cadastro"
  | "produto.tab.ficha"
  | "papel.name"
  | "papel.namePlaceholder"
  | "papel.personType"
  | "papel.personType.fisica"
  | "papel.personType.juridica"
  | "papel.streetType"
  | "papel.streetTypePlaceholder"
  | "papel.streetTypeEmpty"
  | "streetType.rua"
  | "streetType.avenida"
  | "streetType.alameda"
  | "streetType.travessa"
  | "streetType.praca"
  | "streetType.rodovia"
  | "streetType.estrada"
  | "streetType.passagem"
  | "streetType.vila"
  | "streetType.beco"
  | "streetType.condominio"
  | "streetType.fazenda"
  | "streetType.sitio"
  | "streetType.chacara"
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
  | "papel.openExisting"
  | "papel.registeredBranches"
  | "papel.confirmLinkBranch"
  | "papel.linkToBranch"
  | "papel.conflict.linkBranch"
  | "papel.viewExisting"
  | "papel.existingPreviewTitle"
  | "papel.alreadyCliente"
  | "papel.alreadyFornecedor"
  | "papel.loadExistingFailed"
  | "papel.searchPlaceholder"
  | "papel.error.nameRequired"
  | "papel.error.phonePair"
  | "papel.error.phone2Pair"
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
  | "ddi.searchModalTitle"
  | "ddi.noPhone"
  | "ddi.other"
  | "ddi.otherManual"
  | "ddi.phonePlaceholder"
  | "ddi.phone"
  | "ddi.phone2"
  | "cidade.searchPlaceholder"
  | "cidade.searchInputPlaceholder"
  | "cidade.searchModalTitle"
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
  | "ficha.tab.dados"
  | "ficha.tab.estoque"
  | "ficha.tab.movimentacao"
  | "ficha.stockLog"
  | "papel.actionsMenu"
  | "papel.viewSheet"
  | "col.actions"
  | "col.id"
  | "col.date"
  | "col.status"
  | "col.document"
  | "col.phone"
  | "col.city"
  | "col.country"
  | "col.person"
  | "col.code"
  | "col.unique"
  | "col.initials"
  | "col.division"
  | "col.divisionRegion"
  | "col.searchDocTypes"
  | "dashboard.stat.clientes"
  | "dashboard.stat.clientesSub"
  | "dashboard.stat.fornecedores"
  | "dashboard.stat.fornecedoresSub"
  | "dashboard.stat.estoque"
  | "dashboard.stat.estoqueSub"
  | "dashboard.stat.vendasHoje"
  | "dashboard.stat.vendasHojeSub"
  | "dashboard.stat.produtos"
  | "dashboard.stat.produtosSub"
  | "dashboard.stat.caixas"
  | "dashboard.stat.caixasSub"
  | "dashboard.go.vendas"
  | "dashboard.go.caixa"
  | "dashboard.go.historico"
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
  | "usuario.searchPlaceholder"
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
  | "pais.searchPlaceholder"
  | "divisao.new"
  | "divisao.edit"
  | "divisao.error.required"
  | "divisao.siglaHint"
  | "divisao.placeholderName"
  | "divisao.searchPlaceholder"
  | "cidade.new"
  | "cidade.edit"
  | "cidade.error.required"
  | "cidade.error.municipioRequired"
  | "cidade.listSearchPlaceholder"
  | "cidade.placeholderName"
  | "cidade.selectDivision"
  | "cidade.tipo"
  | "cidade.tipo.municipio"
  | "cidade.tipo.distrito"
  | "cidade.municipio"
  | "error.conflict.docUnique"
  | "error.conflict.docUnlinked"
  | "error.conflict.docUnlinkedPreview"
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
  | "api.LOGIN_RATE_LIMIT"
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
  | "api.PRODUTO_CODIGO_TAMANHO"
  | "api.PRODUTO_NOME_OBRIGATORIO"
  | "api.PRODUTO_NOME_TAMANHO"
  | "api.MODELO_MARCA_DIVERGENTE"
  | "api.MODELO_TIPO_DIVERGENTE"
  | "api.MOTO_DADOS_OBRIGATORIOS"
  | "api.ANO_MODELO_ANTERIOR"
  | "api.ANO_FORA_FAIXA"
  | "api.CHASSI_DUPLICADO"
  | "api.CHASSI_OBRIGATORIO"
  | "api.CHASSI_INTERVALO_INVALIDO"
  | "api.CHASSI_INTERVALO_GRANDE"
  | "api.UNIDADE_SO_MOTO"
  | "api.CHASSI_NAO_CONTROLADO"
  | "api.CONTROLA_CHASSI_IMUTAVEL"
  | "api.UNIDADE_VENDIDA"
  | "api.UNIDADE_OBRIGATORIA"
  | "api.UNIDADE_REPETIDA"
  | "api.UNIDADE_QTD"
  | "api.UNIDADE_INVALIDA"
  | "api.UNIDADE_INDISPONIVEL"
  | "api.ESTOQUE_QTD_CHASSI"
  | "api.SERIE_QUADRO_DUPLICADA"
  | "api.ESTOQUE_NOME_DUPLICADO"
  | "api.ESTOQUE_COM_PRODUTOS"
  | "api.ESTOQUE_PRODUTO_DUPLICADO"
  | "api.ESTOQUE_NOME_OBRIGATORIO"
  | "api.ESTOQUE_PADRAO_OBRIGATORIO"
  | "api.ESTOQUE_PADRAO_INATIVO"
  | "api.ESTOQUE_PADRAO_FILIAL"
  | "api.ESTOQUE_NAO_PADRAO"
  | "api.COTACAO_DIA_AUSENTE"
  | "api.COTACAO_DIA_DUPLICADA"
  | "api.COTACAO_DATA_INVALIDA"
  | "api.COTACAO_DATA_FUTURA"
  | "api.COTACAO_TAXA_INVALIDA"
  | "api.COTACAO_SO_HOJE"
  | "api.COTACAO_NAO_EXCLUI"
  | "api.SUDTAX_DESLIGADA"
  | "api.SUDTAX_URL"
  | "api.SUDTAX_API_KEY"
  | "api.SUDTAX_ERRO"
  | "api.SUDTAX_RESPOSTA"
  | "api.FACTURA_NAO_PRONTA"
  | "api.FACTURA_SEM_SUDTAX"
  | "api.FACTURA_CANCELADA"
  | "api.DOCUMENTO_REFERENCIA_DUPLICADA"
  | "api.ID_VENDA"
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
  | "api.CIDADE_MUNICIPIO_OBRIGATORIO"
  | "api.CIDADE_MUNICIPIO_INVALIDO"
  | "api.CIDADE_COM_DISTRITOS"
  | "api.CIDADE_DISTRITO_SEDE"
  | "api.DOCUMENTO_TIPO_CODIGO_DUPLICADO"
  | "api.DOCUMENTO_TIPO_EM_USO"
  | "api.DOCUMENTO_OBRIGATORIO"
  | "api.TELEFONE_PAR"
  | "api.TELEFONE2_PAR"
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
  | "empresa.moedaOperacao"
  | "empresa.estoquePadrao"
  | "empresa.section.parametersMoeda"
  | "produto.new"
  | "produto.edit"
  | "produto.codigo"
  | "produto.codigoSuggested"
  | "produto.tipo"
  | "produto.tipo.moto"
  | "produto.tipo.bicicleta"
  | "produto.marca"
  | "produto.modelo"
  | "produto.descricao"
  | "produto.section.general"
  | "produto.foto"
  | "produto.fotoHint"
  | "produto.fotoChoose"
  | "produto.fotoRemove"
  | "produto.section.price"
  | "produto.section.estoque"
  | "produto.section.moto"
  | "produto.section.bicicleta"
  | "produto.noStock"
  | "produto.qtyInicial"
  | "produto.stockHint"
  | "produto.stockHintChassi"
  | "produto.controlaChassi"
  | "produto.controlaChassiHint"
  | "produto.chassi"
  | "produto.chassiLote"
  | "produto.chassiLoteHint"
  | "produto.chassiLotePlaceholder"
  | "produto.chassiCount"
  | "produto.chassiAdd"
  | "produto.chassiEmpty"
  | "produto.chassiCodigo"
  | "produto.situacao.disponivel"
  | "produto.situacao.vendido"
  | "produto.error.chassiIntervalo"
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
  | "produto.error.nameRequired"
  | "produto.error.yearsRequired"
  | "produto.error.price"
  | "produto.error.qty"
  | "produto.iva"
  | "produto.currency"
  | "produto.currency.usd"
  | "produto.currency.pyg"
  | "produto.currency.brl"
  | "produto.listPrice"
  | "produto.cost"
  | "produto.confirmLinkBranch"
  | "produto.anoFabricacao"
  | "produto.anoModelo"
  | "produto.serieQuadro"
  | "produto.nomeRestore"
  | "produto.searchPlaceholder"
  | "marca.new"
  | "marca.searchPlaceholder"
  | "marca.edit"
  | "marca.error.nameRequired"
  | "modelo.new"
  | "modelo.edit"
  | "modelo.error.required"
  | "modelo.searchPlaceholder"
  | "estoque.new"
  | "estoque.edit"
  | "estoque.placeholderName"
  | "estoque.items"
  | "estoque.searchPlaceholder"
  | "estoque.itemSearchPlaceholder"
  | "estoque.itemNew"
  | "estoque.itemEdit"
  | "estoque.product"
  | "estoque.qty"
  | "estoque.reserved"
  | "estoque.reservedHint"
  | "estoque.available"
  | "estoque.unit"
  | "estoque.backList"
  | "estoque.backItems"
  | "estoque.error.nameRequired"
  | "estoque.error.productRequired"
  | "estoque.error.qtyInvalid"
  | "estoque.qtyChassisHint"
  | "estoque.padraoBadge"
  | "cotacao.new"
  | "cotacao.edit"
  | "cotacao.date"
  | "cotacao.dateHint"
  | "cotacao.usdPyg"
  | "cotacao.usdPygHint"
  | "cotacao.brlPyg"
  | "cotacao.brlPygHint"
  | "cotacao.rateExample"
  | "cotacao.ratePlaceholder"
  | "cotacao.error.required"
  | "cotacao.error.rate"
  | "cotacao.searchPlaceholder"
  | "cotacao.banner.missing"
  | "cotacao.banner.wait"
  | "cotacao.banner.save"
  | "cotacao.banner.rates"
  | "nav.finalizadores"
  | "nav.caixas"
  | "nav.caixa"
  | "nav.vendas"
  | "nav.orcamentos"
  | "nav.historico"
  | "nav.contasReceber"
  | "nav.contasPagar"
  | "nav.entradaNota"
  | "nav.facturas"
  | "factura.emitir"
  | "factura.escolherVenda"
  | "factura.selecioneVenda"
  | "factura.semVendasElegiveis"
  | "factura.enviarAposCriar"
  | "factura.searchPlaceholder"
  | "factura.venda"
  | "factura.cliente"
  | "factura.estado"
  | "factura.estado.pendente"
  | "factura.estado.processando"
  | "factura.estado.aprobado"
  | "factura.estado.rechazado"
  | "factura.estado.cancelado"
  | "factura.cdc"
  | "factura.total"
  | "factura.data"
  | "factura.fichaTitle"
  | "factura.status"
  | "factura.referencia"
  | "factura.sudtaxId"
  | "factura.atualizado"
  | "factura.payload"
  | "factura.enviar"
  | "factura.consultar"
  | "factura.error.vendaObrigatoria"
  | "finalizador.new"
  | "finalizador.edit"
  | "finalizador.type"
  | "finalizador.tipo.dinheiro"
  | "finalizador.tipo.cartao"
  | "finalizador.tipo.deposito"
  | "finalizador.tipo.cheque"
  | "finalizador.tipo.outro"
  | "finalizador.geraReceber"
  | "finalizador.geraReceberHint"
  | "finalizador.geraPagar"
  | "finalizador.geraPagarHint"
  | "finalizador.fundoTroco"
  | "finalizador.fundoTrocoHint"
  | "finalizador.permiteAvulso"
  | "finalizador.permiteAvulsoHint"
  | "finalizador.section.params"
  | "finalizador.chip.troco"
  | "finalizador.chip.avulso"
  | "finalizador.chip.receber"
  | "finalizador.chip.pagar"
  | "finalizador.error.nameRequired"
  | "finalizador.searchPlaceholder"
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
  | "caixa.disponivel"
  | "caixa.transferEmpty"
  | "caixa.user"
  | "caixa.amount"
  | "caixa.movementType"
  | "caixa.default"
  | "caixa.error.nameRequired"
  | "caixa.searchPlaceholder"
  | "caixa.error.conferencia"
  | "caixa.error.destino"
  | "caixa.error.valor"
  | "caixa.error.noneClosed"
  | "caixa.error.noFundoTroco"
  | "caixa.addFinalizer"
  | "caixa.addCurrency"
  | "caixa.conferenciaHint"
  | "caixa.conferenciaLock"
  | "caixa.conferenciaEmpty"
  | "caixa.removeLine"
  | "caixa.include"
  | "caixa.informed"
  | "caixa.difference"
  | "caixa.summary"
  | "caixa.fundoTroco"
  | "caixa.ok"
  | "caixa.shortage"
  | "caixa.surplus"
  | "caixa.lancamento"
  | "caixa.lancamento.tipo"
  | "caixa.lancamento.suprimento"
  | "caixa.lancamento.sangria"
  | "caixa.lancamento.valor"
  | "caixa.error.lancamento"
  | "caixa.error.noAvulso"
  | "caixa.mov.abertura"
  | "caixa.mov.fechamento"
  | "caixa.mov.venda"
  | "caixa.mov.transferencia_saida"
  | "caixa.mov.transferencia_entrada"
  | "caixa.mov.suprimento"
  | "caixa.mov.sangria"
  | "caixa.mov.recebimento"
  | "caixa.mov.pagamento"
  | "venda.new"
  | "venda.view"
  | "venda.status.finalizada"
  | "venda.status.cancelada"
  | "venda.status.aberta"
  | "venda.status.orcamento"
  | "venda.status.orcamentoVencido"
  | "venda.status.utilizada"
  | "venda.gerarVenda"
  | "venda.retomar"
  | "venda.cancelarOrcamento"
  | "venda.cancelarAberta"
  | "venda.trazerOrcamentos"
  | "venda.mesclarOrcamentos"
  | "venda.clienteTemOrcamentos"
  | "venda.incluirOrcamentos"
  | "venda.semOrcamentos"
  | "venda.emAberto"
  | "venda.confirmCancelar"
  | "venda.orcamentoCliente"
  | "venda.orcamentosSelecionados"
  | "venda.utilizadaEm"
  | "venda.orcamentoNaVenda"
  | "venda.filtro.todos"
  | "venda.filtro.aberta"
  | "venda.filtro.orcamento"
  | "venda.filtro.finalizada"
  | "venda.filtro.cancelada"
  | "venda.filtro.utilizada"
  | "venda.documentoEletronico"
  | "venda.montarJsonSudtax"
  | "venda.copiarJsonSudtax"
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
  | "venda.currency.pyg"
  | "venda.currency.usd"
  | "venda.currency.brl"
  | "venda.equivalent"
  | "venda.addPay"
  | "venda.finish"
  | "venda.goPay"
  | "venda.backItems"
  | "venda.seller"
  | "venda.changeSeller"
  | "venda.sellerSearchPlaceholder"
  | "venda.searchPlaceholder"
  | "venda.error.seller"
  | "venda.error.product"
  | "venda.error.qty"
  | "venda.error.client"
  | "venda.error.items"
  | "venda.error.pay"
  | "venda.parcelas"
  | "venda.parcelasEmpty"
  | "venda.qtdParcelas"
  | "venda.modoVencimento"
  | "venda.diaVencimento"
  | "venda.modo.intervalo30"
  | "venda.modo.diaFixo"
  | "titulo.receber.new"
  | "titulo.pagar.new"
  | "titulo.moeda"
  | "titulo.valor"
  | "titulo.saldo"
  | "titulo.vencimento"
  | "titulo.baixar"
  | "titulo.receberSelecionadas"
  | "titulo.pagarSelecionadas"
  | "titulo.selecionadas"
  | "titulo.selecionarTodas"
  | "titulo.cotacaoTravada"
  | "titulo.fifoHint"
  | "titulo.searchPlaceholder"
  | "titulo.filtro.abertos"
  | "titulo.filtro.quitados"
  | "titulo.filtro.abertas"
  | "titulo.filtro.pagas"
  | "titulo.filtro.parciais"
  | "titulo.filtro.vazio"
  | "titulo.desconto"
  | "titulo.acrescimo"
  | "titulo.quitaSaldo"
  | "titulo.ajusteValor"
  | "titulo.error.cliente"
  | "titulo.error.fornecedor"
  | "titulo.error.valor"
  | "titulo.error.selecioneParcelas"
  | "titulo.status.aberto"
  | "titulo.status.parcial"
  | "titulo.status.quitado"
  | "titulo.status.cancelado"
  | "titulo.parcela.aberta"
  | "titulo.parcela.parcial"
  | "titulo.parcela.paga"
  | "titulo.parcela.cancelada"
  | "entrada.new"
  | "entrada.documento"
  | "entrada.tipoDocumento"
  | "entrada.tipo.py_factura"
  | "entrada.tipo.exterior"
  | "entrada.dataEmissao"
  | "entrada.timbrado"
  | "entrada.establecimiento"
  | "entrada.punto"
  | "entrada.numero"
  | "entrada.cdc"
  | "entrada.numeroDocumento"
  | "entrada.incoterm"
  | "entrada.itens"
  | "entrada.addItem"
  | "entrada.valorUnitario"
  | "entrada.chassisHint"
  | "entrada.prazo"
  | "entrada.total"
  | "entrada.tituloGerado"
  | "entrada.searchPlaceholder"
  | "entrada.error.itens"
  | "entrada.error.pagamento"
  | "api.VENDA_CREDITO_UNICO"
  | "api.PARCELAS_QTD"
  | "api.DIA_VENCIMENTO_INVALIDO"
  | "api.PARCELAS_OBRIGATORIAS"
  | "api.FINALIZADOR_NAO_LIQUIDA"
  | "api.BAIXA_SEM_PARCELA"
  | "api.BAIXA_TITULO_MISTO"
  | "api.BAIXA_CLIENTE_MISTO"
  | "api.BAIXA_FORNECEDOR_MISTO"
  | "api.BAIXA_MAIOR_SALDO"
  | "api.BAIXA_VALOR_AJUSTE"
  | "api.BAIXA_DESCONTO_MAIOR"
  | "api.BAIXA_AJUSTE_INVALIDO"
  | "api.PARCELA_JA_PAGA"
  | "api.ENTRADA_PY_DUPLICADA"
  | "api.ENTRADA_PY_CAMPOS"
  | "api.ENTRADA_EXTERIOR_NUMERO"
  | "api.ENTRADA_NEGOCIACAO_DIVERGENTE"
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
  | "venda.tillClosed"
  | "venda.changeTill"
  | "venda.definePay"
  | "venda.payEmpty"
  | "venda.confirmPay"
  | "venda.payOver"
  | "venda.change"
  | "venda.due"
  | "venda.unit"
  | "venda.itemsCount"
  | "venda.clear"
  | "venda.clienteRapido.title"
  | "venda.clienteRapido.hint"
  | "venda.clienteRapido.new"
  | "venda.hold"
  | "venda.heldCount"
  | "venda.heldNoClient"
  | "venda.open"
  | "venda.openEmpty"
  | "venda.summary"
  | "venda.seeSummary"
  | "venda.discardConfirm"
  | "venda.emptyHint"
  | "venda.filter.all"
  | "venda.units"
  | "venda.vitrineMore"
  | "venda.pickChassis"
  | "venda.chassisSearchPlaceholder"
  | "venda.chassisDone"
  | "venda.noChassis"
  | "venda.error.chassisRequired"
  | "venda.chassisMore"
  | "venda.chassisInCart"
  | "venda.discount"
  | "venda.saleDiscount"
  | "venda.remainingValue"
  | "venda.payAmount"
  | "venda.finalizerSearch"
  | "venda.recibo.title"
  | "venda.recibo.print"
  | "venda.recibo.footer"
  | "venda.dav.titulo"
  | "venda.dav.tituloOrcamento"
  | "venda.dav.tituloAberta"
  | "venda.dav.aviso"
  | "venda.dav.pagamento"
  | "venda.dav.endereco"
  | "venda.dav.telefone"
  | "venda.dav.concordo"
  | "venda.validade"
  | "venda.salvarOrcamento"
  | "venda.deixarAberto"
  | "venda.continuar"
  | "venda.continuando"
  | "venda.confirmVencido"
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
  | "api.CAIXA_CONFERENCIA_FORA"
  | "api.CAIXA_TRANSFERENCIA_MESMO"
  | "api.CAIXA_TRANSFERENCIA_FILIAL"
  | "api.CAIXA_DESTINO_FECHADO"
  | "api.CAIXA_VALOR_INVALIDO"
  | "api.CAIXA_SALDO_INSUFICIENTE"
  | "api.CAIXA_LANCAMENTO_TIPO"
  | "api.CAIXA_FINALIZADOR_INATIVO"
  | "api.CAIXA_FINALIZADOR_SEM_AVULSO"
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
  | "api.ORCAMENTO_VENCIDO"
  | "api.ORCAMENTO_VALIDADE"
  | "api.VENDA_GRAVACAO"
  | "api.VENDA_NAO_ABERTA"
  | "api.VENDA_NAO_CANCELAVEL"
  | "api.ORCAMENTO_CLIENTE"
  | "api.ORCAMENTO_INDISPONIVEL"
  | "api.ORCAMENTO_EM_USO"
  | "api.VENDA_DESCONTO_INVALIDO"
  | "api.VENDEDOR_INATIVO"
  | "api.VENDEDOR_FILIAL"
  | "api.VENDEDOR_INVALIDO"
  | "api.ESTOQUE_INSUFICIENTE"
  | "api.ESTOQUE_FILIAL"
  | "api.ESTOQUE_PRODUTO_AUSENTE"
  | "api.PRODUTO_INATIVO"
  | "api.PRODUTO_FOTO_TIPO"
  | "api.PRODUTO_FOTO_TAMANHO"
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
  "nav.group.vendas": "Vendas",
  "nav.group.financeiro": "Caixa e financeiro",
  "nav.group.catalogo": "Catálogo",
  "nav.group.pessoas": "Pessoas",
  "nav.group.configuracao": "Configuração",
  "nav.group.localidade": "Localidade",
  "nav.group.relatorios": "Relatórios",
  "nav.relatorioReceber": "Contas a receber",
  "nav.relatorioPagar": "Contas a pagar",
  "nav.relatorioVendas": "Vendas",
  "nav.relatorioEstoque": "Estoque",
  "nav.relatorioCaixa": "Movimentos de caixa",
  "relatorio.vendas": "Vendas",
  "relatorio.receber": "A receber",
  "relatorio.pagar": "A pagar",
  "relatorio.estoque": "Estoque",
  "relatorio.posicao": "Posição",
  "relatorio.parcelas": "Parcelas",
  "relatorio.baixas": "Baixas",
  "relatorio.movimentos": "Movimentos",
  "relatorio.de": "De",
  "relatorio.ate": "Até",
  "relatorio.total": "Total",
  "relatorio.registros": "{n} registros",
  "relatorio.movimentoInicio": "O histórico começa no dia em que o log passou a existir. Movimentos anteriores não são reconstruídos.",
  "relatorio.tipo": "Tipo",
  "relatorio.tipo.venda": "Venda",
  "relatorio.tipo.entrada": "Entrada",
  "relatorio.tipo.ajuste": "Ajuste",
  "relatorio.atraso": "Atraso",
  "relatorio.saldoDepois": "Saldo depois",
  "relatorio.anterior": "Anterior",
  "relatorio.saida": "Saída",
  "relatorio.saldoEstoque": "Estoque",
  "relatorio.comSaldo": "Com saldo",
  "relatorio.todosSaldos": "Todos",
  "relatorio.finalizador": "Finalizador",
  "relatorio.dias": "{n} d",
  "relatorio.pdf": "PDF",
  "relatorio.excel": "Excel",
  "relatorio.exportar": "Exportar",
  "relatorio.agrupar": "Agrupar",
  "relatorio.agrupar.nenhum": "Sem agrupamento",
  "relatorio.agrupar.cliente": "Por cliente",
  "relatorio.agrupar.fornecedor": "Por fornecedor",
  "relatorio.agrupar.vencimento": "Por vencimento",
  "relatorio.nominal": "Nominal",
  "relatorio.cotacao": "Cotação",
  "relatorio.parcela": "Parc.",
  "relatorio.documento": "Doc.",
  "relatorio.venda": "Venda",
  "relatorio.vencidas": "Vencidas",
  "relatorio.busca.receber": "Cliente, venda ou parcela",
  "relatorio.busca.pagar": "Fornecedor ou parcela",
  "relatorio.busca.baixasReceber": "Cliente ou finalizador",
  "relatorio.busca.baixasPagar": "Fornecedor ou finalizador",
  "relatorio.busca.vendas": "Número, cliente ou vendedor",
  "relatorio.busca.estoque": "Código, nome ou estoque",
  "relatorio.busca.movimentos": "Código, nome, estoque ou observação",
  "relatorio.busca.caixa": "Caixa, usuário, tipo, observação ou venda",
  "relatorio.caixa": "Caixa",
  "relatorio.legendaGs": "Os cálculos consideram a cotação do dia de cada parcela.",
  "relatorio.legendaGsPagar": "Os cálculos consideram a cotação do dia de cada parcela.",
  "relatorio.emAberto": "Em aberto",
  "relatorio.recebidos": "Recebidos",
  "relatorio.pagos": "Pagos",
  "relatorio.recebido": "Recebido",
  "relatorio.saldo": "Saldo",
  "relatorio.totalDia": "Total do dia",
  "relatorio.situacao": "Situação",
  "relatorio.somenteAbertos": "Somente abertos",
  "relatorio.periodo": "Período",
  "relatorio.periodo.todas": "Todas",
  "relatorio.periodo.emissao": "Emissão",
  "relatorio.periodo.vencimento": "Vencimento",
  "relatorio.periodo.recebimento": "Recebimento",
  "relatorio.periodo.pagamento": "Pagamento",
  "relatorio.fechamento": "Data de fechamento",
  "relatorio.periodoInvalido": "Informe a data inicial e a final. A inicial não pode ser depois da final.",
  "estoque.ajusteObs": "Observação do ajuste",
  "produto.movimentos": "Movimentos",
  "produto.movimentosEmpty": "Ainda não há movimentos deste produto. O log começa a partir de agora.",
  "nav.dashboard": "Dashboard",
  "nav.clientes": "Clientes",
  "nav.fornecedores": "Fornecedores",
  "nav.produtos": "Produtos",
  "nav.marcas": "Marcas",
  "nav.modelos": "Modelos",
  "nav.estoques": "Estoques",
  "nav.cotacoes": "Cotações",
  "nav.contasReceber": "Contas a receber",
  "nav.contasPagar": "Contas a pagar",
  "nav.entradaNota": "Entrada de nota",
  "nav.facturas": "Faturas",
  "factura.emitir": "Emitir fatura",
  "factura.escolherVenda": "Venda",
  "factura.selecioneVenda": "Selecione uma venda…",
  "factura.semVendasElegiveis": "Não há vendas finalizadas sem fatura nesta filial.",
  "factura.enviarAposCriar": "Enviar à SET / simulador após criar",
  "factura.searchPlaceholder": "Cliente, CDC, venda, estado…",
  "factura.venda": "Venda",
  "factura.cliente": "Cliente",
  "factura.estado": "Estado",
  "factura.estado.pendente": "Pendente",
  "factura.estado.processando": "Processando",
  "factura.estado.aprobado": "Aprovado",
  "factura.estado.rechazado": "Rejeitado",
  "factura.estado.cancelado": "Cancelado",
  "factura.cdc": "CDC",
  "factura.total": "Total",
  "factura.data": "Data",
  "factura.fichaTitle": "Fatura eletrônica",
  "factura.status": "Status SudTax",
  "factura.referencia": "Referência",
  "factura.sudtaxId": "ID SudTax",
  "factura.atualizado": "Atualizado",
  "factura.payload": "Payload enviado",
  "factura.enviar": "Enviar à SET",
  "factura.consultar": "Atualizar status",
  "factura.error.vendaObrigatoria": "Selecione a venda",
  "nav.finalizadores": "Finalizadores",
  "nav.caixas": "Caixas",
  "nav.caixa": "Caixa do dia",
  "nav.vendas": "Vendas",
  "nav.orcamentos": "Orçamento",
  "nav.historico": "Histórico",
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
  "common.saveAndNew": "Salvar e novo",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Excluir",
  "common.search": "Buscar...",
  "common.f2Search": "F2 pesquisar",
  "searchModal.hint": "Enter confirma · Esc fecha · ↑↓ navega",
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
  "filter.status.label": "Filtrar por status",
  "filter.status.all": "Todos",
  "filter.status.active": "Ativos",
  "filter.status.inactive": "Inativos",
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
  "form.tab.data": "Dados",
  "form.tab.address": "Endereços",
  "form.tab.document": "Documento",
  "produto.tab.cadastro": "Cadastro",
  "produto.tab.ficha": "Ficha técnica",
  "papel.name": "Nome / razão social",
  "papel.namePlaceholder": "Nome completo",
  "papel.personType": "Tipo de pessoa",
  "papel.personType.fisica": "Pessoa física",
  "papel.personType.juridica": "Pessoa jurídica",
  "papel.streetType": "Tipo",
  "papel.streetTypePlaceholder": "Rua",
  "papel.streetTypeEmpty": "—",
  "streetType.rua": "Rua",
  "streetType.avenida": "Avenida",
  "streetType.alameda": "Alameda",
  "streetType.travessa": "Travessa",
  "streetType.praca": "Praça",
  "streetType.rodovia": "Rodovia",
  "streetType.estrada": "Estrada",
  "streetType.passagem": "Passagem",
  "streetType.vila": "Vila",
  "streetType.beco": "Beco",
  "streetType.condominio": "Condomínio",
  "streetType.fazenda": "Fazenda",
  "streetType.sitio": "Sítio",
  "streetType.chacara": "Chácara",
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
  "papel.useExisting": "Usar cadastro existente",
  "papel.openExisting": "Abrir cadastro",
  "papel.registeredBranches": "Filiais com cadastro",
  "papel.confirmLinkBranch": "Confirmar vínculo nesta filial",
  "papel.linkToBranch": "Vincular a esta filial",
  "papel.conflict.linkBranch": "{nome} já está cadastrado em {filiais}. Vincular também em {filialAlvo}?",
  "papel.viewExisting": "Ver cadastro",
  "papel.existingPreviewTitle": "Cadastro existente",
  "papel.alreadyCliente": "Já é cliente",
  "papel.alreadyFornecedor": "Já é fornecedor",
  "papel.loadExistingFailed": "Não foi possível carregar o cadastro",
  "papel.searchPlaceholder": "Nome, documento, cidade...",
  "papel.error.nameRequired": "Informe o nome / razão social",
  "papel.error.phonePair": "Informe DDI e telefone juntos, ou deixe ambos vazios",
  "papel.error.phone2Pair": "Informe DDI e segundo telefone juntos, ou deixe ambos vazios",
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
  "ddi.searchModalTitle": "Buscar país / DDI",
  "ddi.noPhone": "— Sem telefone",
  "ddi.other": "Outro (DDI manual)",
  "ddi.otherManual": "Outro — informe o DDI",
  "ddi.phonePlaceholder": "Número",
  "ddi.phone": "Telefone",
  "ddi.phone2": "Telefone 2",
  "cidade.searchPlaceholder": "Buscar cidade…",
  "cidade.searchInputPlaceholder": "Nome, UF ou país…",
  "cidade.searchModalTitle": "Buscar cidade",
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
  "ficha.tab.dados": "Dados",
  "ficha.tab.estoque": "Estoque",
  "ficha.tab.movimentacao": "Movimentação",
  "ficha.stockLog": "Movimentações",
  "papel.actionsMenu": "Ações",
  "papel.viewSheet": "Ver ficha",
  "col.actions": "",
  "col.id": "ID",
  "col.date": "Data",
  "col.status": "Status",
  "col.document": "Documento",
  "col.phone": "Telefone",
  "col.city": "Cidade",
  "col.country": "País",
  "col.person": "Pessoa",
  "col.code": "Código",
  "col.unique": "Único",
  "col.initials": "Sigla",
  "col.division": "Divisão",
  "col.divisionRegion": "UF / departamento",
  "col.searchDocTypes": "Buscar código, nome, país...",
  "dashboard.stat.clientes": "Clientes",
  "dashboard.stat.clientesSub": "Papel cliente ativo",
  "dashboard.stat.fornecedores": "Fornecedores",
  "dashboard.stat.fornecedoresSub": "Papel fornecedor ativo",
  "dashboard.stat.estoque": "Produtos ativos",
  "dashboard.stat.estoqueSub": "Cadastro na filial",
  "dashboard.stat.vendasHoje": "Vendas hoje",
  "dashboard.stat.vendasHojeSub": "Total do dia",
  "dashboard.stat.produtos": "Produtos",
  "dashboard.stat.produtosSub": "Ativos na filial",
  "dashboard.stat.caixas": "Caixas abertos",
  "dashboard.stat.caixasSub": "Sessões em andamento",
  "dashboard.go.vendas": "Ir para vendas",
  "dashboard.go.caixa": "Ir para caixa",
  "dashboard.go.historico": "Histórico de vendas",
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
  "usuario.searchPlaceholder": "Nome, login, e-mail...",
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
  "pais.searchPlaceholder": "Nome, sigla...",
  "divisao.new": "Nova UF / departamento",
  "divisao.edit": "Editar UF / departamento",
  "divisao.error.required": "Informe país e nome",
  "divisao.siglaHint": "Opcional. Ex. MS. Deixe vazio para departamento.",
  "divisao.placeholderName": "Mato Grosso Do Sul",
  "divisao.searchPlaceholder": "Nome, sigla, país...",
  "cidade.new": "Nova cidade",
  "cidade.edit": "Editar cidade",
  "cidade.error.required": "Informe divisão e nome",
  "cidade.error.municipioRequired": "Informe o município do distrito",
  "cidade.listSearchPlaceholder": "Nome, município, divisão, país...",
  "cidade.placeholderName": "Ponta Porã",
  "cidade.selectDivision": "Selecione",
  "cidade.tipo": "Tipo",
  "cidade.tipo.municipio": "Município",
  "cidade.tipo.distrito": "Distrito",
  "cidade.municipio": "Município",
  "error.conflict.docUnique": "Já existe uma pessoa cadastrada com {tipo} {numero}",
  "error.conflict.docUnlinked": "Já existe uma pessoa com {tipo} {numero}, mas sem vínculo nesta filial — não aparece na venda até vincular",
  "error.conflict.docUnlinkedPreview": "Sem vínculo nesta filial — não aparece na venda até vincular",
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
  "api.LOGIN_RATE_LIMIT": "Muitas tentativas de login. Aguarde um minuto.",
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
  "api.PRODUTO_CODIGO_TAMANHO": "O código do produto deve ter no máximo 40 caracteres",
  "api.PRODUTO_NOME_OBRIGATORIO": "O nome do produto é obrigatório",
  "api.PRODUTO_NOME_TAMANHO": "O nome do produto deve ter no máximo 180 caracteres",
  "api.MODELO_MARCA_DIVERGENTE": "O modelo não pertence à marca selecionada",
  "api.MODELO_TIPO_DIVERGENTE": "O modelo não corresponde ao tipo selecionado",
  "api.MOTO_DADOS_OBRIGATORIOS": "Informe os dados da moto",
  "api.ANO_MODELO_ANTERIOR": "O ano modelo não pode ser anterior ao ano de fabricação",
  "api.ANO_FORA_FAIXA": "O ano deve estar entre {min} e {max}",
  "api.CHASSI_DUPLICADO": "Já existe uma moto com o chassi {chassi}",
  "api.CHASSI_OBRIGATORIO": "Informe ao menos um chassi",
  "api.CHASSI_INTERVALO_INVALIDO": "Intervalo de chassi inválido",
  "api.CHASSI_INTERVALO_GRANDE": "O intervalo não pode passar de {max} chassis",
  "api.UNIDADE_SO_MOTO": "Chassis só se aplicam a produtos que controlam chassis",
  "api.CHASSI_NAO_CONTROLADO": "Este produto não controla chassis",
  "api.CONTROLA_CHASSI_IMUTAVEL": "Não é possível alterar o controle de chassis",
  "api.UNIDADE_VENDIDA": "Não é possível excluir um chassi já vendido",
  "api.UNIDADE_OBRIGATORIA": "Informe o chassi da moto",
  "api.UNIDADE_REPETIDA": "Há chassis repetidos na venda",
  "api.UNIDADE_QTD": "A quantidade deve ser igual ao número de chassis",
  "api.UNIDADE_INVALIDA": "Chassi não encontrado",
  "api.UNIDADE_INDISPONIVEL": "Este chassi não está disponível",
  "api.ESTOQUE_QTD_CHASSI": "A quantidade deste produto vem dos chassis. Inclua no cadastro do produto.",
  "api.SERIE_QUADRO_DUPLICADA": "Já existe uma bicicleta com o número de série {serie}",
  "api.ESTOQUE_NOME_DUPLICADO": "Já existe um estoque com o nome {nome} nesta filial",
  "api.ESTOQUE_COM_PRODUTOS": "Não é possível excluir um estoque que possui produtos",
  "api.ESTOQUE_PRODUTO_DUPLICADO": "Este produto já está neste estoque",
  "api.ESTOQUE_NOME_OBRIGATORIO": "O nome do estoque é obrigatório",
  "api.ESTOQUE_PADRAO_OBRIGATORIO": "Marque outro estoque como padrão da venda",
  "api.ESTOQUE_PADRAO_INATIVO": "O estoque padrão da venda precisa estar ativo",
  "api.ESTOQUE_PADRAO_FILIAL": "O estoque padrão deve pertencer a esta filial",
  "api.ESTOQUE_NAO_PADRAO": "A venda usa só o estoque padrão da filial",
  "api.COTACAO_DIA_AUSENTE": "Informe a cotação do dia para vender, receber, pagar ou emitir fatura",
  "api.COTACAO_DIA_DUPLICADA": "Já existe cotação para {data}",
  "api.COTACAO_DATA_INVALIDA": "Data inválida. Use AAAA-MM-DD",
  "api.COTACAO_DATA_FUTURA": "Não é possível informar cotação de data futura",
  "api.COTACAO_TAXA_INVALIDA": "A taxa deve ser maior que zero",
  "api.COTACAO_SO_HOJE": "Só é possível editar a cotação do dia",
  "api.COTACAO_NAO_EXCLUI": "Não é possível excluir cotações. O histórico é permanente.",
  "api.SUDTAX_DESLIGADA": "Integração SudTax desligada. Ative sudtax.enabled e configure a API key.",
  "api.SUDTAX_URL": "Configure sudtax.baseUrl no application.yaml",
  "api.SUDTAX_API_KEY": "Configure sudtax.apiKey (sk_test_… / sk_live_…)",
  "api.SUDTAX_ERRO": "Erro ao chamar a SudTax",
  "api.SUDTAX_RESPOSTA": "Resposta inválida da SudTax",
  "api.FACTURA_NAO_PRONTA": "Venda não está pronta para faturar (verifique RUC do cliente e itens)",
  "api.FACTURA_SEM_SUDTAX": "Fatura sem vínculo SudTax",
  "api.FACTURA_CANCELADA": "Fatura cancelada não pode ser enviada",
  "api.DOCUMENTO_REFERENCIA_DUPLICADA": "Já existe documento na SudTax com esta referência",
  "api.ID_VENDA": "Informe a venda",
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
  "api.CAIXA_CONFERENCIA_FORA": "A conferência deve listar só os finalizadores e moedas que já têm lançamento",
  "api.CAIXA_TRANSFERENCIA_MESMO": "Origem e destino precisam ser caixas diferentes",
  "api.CAIXA_TRANSFERENCIA_FILIAL": "A transferência precisa ser na mesma filial",
  "api.CAIXA_DESTINO_FECHADO": "Abra o caixa de destino antes de transferir",
  "api.CAIXA_VALOR_INVALIDO": "O valor não pode ser negativo",
  "api.CAIXA_SALDO_INSUFICIENTE": "Saldo insuficiente para transferir",
  "api.CAIXA_LANCAMENTO_TIPO": "Tipo de lançamento inválido",
  "api.CAIXA_FINALIZADOR_INATIVO": "O finalizador não está ativo",
  "api.CAIXA_FINALIZADOR_SEM_AVULSO": "Este finalizador não permite lançamento avulso",
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
  "api.ORCAMENTO_VENCIDO": "O orçamento venceu. Confirme para converter com a cotação de hoje",
  "api.ORCAMENTO_VALIDADE": "Informe uma validade válida para o orçamento",
  "api.VENDA_GRAVACAO": "Informe se é venda, orçamento ou em aberto",
  "api.VENDA_NAO_ABERTA": "Só uma venda em aberto pode ser finalizada",
  "api.VENDA_NAO_CANCELAVEL": "Só um orçamento ou uma venda em aberto pode ser cancelada",
  "api.ORCAMENTO_CLIENTE": "Os orçamentos precisam ser do mesmo cliente",
  "api.ORCAMENTO_INDISPONIVEL": "Um dos orçamentos não está mais disponível",
  "api.ORCAMENTO_EM_USO": "Este orçamento já está em uma venda",
  "api.VENDA_DESCONTO_INVALIDO": "O desconto deve estar entre 0 e 100%",
  "api.VENDEDOR_INATIVO": "O vendedor não está ativo",
  "api.VENDEDOR_FILIAL": "O vendedor não tem acesso a esta filial",
  "api.VENDEDOR_INVALIDO": "Este usuário não pode ser vendedor da venda",
  "api.ESTOQUE_INSUFICIENTE": "Saldo insuficiente para vender",
  "api.ESTOQUE_FILIAL": "O estoque não pertence a esta filial",
  "api.ESTOQUE_PRODUTO_AUSENTE": "Produto sem saldo neste estoque",
  "api.PRODUTO_INATIVO": "O produto não está ativo",
  "api.PRODUTO_FOTO_TIPO": "Use uma foto JPG, PNG ou WEBP",
  "api.PRODUTO_FOTO_TAMANHO": "A foto deve ter no máximo 1,5 MB",
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
  "api.CIDADE_NOME_DUPLICADO": "Já existe uma cidade “{nome}” neste município ou divisão",
  "api.CIDADE_MUNICIPIO_OBRIGATORIO": "Informe o município do distrito",
  "api.CIDADE_MUNICIPIO_INVALIDO": "O município do distrito é inválido",
  "api.CIDADE_COM_DISTRITOS": "Não é possível excluir um município que possui distritos",
  "api.CIDADE_DISTRITO_SEDE": "A sede do município já é o próprio município",
  "api.DOCUMENTO_TIPO_CODIGO_DUPLICADO": "Já existe um tipo com o código {codigo} neste país",
  "api.DOCUMENTO_TIPO_EM_USO": "Tipo em uso por pessoas cadastradas e não pode ser excluído",
  "api.DOCUMENTO_OBRIGATORIO": "Informe pelo menos um documento",
  "api.TELEFONE_PAR": "Informe DDI e telefone juntos, ou deixe ambos vazios",
  "api.TELEFONE2_PAR": "Informe DDI e segundo telefone juntos, ou deixe ambos vazios",
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
  "empresa.perfilFiscal.hint": "Define o motor da fatura desta sucursal. Hoje só IVA paraguaio (0 / 5 / 10 %).",
  "empresa.error.required": "Preencha razão social, nome fantasia e RUC",
  "empresa.error.loadFailed": "Não foi possível carregar empresa e filiais",
  "empresa.error.saveFailed": "Não foi possível salvar",
  "empresa.error.deleteFailed": "Não foi possível excluir a filial",
  "empresa.confirmDeleteBranch": "Excluir esta filial?",
  "empresa.listClientsBranchOnly": "Listar só clientes desta filial",
  "empresa.listSuppliersBranchOnly": "Listar só fornecedores desta filial",
  "empresa.listProductsBranchOnly": "Listar só produtos desta filial",
  "empresa.moedaOperacao": "Moeda de operação",
  "empresa.estoquePadrao": "Estoque padrão da venda",
  "empresa.section.parametersMoeda": "Moeda",
  "produto.new": "Novo produto",
  "produto.edit": "Editar produto",
  "produto.codigo": "Código (SKU)",
  "produto.codigoSuggested": "sugerido",
  "produto.tipo": "Tipo",
  "produto.tipo.moto": "Moto elétrica",
  "produto.tipo.bicicleta": "Bicicleta elétrica",
  "produto.marca": "Marca",
  "produto.modelo": "Modelo",
  "produto.descricao": "Descrição",
  "produto.section.general": "Dados do produto",
  "produto.foto": "Foto",
  "produto.fotoHint": "Aparece na venda. Sem foto, continua o ícone.",
  "produto.fotoChoose": "Escolher foto",
  "produto.fotoRemove": "Remover foto",
  "produto.section.price": "Preço e IVA",
  "produto.section.estoque": "Estoque nesta filial",
  "produto.section.moto": "Ficha da moto",
  "produto.section.bicicleta": "Ficha da bicicleta",
  "produto.noStock": "Sem saldo nesta filial",
  "produto.qtyInicial": "Quantidade inicial",
  "produto.stockHint": "Quantidades se ajustam em Operação → Estoques.",
  "produto.stockHintChassi": "O saldo é o número de chassis disponíveis. Inclua ou remova chassis aqui.",
  "produto.controlaChassi": "Controla chassis",
  "produto.controlaChassiHint": "Ligado: estoque e venda por chassi. Desligado: por quantidade. Não muda depois de criar.",
  "produto.chassi": "Chassi",
  "produto.chassiLote": "Chassis",
  "produto.chassiLoteHint": "Um por linha, ou intervalo INÍCIO~FIM com til. Ex.: HD5BL2318SA063647~HD5BL2318SA063696",
  "produto.chassiLotePlaceholder": "HD5BL2318SA063647~HD5BL2318SA063696",
  "produto.chassiCount": "{n} chassis",
  "produto.chassiAdd": "Incluir chassis",
  "produto.chassiEmpty": "Nenhum chassi neste produto",
  "produto.chassiCodigo": "Cód. interno",
  "produto.situacao.disponivel": "Disponível",
  "produto.situacao.vendido": "Vendido",
  "produto.error.chassiIntervalo": "Intervalo inválido. Use o mesmo tamanho e o til (~).",
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
  "produto.error.nameRequired": "Informe o nome do produto",
  "produto.error.yearsRequired": "Informe ano de fabricação e ano modelo válidos",
  "produto.error.price": "Informe preço de lista e custo válidos (zero ou mais)",
  "produto.error.qty": "Informe uma quantidade inicial válida (zero ou mais)",
  "produto.iva": "IVA",
  "produto.currency": "Moeda",
  "produto.currency.usd": "Dólar (USD)",
  "produto.currency.pyg": "Guarani (PYG)",
  "produto.currency.brl": "Real (BRL)",
  "produto.listPrice": "Preço de lista",
  "produto.cost": "Custo",
  "produto.confirmLinkBranch": "O produto {codigo} já existe em {filiais}. Vincular a esta filial?",
  "produto.anoFabricacao": "Ano de fabricação",
  "produto.anoModelo": "Ano modelo",
  "produto.serieQuadro": "Nº de série do quadro",
  "produto.nomeRestore": "Usar marca e modelo",
  "produto.searchPlaceholder": "Código, nome, marca...",
  "marca.new": "Nova marca",
  "marca.searchPlaceholder": "Nome...",
  "marca.edit": "Editar marca",
  "marca.error.nameRequired": "Informe o nome da marca",
  "modelo.new": "Novo modelo",
  "modelo.edit": "Editar modelo",
  "modelo.error.required": "Informe marca e nome do modelo",
  "modelo.searchPlaceholder": "Nome, marca...",
  "estoque.new": "Novo estoque",
  "estoque.edit": "Editar estoque",
  "estoque.placeholderName": "Estoque Geral",
  "estoque.items": "Itens",
  "estoque.searchPlaceholder": "Nome...",
  "estoque.itemSearchPlaceholder": "Código, nome...",
  "estoque.itemNew": "Adicionar produto",
  "estoque.itemEdit": "Editar quantidade",
  "estoque.product": "Produto",
  "estoque.qty": "Quantidade",
  "estoque.reserved": "Reservada",
  "estoque.reservedHint": "Para venda em aberto. Disponível = quantidade − reservada.",
  "estoque.available": "Disponível",
  "estoque.unit": "un.",
  "estoque.backList": "Voltar para estoques",
  "estoque.backItems": "Voltar para os itens",
  "estoque.error.nameRequired": "Informe o nome do estoque",
  "estoque.error.productRequired": "Selecione o produto",
  "estoque.error.qtyInvalid": "Quantidade e reserva devem ser inteiros ≥ 0, e a reserva não pode ser maior que a quantidade",
  "estoque.qtyChassisHint": "A quantidade deste produto vem dos chassis. Inclua no cadastro do produto, guia Estoque.",
  "estoque.padraoBadge": "Padrão",
  "cotacao.new": "Nova cotação",
  "cotacao.edit": "Editar cotação",
  "cotacao.date": "Data",
  "cotacao.dateHint": "Só a cotação de hoje pode ser editada. O histórico não é excluído.",
  "cotacao.usdPyg": "USD → PYG",
  "cotacao.usdPygHint": "Guaranis por 1 dólar. Só números, sem ponto de milhar.",
  "cotacao.brlPyg": "BRL → PYG",
  "cotacao.brlPygHint": "Guaranis por 1 real. Só números, sem ponto de milhar.",
  "cotacao.rateExample": "Exemplo de lançamento: digite 1000 (não 1.000). Assim 1 US$ = 1000 Gs. neste exemplo.",
  "cotacao.ratePlaceholder": "1000",
  "cotacao.error.required": "Informe a data da cotação",
  "cotacao.error.rate": "Informe as duas taxas, maiores que zero",
  "cotacao.searchPlaceholder": "Data...",
  "cotacao.banner.missing": "Sem cotação do dia. Vendas, recebimentos, pagamentos e faturas eletrônicas ficam bloqueados.",
  "cotacao.banner.wait": "Sem cotação do dia. Aguarde um administrador ou gestor informar as taxas para liberar vendas e faturas.",
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
  "finalizador.geraReceber": "Gera contas a receber",
  "finalizador.geraReceberHint": "Na venda, esta forma abre o parcelamento e não entra no caixa na hora.",
  "finalizador.geraPagar": "Gera contas a pagar",
  "finalizador.geraPagarHint": "Para nota de entrada futura. Não use na liquidação de parcela.",
  "finalizador.fundoTroco": "Fundo de troco / saldo de abertura",
  "finalizador.fundoTrocoHint": "Aparece na abertura do caixa e aceita saldo nas três moedas (Gs., US$, R$).",
  "finalizador.permiteAvulso": "Permite lançamento avulso",
  "finalizador.permiteAvulsoHint": "Pode ser usado em suprimento ou sangria na sessão de caixa.",
  "finalizador.section.params": "Parâmetros",
  "finalizador.chip.troco": "Troco",
  "finalizador.chip.avulso": "Avulso",
  "finalizador.chip.receber": "CR",
  "finalizador.chip.pagar": "CP",
  "finalizador.error.nameRequired": "Informe o nome do finalizador",
  "finalizador.searchPlaceholder": "Nome...",
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
  "caixa.disponivel": "Disponível",
  "caixa.transferEmpty": "Não há saldo neste caixa para transferir.",
  "caixa.user": "Usuário",
  "caixa.amount": "Valor",
  "caixa.movementType": "Tipo",
  "caixa.default": "Padrão",
  "caixa.error.nameRequired": "Informe o nome do caixa",
  "caixa.searchPlaceholder": "Nome...",
  "caixa.error.conferencia": "Informe a conferência de fechamento",
  "caixa.error.destino": "Selecione o caixa de destino",
  "caixa.error.valor": "Informe ao menos um valor",
  "caixa.error.noneClosed": "Não há caixa fechado para abrir",
  "caixa.error.noFundoTroco": "Nenhum finalizador marcado como fundo de troco. Cadastre em Finalizadores.",
  "caixa.error.noAvulso": "Nenhum finalizador permite lançamento avulso. Marque em Finalizadores → Parâmetros.",
  "caixa.error.lancamento": "Informe tipo, finalizador e valor",
  "caixa.lancamento": "Lançamento",
  "caixa.lancamento.tipo": "Tipo",
  "caixa.lancamento.suprimento": "Suprimento (entrada)",
  "caixa.lancamento.sangria": "Sangria (saída)",
  "caixa.lancamento.valor": "Valor",
  "caixa.addFinalizer": "+ Adicionar outro finalizador",
  "caixa.addCurrency": "+ Adicionar moeda",
  "caixa.conferenciaHint": "Digite só números. Gs.: 100000 · US$/R$: 2000 ou 2000,50 — sem ponto de milhar.",
  "caixa.conferenciaLock": "Só entram finalizadores e moedas que já têm lançamento. Falta ou sobra se ajusta em Lançamento, antes de fechar.",
  "caixa.conferenciaEmpty": "Nenhum lançamento neste caixa. Dá para fechar assim, ou lançar antes se precisar.",
  "caixa.removeLine": "Remover",
  "caixa.include": "Incluir",
  "caixa.informed": "Informado",
  "caixa.difference": "Diferença",
  "caixa.summary": "Resumo",
  "caixa.fundoTroco": "Fundo de troco",
  "caixa.ok": "Bateu",
  "caixa.shortage": "Falta",
  "caixa.surplus": "Sobra",
  "caixa.mov.abertura": "Abertura",
  "caixa.mov.fechamento": "Fechamento",
  "caixa.mov.venda": "Venda",
  "caixa.mov.transferencia_saida": "Transferência (saída)",
  "caixa.mov.transferencia_entrada": "Transferência (entrada)",
  "caixa.mov.suprimento": "Suprimento",
  "caixa.mov.sangria": "Sangria",
  "caixa.mov.recebimento": "Recebimento",
  "caixa.mov.pagamento": "Pagamento",
  "venda.new": "Nova venda",
  "venda.view": "Venda",
  "venda.status.finalizada": "Finalizada",
  "venda.status.cancelada": "Cancelada",
  "venda.status.aberta": "Em aberto",
  "venda.status.orcamento": "Orçamento",
  "venda.status.orcamentoVencido": "Orçamento vencido",
  "venda.status.utilizada": "Utilizado",
  "venda.gerarVenda": "Gerar venda",
  "venda.retomar": "Retomar venda",
  "venda.cancelarOrcamento": "Cancelar orçamento",
  "venda.cancelarAberta": "Cancelar venda",
  "venda.trazerOrcamentos": "Trazer orçamentos",
  "venda.mesclarOrcamentos": "Mesclar orçamentos",
  "venda.clienteTemOrcamentos": "Este cliente tem {n} orçamento(s) em aberto",
  "venda.incluirOrcamentos": "Incluir na venda",
  "venda.semOrcamentos": "Nenhum orçamento deste cliente",
  "venda.emAberto": "Em aberto #{n}",
  "venda.confirmCancelar": "Cancelar este documento? Ele não poderá ser usado depois.",
  "venda.orcamentoCliente": "Selecione orçamentos do mesmo cliente",
  "venda.orcamentosSelecionados": "{n} orçamentos",
  "venda.utilizadaEm": "Venda #{n}",
  "venda.orcamentoNaVenda": "Incluído na venda #{n}",
  "venda.filtro.todos": "Todos",
  "venda.filtro.aberta": "Em aberto",
  "venda.filtro.orcamento": "Orçamento",
  "venda.filtro.finalizada": "Finalizada",
  "venda.filtro.cancelada": "Cancelada",
  "venda.filtro.utilizada": "Utilizado",
  "venda.documentoEletronico": "Documento eletrônico (SudTax)",
  "venda.montarJsonSudtax": "Montar JSON",
  "venda.copiarJsonSudtax": "Copiar JSON",
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
  "venda.amount": "Valor",
  "venda.currency.pyg": "Gs.",
  "venda.currency.usd": "US$",
  "venda.currency.brl": "R$",
  "venda.equivalent": "Equivale a Gs. {n}",
  "venda.addPay": "+ outra forma",
  "venda.finish": "Finalizar venda",
  "venda.goPay": "Ir para pagamento",
  "venda.backItems": "Voltar aos itens",
  "venda.seller": "Vendedor",
  "venda.changeSeller": "Trocar",
  "venda.sellerSearchPlaceholder": "Nome do usuário",
  "venda.searchPlaceholder": "Número, cliente, vendedor ou data",
  "venda.error.seller": "Selecione o vendedor",
  "venda.error.product": "Selecione um produto",
  "venda.error.qty": "Informe uma quantidade válida",
  "venda.error.client": "Selecione o cliente",
  "venda.error.items": "Adicione ao menos um item",
  "venda.error.pay": "Informe o pagamento",
  "venda.parcelas": "Parcelas do crediário",
  "venda.parcelasEmpty": "Informe a quantidade para ver os vencimentos",
  "venda.qtdParcelas": "Quantidade de parcelas",
  "venda.modoVencimento": "Vencimentos",
  "venda.diaVencimento": "Dia do mês",
  "venda.modo.intervalo30": "A cada 30 dias",
  "venda.modo.diaFixo": "Dia fixo do mês",
  "titulo.receber.new": "Novo título a receber",
  "titulo.pagar.new": "Novo título a pagar",
  "titulo.moeda": "Moeda",
  "titulo.valor": "Valor",
  "titulo.saldo": "Saldo",
  "titulo.vencimento": "Vencimento",
  "titulo.baixar": "Baixar",
  "titulo.receberSelecionadas": "Receber selecionadas",
  "titulo.pagarSelecionadas": "Pagar selecionadas",
  "titulo.selecionadas": "Selecionadas",
  "titulo.selecionarTodas": "Selecionar todas as parcelas abertas",
  "titulo.cotacaoTravada": "Cotação travada",
  "titulo.fifoHint": "Se o valor for menor que o saldo, quita primeiro as parcelas com vencimento mais próximo.",
  "titulo.filtro.abertos": "Abertos",
  "titulo.filtro.quitados": "Quitados",
  "titulo.filtro.abertas": "Abertas",
  "titulo.filtro.pagas": "Pagas",
  "titulo.filtro.parciais": "Parciais",
  "titulo.filtro.vazio": "Nenhuma parcela neste filtro",
  "titulo.desconto": "Desconto",
  "titulo.acrescimo": "Acréscimo",
  "titulo.quitaSaldo": "Quita o saldo de",
  "titulo.ajusteValor": "Para quitar com este ajuste, o valor tem de ser",
  "titulo.searchPlaceholder": "Cliente, status...",
  "titulo.error.cliente": "Selecione o cliente",
  "titulo.error.fornecedor": "Selecione o fornecedor",
  "titulo.error.valor": "Informe um valor válido",
  "titulo.error.selecioneParcelas": "Selecione ao menos uma parcela",
  "titulo.status.aberto": "Aberto",
  "titulo.status.parcial": "Parcial",
  "titulo.status.quitado": "Quitado",
  "titulo.status.cancelado": "Cancelado",
  "titulo.parcela.aberta": "Aberta",
  "titulo.parcela.parcial": "Parcial",
  "titulo.parcela.paga": "Paga",
  "titulo.parcela.cancelada": "Cancelada",
  "entrada.new": "Nova entrada de nota",
  "entrada.documento": "Documento",
  "entrada.tipoDocumento": "Tipo",
  "entrada.tipo.py_factura": "Fatura Paraguai",
  "entrada.tipo.exterior": "Exterior / China",
  "entrada.dataEmissao": "Data de emissão",
  "entrada.timbrado": "Timbrado",
  "entrada.establecimiento": "Establecimiento",
  "entrada.punto": "Punto de expedición",
  "entrada.numero": "Número",
  "entrada.cdc": "CDC",
  "entrada.numeroDocumento": "Nº invoice / packing list",
  "entrada.incoterm": "Incoterm",
  "entrada.itens": "Itens",
  "entrada.addItem": "Adicionar item",
  "entrada.valorUnitario": "Valor unitário",
  "entrada.chassisHint": "Chassis (um por linha ou INICIO~FIM)",
  "entrada.prazo": "prazo",
  "entrada.total": "Total",
  "entrada.tituloGerado": "Título a pagar",
  "entrada.searchPlaceholder": "Fornecedor, documento...",
  "entrada.error.itens": "Informe ao menos um item",
  "entrada.error.pagamento": "Informe ao menos uma forma de pagamento",
  "api.VENDA_CREDITO_UNICO": "Use só uma forma a prazo por venda",
  "api.PARCELAS_QTD": "Informe entre 1 e 120 parcelas",
  "api.DIA_VENCIMENTO_INVALIDO": "O dia de vencimento deve ser entre 1 e 28",
  "api.PARCELAS_OBRIGATORIAS": "Informe as parcelas do crediário",
  "api.FINALIZADOR_NAO_LIQUIDA": "Use uma forma de caixa para liquidar a parcela",
  "api.BAIXA_SEM_PARCELA": "Selecione ao menos uma parcela",
  "api.BAIXA_TITULO_MISTO": "Selecione parcelas do mesmo título",
  "api.BAIXA_CLIENTE_MISTO": "Não é possível misturar clientes no mesmo recebimento",
  "api.BAIXA_FORNECEDOR_MISTO": "Não é possível misturar fornecedores no mesmo pagamento",
  "api.BAIXA_MAIOR_SALDO": "O valor não pode exceder o saldo das parcelas selecionadas",
  "api.BAIXA_VALOR_AJUSTE": "Com desconto ou acréscimo, o valor tem de quitar o saldo selecionado",
  "api.BAIXA_DESCONTO_MAIOR": "O desconto não pode exceder o saldo",
  "api.BAIXA_AJUSTE_INVALIDO": "Desconto e acréscimo não podem ser negativos",
  "api.PARCELA_JA_PAGA": "A parcela já está quitada",
  "api.ENTRADA_PY_DUPLICADA": "Esta fatura já foi lançada para o fornecedor",
  "api.ENTRADA_PY_CAMPOS": "Informe timbrado, establecimiento, punto e número",
  "api.ENTRADA_EXTERIOR_NUMERO": "Informe o número do documento / packing list",
  "api.ENTRADA_NEGOCIACAO_DIVERGENTE": "A soma das formas de pagamento deve igualar o total",
  "venda.clientSearch": "Buscar cliente",
  "venda.clientSearchPlaceholder": "Nome ou documento",
  "venda.changeClient": "Trocar",
  "venda.productSearch": "Produto / SKU",
  "venda.productSearchPlaceholder": "Código, nome, marca, modelo ou chassi — Enter lança",
  "venda.emptyCart": "Sua venda está vazia",
  "venda.emptyHint": "Clique em um produto ou busque pelo código. Na moto, escolha o chassi.",
  "venda.clear": "Limpar venda",
  "venda.clienteRapido.title": "Novo cliente",
  "venda.clienteRapido.hint": "Cadastro rápido para concluir a venda sem sair do PDV",
  "venda.clienteRapido.new": "Cadastrar novo cliente",
  "venda.hold": "Deixar em aberto",
  "venda.heldCount": "{n} em espera",
  "venda.heldNoClient": "Sem cliente",
  "venda.open": "Em aberto",
  "venda.openEmpty": "Nenhuma",
  "venda.summary": "Resumo",
  "venda.seeSummary": "Ver resumo",
  "venda.discardConfirm": "Há uma venda em andamento. Deseja descartá-la?",
  "venda.filter.all": "Todos",
  "venda.units": "{n} un.",
  "venda.vitrineMore": "Mostrando {n} de {total}. Busque pelo código ou nome.",
  "venda.pickChassis": "Escolha o chassi",
  "venda.chassisSearchPlaceholder": "Leia ou digite o chassi — Enter confirma",
  "venda.chassisDone": "Pronto",
  "venda.noChassis": "Não há chassis disponíveis deste produto",
  "venda.error.chassisRequired": "Escolha o chassi da moto",
  "venda.chassisMore": "+{n}",
  "venda.chassisInCart": "{n} no carrinho",
  "venda.discount": "Desconto",
  "venda.saleDiscount": "Desconto da venda",
  "venda.remainingValue": "Valor restante",
  "venda.payAmount": "Valor para finalizar",
  "venda.finalizerSearch": "Buscar finalizador",
  "venda.recibo.title": "Recibo de venda",
  "venda.recibo.print": "Imprimir",
  "venda.recibo.footer": "Documento não fiscal — comprovante interno",
  "venda.dav.titulo": "DAV - DOCUMENTO AUXILIAR DE VENDA - PEDIDO",
  "venda.dav.aviso": "NÃO É DOCUMENTO FISCAL - NÃO É VÁLIDO COMO RECIBO E COMO GARANTIA DE MERCADORIA",
  "venda.dav.pagamento": "NÃO COMPROVA PAGAMENTO",
  "venda.dav.tituloOrcamento": "ORÇAMENTO",
  "venda.dav.tituloAberta": "PEDIDO EM ABERTO",
  "venda.dav.endereco": "Endereço",
  "venda.dav.telefone": "Telefone",
  "venda.dav.concordo": "Concordo com os valores expressos neste documento",
  "venda.validade": "Validade",
  "venda.salvarOrcamento": "Salvar orçamento",
  "venda.deixarAberto": "Deixar em aberto",
  "venda.continuar": "Continuar",
  "venda.continuando": "Continuando #{n}",
  "venda.confirmVencido": "Este orçamento venceu. Converter em venda com a cotação de hoje?",
  "venda.subtotal": "Subtotal",
  "venda.paid": "Pago",
  "venda.remaining": "Falta",
  "venda.noTill": "Nenhum caixa padrão para este usuário",
  "venda.tillClosed": "Caixa padrão fechado",
  "venda.changeTill": "Trocar",
  "venda.definePay": "Definir pagamento",
  "venda.payEmpty": "Nenhuma forma definida",
  "venda.confirmPay": "Confirmar",
  "venda.payOver": "O valor passa do restante",
  "venda.change": "Troco",
  "venda.due": "Vencimento",
  "venda.unit": "Unit.",
  "venda.itemsCount": "{n} itens",
  "usuario.caixas": "Caixas",
  "usuario.caixaPadrao": "Caixa padrão",
  "empresa.branchParameters": "Parâmetros da filial",
  "empresa.section.parametersListagem": "Listagem",
  "empresa.seed.title": "Dados de teste",
  "empresa.seed.hint": "Preenche a filial principal para teste: marcas, modelos, 13 produtos com estoque, 8 clientes, 3 fornecedores, caixa extra, depósito extra e 3 vendas. Usuários demo.operador e demo.vendedor (senha demo12345) para testar o PDV. Dá para ligar e desligar. Não apaga o Caixa 1 nem Dinheiro, Cartão e Depósito.",
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
  "nav.group.vendas": "Ventas",
  "nav.group.financeiro": "Caja y finanzas",
  "nav.group.catalogo": "Catálogo",
  "nav.group.pessoas": "Personas",
  "nav.group.configuracao": "Configuración",
  "nav.group.localidade": "Localidad",
  "nav.group.relatorios": "Informes",
  "nav.relatorioReceber": "Cuentas por cobrar",
  "nav.relatorioPagar": "Cuentas por pagar",
  "nav.relatorioVendas": "Ventas",
  "nav.relatorioEstoque": "Stock",
  "nav.relatorioCaixa": "Movimientos de caja",
  "relatorio.vendas": "Ventas",
  "relatorio.receber": "A cobrar",
  "relatorio.pagar": "A pagar",
  "relatorio.estoque": "Stock",
  "relatorio.posicao": "Posición",
  "relatorio.parcelas": "Cuotas",
  "relatorio.baixas": "Bajas",
  "relatorio.movimentos": "Movimientos",
  "relatorio.de": "Desde",
  "relatorio.ate": "Hasta",
  "relatorio.total": "Total",
  "relatorio.registros": "{n} registros",
  "relatorio.movimentoInicio": "El historial empieza el día en que el registro pasó a existir. Los movimientos anteriores no se reconstruyen.",
  "relatorio.tipo": "Tipo",
  "relatorio.tipo.venda": "Venta",
  "relatorio.tipo.entrada": "Entrada",
  "relatorio.tipo.ajuste": "Ajuste",
  "relatorio.atraso": "Atraso",
  "relatorio.saldoDepois": "Saldo después",
  "relatorio.anterior": "Anterior",
  "relatorio.saida": "Salida",
  "relatorio.saldoEstoque": "Stock",
  "relatorio.comSaldo": "Con saldo",
  "relatorio.todosSaldos": "Todos",
  "relatorio.finalizador": "Forma de pago",
  "relatorio.dias": "{n} d",
  "relatorio.pdf": "PDF",
  "relatorio.excel": "Excel",
  "relatorio.exportar": "Exportar",
  "relatorio.agrupar": "Agrupar",
  "relatorio.agrupar.nenhum": "Sin agrupamiento",
  "relatorio.agrupar.cliente": "Por cliente",
  "relatorio.agrupar.fornecedor": "Por proveedor",
  "relatorio.agrupar.vencimento": "Por vencimiento",
  "relatorio.nominal": "Nominal",
  "relatorio.cotacao": "Cotización",
  "relatorio.parcela": "Cuota",
  "relatorio.documento": "Doc.",
  "relatorio.venda": "Venta",
  "relatorio.vencidas": "Vencidas",
  "relatorio.busca.receber": "Cliente, venta o cuota",
  "relatorio.busca.pagar": "Proveedor o cuota",
  "relatorio.busca.baixasReceber": "Cliente o forma de pago",
  "relatorio.busca.baixasPagar": "Proveedor o forma de pago",
  "relatorio.busca.vendas": "Número, cliente o vendedor",
  "relatorio.busca.estoque": "Código, nombre o stock",
  "relatorio.busca.movimentos": "Código, nombre, stock u observación",
  "relatorio.busca.caixa": "Caja, usuario, tipo, observación o venta",
  "relatorio.caixa": "Caja",
  "relatorio.legendaGs": "Los cálculos consideran la cotización del día de cada cuota.",
  "relatorio.legendaGsPagar": "Los cálculos consideran la cotización del día de cada cuota.",
  "relatorio.emAberto": "En abierto",
  "relatorio.recebidos": "Cobrados",
  "relatorio.pagos": "Pagados",
  "relatorio.recebido": "Cobrado",
  "relatorio.saldo": "Saldo",
  "relatorio.totalDia": "Total del día",
  "relatorio.situacao": "Situación",
  "relatorio.somenteAbertos": "Solo abiertos",
  "relatorio.periodo": "Período",
  "relatorio.periodo.todas": "Todas",
  "relatorio.periodo.emissao": "Emisión",
  "relatorio.periodo.vencimento": "Vencimiento",
  "relatorio.periodo.recebimento": "Cobro",
  "relatorio.periodo.pagamento": "Pago",
  "relatorio.fechamento": "Fecha de cierre",
  "relatorio.periodoInvalido": "Indique la fecha inicial y la final. La inicial no puede ser posterior a la final.",
  "estoque.ajusteObs": "Observación del ajuste",
  "produto.movimentos": "Movimientos",
  "produto.movimentosEmpty": "Todavía no hay movimientos de este producto. El registro empieza a partir de ahora.",
  "nav.dashboard": "Panel",
  "nav.clientes": "Clientes",
  "nav.fornecedores": "Proveedores",
  "nav.produtos": "Productos",
  "nav.marcas": "Marcas",
  "nav.modelos": "Modelos",
  "nav.estoques": "Depósitos",
  "nav.cotacoes": "Cotizaciones",
  "nav.contasReceber": "Cuentas por cobrar",
  "nav.contasPagar": "Cuentas por pagar",
  "nav.entradaNota": "Entrada de nota",
  "nav.facturas": "Facturas",
  "factura.emitir": "Emitir factura",
  "factura.escolherVenda": "Venta",
  "factura.selecioneVenda": "Seleccione una venta…",
  "factura.semVendasElegiveis": "No hay ventas finalizadas sin factura en esta sucursal.",
  "factura.enviarAposCriar": "Enviar a la SET / simulador después de crear",
  "factura.searchPlaceholder": "Cliente, CDC, venta, estado…",
  "factura.venda": "Venta",
  "factura.cliente": "Cliente",
  "factura.estado": "Estado",
  "factura.estado.pendente": "Pendiente",
  "factura.estado.processando": "Procesando",
  "factura.estado.aprobado": "Aprobado",
  "factura.estado.rechazado": "Rechazado",
  "factura.estado.cancelado": "Cancelado",
  "factura.cdc": "CDC",
  "factura.total": "Total",
  "factura.data": "Fecha",
  "factura.fichaTitle": "Factura electrónica",
  "factura.status": "Estado SudTax",
  "factura.referencia": "Referencia",
  "factura.sudtaxId": "ID SudTax",
  "factura.atualizado": "Actualizado",
  "factura.payload": "Payload enviado",
  "factura.enviar": "Enviar a la SET",
  "factura.consultar": "Actualizar estado",
  "factura.error.vendaObrigatoria": "Seleccione la venta",
  "nav.finalizadores": "Finalizadores",
  "nav.caixas": "Cajas",
  "nav.caixa": "Caja del día",
  "nav.vendas": "Ventas",
  "nav.orcamentos": "Presupuesto",
  "nav.historico": "Historial",
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
  "common.saveAndNew": "Guardar y nuevo",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Eliminar",
  "common.search": "Buscar...",
  "common.f2Search": "F2 buscar",
  "searchModal.hint": "Enter confirma · Esc cierra · ↑↓ navega",
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
  "filter.status.label": "Filtrar por estado",
  "filter.status.all": "Todos",
  "filter.status.active": "Activos",
  "filter.status.inactive": "Inactivos",
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
  "form.tab.data": "Datos",
  "form.tab.address": "Direcciones",
  "form.tab.document": "Documento",
  "produto.tab.cadastro": "Registro",
  "produto.tab.ficha": "Ficha técnica",
  "papel.name": "Nombre / razón social",
  "papel.namePlaceholder": "Nombre completo",
  "papel.personType": "Tipo de persona",
  "papel.personType.fisica": "Persona física",
  "papel.personType.juridica": "Persona jurídica",
  "papel.streetType": "Tipo",
  "papel.streetTypePlaceholder": "Calle",
  "papel.streetTypeEmpty": "—",
  "streetType.rua": "Calle",
  "streetType.avenida": "Avenida",
  "streetType.alameda": "Alameda",
  "streetType.travessa": "Travesía",
  "streetType.praca": "Plaza",
  "streetType.rodovia": "Ruta",
  "streetType.estrada": "Camino",
  "streetType.passagem": "Pasaje",
  "streetType.vila": "Villa",
  "streetType.beco": "Callejón",
  "streetType.condominio": "Condominio",
  "streetType.fazenda": "Estancia",
  "streetType.sitio": "Sitio",
  "streetType.chacara": "Chacra",
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
  "papel.useExisting": "Usar registro existente",
  "papel.openExisting": "Abrir registro",
  "papel.registeredBranches": "Sucursales con registro",
  "papel.confirmLinkBranch": "Confirmar vínculo en esta sucursal",
  "papel.linkToBranch": "Vincular a esta sucursal",
  "papel.conflict.linkBranch": "{nome} ya está registrado en {filiais}. ¿Vincular también en {filialAlvo}?",
  "papel.viewExisting": "Ver registro",
  "papel.existingPreviewTitle": "Registro existente",
  "papel.alreadyCliente": "Ya es cliente",
  "papel.alreadyFornecedor": "Ya es proveedor",
  "papel.loadExistingFailed": "No se pudo cargar el registro",
  "papel.searchPlaceholder": "Nombre, documento, ciudad...",
  "papel.error.nameRequired": "Indique el nombre / razón social",
  "papel.error.phonePair": "Indique DDI y teléfono juntos, o deje ambos vacíos",
  "papel.error.phone2Pair": "Indique DDI y segundo teléfono juntos, o deje ambos vacíos",
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
  "ddi.searchModalTitle": "Buscar país / DDI",
  "ddi.noPhone": "— Sin teléfono",
  "ddi.other": "Otro (DDI manual)",
  "ddi.otherManual": "Otro — indique el DDI",
  "ddi.phonePlaceholder": "Número",
  "ddi.phone": "Teléfono",
  "ddi.phone2": "Teléfono 2",
  "cidade.searchPlaceholder": "Buscar ciudad…",
  "cidade.searchInputPlaceholder": "Nombre, UF o país…",
  "cidade.searchModalTitle": "Buscar ciudad",
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
  "ficha.tab.dados": "Datos",
  "ficha.tab.estoque": "Stock",
  "ficha.tab.movimentacao": "Movimiento",
  "ficha.stockLog": "Movimientos",
  "papel.actionsMenu": "Acciones",
  "papel.viewSheet": "Ver ficha",
  "col.actions": "",
  "col.id": "ID",
  "col.date": "Fecha",
  "col.status": "Estado",
  "col.document": "Documento",
  "col.phone": "Teléfono",
  "col.city": "Ciudad",
  "col.country": "País",
  "col.person": "Persona",
  "col.code": "Código",
  "col.unique": "Único",
  "col.initials": "Sigla",
  "col.division": "División",
  "col.divisionRegion": "UF / departamento",
  "col.searchDocTypes": "Buscar código, nombre, país...",
  "dashboard.stat.clientes": "Clientes",
  "dashboard.stat.clientesSub": "Rol cliente activo",
  "dashboard.stat.fornecedores": "Proveedores",
  "dashboard.stat.fornecedoresSub": "Rol proveedor activo",
  "dashboard.stat.estoque": "Productos activos",
  "dashboard.stat.estoqueSub": "Registro en la sucursal",
  "dashboard.stat.vendasHoje": "Ventas hoy",
  "dashboard.stat.vendasHojeSub": "Total del día",
  "dashboard.stat.produtos": "Productos",
  "dashboard.stat.produtosSub": "Activos en la sucursal",
  "dashboard.stat.caixas": "Cajas abiertas",
  "dashboard.stat.caixasSub": "Sesiones en curso",
  "dashboard.go.vendas": "Ir a ventas",
  "dashboard.go.caixa": "Ir a caja",
  "dashboard.go.historico": "Historial de ventas",
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
  "usuario.searchPlaceholder": "Nombre, usuario, correo...",
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
  "pais.searchPlaceholder": "Nombre, sigla...",
  "divisao.new": "Nueva UF / departamento",
  "divisao.edit": "Editar UF / departamento",
  "divisao.error.required": "Indique país y nombre",
  "divisao.siglaHint": "Opcional. Ej. MS. Deje vacío para departamento.",
  "divisao.placeholderName": "Mato Grosso Do Sul",
  "divisao.searchPlaceholder": "Nombre, sigla, país...",
  "cidade.new": "Nueva ciudad",
  "cidade.edit": "Editar ciudad",
  "cidade.error.required": "Indique división y nombre",
  "cidade.error.municipioRequired": "Indique el municipio del distrito",
  "cidade.listSearchPlaceholder": "Nombre, municipio, división, país...",
  "cidade.placeholderName": "Ponta Porã",
  "cidade.selectDivision": "Seleccione",
  "cidade.tipo": "Tipo",
  "cidade.tipo.municipio": "Municipio",
  "cidade.tipo.distrito": "Distrito",
  "cidade.municipio": "Municipio",
  "error.conflict.docUnique": "Ya existe una persona registrada con {tipo} {numero}",
  "error.conflict.docUnlinked": "Ya existe una persona con {tipo} {numero}, pero sin vínculo en esta sucursal — no aparece en la venta hasta vincular",
  "error.conflict.docUnlinkedPreview": "Sin vínculo en esta sucursal — no aparece en la venta hasta vincular",
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
  "api.LOGIN_RATE_LIMIT": "Demasiados intentos de acceso. Espere un minuto.",
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
  "api.PRODUTO_CODIGO_TAMANHO": "El código del producto debe tener como máximo 40 caracteres",
  "api.PRODUTO_NOME_OBRIGATORIO": "El nombre del producto es obligatorio",
  "api.PRODUTO_NOME_TAMANHO": "El nombre del producto debe tener como máximo 180 caracteres",
  "api.MODELO_MARCA_DIVERGENTE": "El modelo no pertenece a la marca seleccionada",
  "api.MODELO_TIPO_DIVERGENTE": "El modelo no corresponde al tipo seleccionado",
  "api.MOTO_DADOS_OBRIGATORIOS": "Indique los datos de la moto",
  "api.ANO_MODELO_ANTERIOR": "El año modelo no puede ser anterior al año de fabricación",
  "api.ANO_FORA_FAIXA": "El año debe estar entre {min} y {max}",
  "api.CHASSI_DUPLICADO": "Ya existe una moto con el chasis {chassi}",
  "api.CHASSI_OBRIGATORIO": "Indique al menos un chasis",
  "api.CHASSI_INTERVALO_INVALIDO": "Intervalo de chasis inválido",
  "api.CHASSI_INTERVALO_GRANDE": "El intervalo no puede superar {max} chasis",
  "api.UNIDADE_SO_MOTO": "Los chasis solo se aplican a productos que controlan chasis",
  "api.CHASSI_NAO_CONTROLADO": "Este producto no controla chasis",
  "api.CONTROLA_CHASSI_IMUTAVEL": "No es posible cambiar el control de chasis",
  "api.UNIDADE_VENDIDA": "No se puede eliminar un chasis ya vendido",
  "api.UNIDADE_OBRIGATORIA": "Indique el chasis de la moto",
  "api.UNIDADE_REPETIDA": "Hay chasis repetidos en la venta",
  "api.UNIDADE_QTD": "La cantidad debe ser igual al número de chasis",
  "api.UNIDADE_INVALIDA": "Chasis no encontrado",
  "api.UNIDADE_INDISPONIVEL": "Este chasis no está disponible",
  "api.ESTOQUE_QTD_CHASSI": "La cantidad de este producto sale de los chasis. Inclúyalos en el registro del producto.",
  "api.SERIE_QUADRO_DUPLICADA": "Ya existe una bicicleta con el número de serie {serie}",
  "api.ESTOQUE_NOME_DUPLICADO": "Ya existe un depósito con el nombre {nome} en esta sucursal",
  "api.ESTOQUE_COM_PRODUTOS": "No se puede eliminar un depósito que tiene productos",
  "api.ESTOQUE_PRODUTO_DUPLICADO": "Este producto ya está en este depósito",
  "api.ESTOQUE_NOME_OBRIGATORIO": "El nombre del depósito es obligatorio",
  "api.ESTOQUE_PADRAO_OBRIGATORIO": "Marque otro depósito como estándar de la venta",
  "api.ESTOQUE_PADRAO_INATIVO": "El depósito estándar de la venta debe estar activo",
  "api.ESTOQUE_PADRAO_FILIAL": "El depósito estándar debe pertenecer a esta sucursal",
  "api.ESTOQUE_NAO_PADRAO": "La venta usa solo el depósito estándar de la sucursal",
  "api.COTACAO_DIA_AUSENTE": "Indique la cotización del día para vender, cobrar, pagar o emitir factura",
  "api.COTACAO_DIA_DUPLICADA": "Ya existe cotización para {data}",
  "api.COTACAO_DATA_INVALIDA": "Fecha inválida. Use AAAA-MM-DD",
  "api.COTACAO_DATA_FUTURA": "No es posible informar cotización de fecha futura",
  "api.COTACAO_TAXA_INVALIDA": "La tasa debe ser mayor que cero",
  "api.COTACAO_SO_HOJE": "Solo es posible editar la cotización del día",
  "api.COTACAO_NAO_EXCLUI": "No es posible eliminar cotizaciones. El historial es permanente.",
  "api.SUDTAX_DESLIGADA": "Integración SudTax desactivada. Active sudtax.enabled y configure la API key.",
  "api.SUDTAX_URL": "Configure sudtax.baseUrl en application.yaml",
  "api.SUDTAX_API_KEY": "Configure sudtax.apiKey (sk_test_… / sk_live_…)",
  "api.SUDTAX_ERRO": "Error al llamar a SudTax",
  "api.SUDTAX_RESPOSTA": "Respuesta inválida de SudTax",
  "api.FACTURA_NAO_PRONTA": "La venta no está lista para facturar (verifique RUC del cliente e ítems)",
  "api.FACTURA_SEM_SUDTAX": "Factura sin vínculo SudTax",
  "api.FACTURA_CANCELADA": "Factura cancelada no puede enviarse",
  "api.DOCUMENTO_REFERENCIA_DUPLICADA": "Ya existe documento en SudTax con esta referencia",
  "api.ID_VENDA": "Indique la venta",
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
  "api.CAIXA_CONFERENCIA_FORA": "El conteo debe listar solo los finalizadores y monedas que ya tienen movimiento",
  "api.CAIXA_TRANSFERENCIA_MESMO": "Origen y destino deben ser cajas distintas",
  "api.CAIXA_TRANSFERENCIA_FILIAL": "La transferencia debe ser en la misma sucursal",
  "api.CAIXA_DESTINO_FECHADO": "Abra la caja de destino antes de transferir",
  "api.CAIXA_VALOR_INVALIDO": "El valor no puede ser negativo",
  "api.CAIXA_SALDO_INSUFICIENTE": "Saldo insuficiente para transferir",
  "api.CAIXA_LANCAMENTO_TIPO": "Tipo de movimiento inválido",
  "api.CAIXA_FINALIZADOR_INATIVO": "El finalizador no está activo",
  "api.CAIXA_FINALIZADOR_SEM_AVULSO": "Este finalizador no permite movimiento manual",
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
  "api.ORCAMENTO_VENCIDO": "El presupuesto venció. Confirme para convertirlo con la cotización de hoy",
  "api.ORCAMENTO_VALIDADE": "Indique una validez válida para el presupuesto",
  "api.VENDA_GRAVACAO": "Indique si es venta, presupuesto o abierto",
  "api.VENDA_NAO_ABERTA": "Solo una venta abierta puede finalizarse",
  "api.VENDA_NAO_CANCELAVEL": "Solo un presupuesto o una venta abierta puede cancelarse",
  "api.ORCAMENTO_CLIENTE": "Los presupuestos deben ser del mismo cliente",
  "api.ORCAMENTO_INDISPONIVEL": "Uno de los presupuestos ya no está disponible",
  "api.ORCAMENTO_EM_USO": "Este presupuesto ya está en una venta",
  "api.VENDA_DESCONTO_INVALIDO": "El descuento debe estar entre 0 y 100%",
  "api.VENDEDOR_INATIVO": "El vendedor no está activo",
  "api.VENDEDOR_FILIAL": "El vendedor no tiene acceso a esta sucursal",
  "api.VENDEDOR_INVALIDO": "Este usuario no puede ser vendedor de la venta",
  "api.ESTOQUE_INSUFICIENTE": "Saldo insuficiente para vender",
  "api.ESTOQUE_FILIAL": "El depósito no pertenece a esta sucursal",
  "api.ESTOQUE_PRODUTO_AUSENTE": "Producto sin saldo en este depósito",
  "api.PRODUTO_INATIVO": "El producto no está activo",
  "api.PRODUTO_FOTO_TIPO": "Use una foto JPG, PNG o WEBP",
  "api.PRODUTO_FOTO_TAMANHO": "La foto debe tener como máximo 1,5 MB",
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
  "api.CIDADE_NOME_DUPLICADO": "Ya existe una ciudad “{nome}” en este municipio o división",
  "api.CIDADE_MUNICIPIO_OBRIGATORIO": "Indique el municipio del distrito",
  "api.CIDADE_MUNICIPIO_INVALIDO": "El municipio del distrito no es válido",
  "api.CIDADE_COM_DISTRITOS": "No se puede eliminar un municipio que tiene distritos",
  "api.CIDADE_DISTRITO_SEDE": "La sede del municipio ya es el propio municipio",
  "api.DOCUMENTO_TIPO_CODIGO_DUPLICADO": "Ya existe un tipo con el código {codigo} en este país",
  "api.DOCUMENTO_TIPO_EM_USO": "El tipo está en uso por personas registradas y no puede eliminarse",
  "api.DOCUMENTO_OBRIGATORIO": "Indique al menos un documento",
  "api.TELEFONE_PAR": "Indique DDI y teléfono juntos, o deje ambos vacíos",
  "api.TELEFONE2_PAR": "Indique DDI y segundo teléfono juntos, o deje ambos vacíos",
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
  "empresa.seed.hint": "Llena la sucursal principal para prueba: marcas, modelos, 13 productos con stock, 8 clientes, 3 proveedores, caja extra, depósito extra y 3 ventas. Usuarios demo.operador y demo.vendedor (clave demo12345) para probar el PDV. Se puede activar y desactivar. No borra la Caja 1 ni Dinero, Tarjeta y Depósito.",
  "empresa.seed.statusOn": "Datos de prueba activos",
  "empresa.seed.statusOff": "Datos de prueba desactivados",
  "empresa.seed.apply": "Activar datos de prueba",
  "empresa.seed.remove": "Desactivar y quitar",
  "empresa.seed.confirmRemove": "¿Quitar clientes, productos, cajas y ventas de prueba? Lo que cargaste fuera del seed se mantiene.",
  "empresa.seed.error": "No se pudieron actualizar los datos de prueba",
  "empresa.listProductsBranchOnly": "Listar solo productos de esta sucursal",
  "empresa.moedaOperacao": "Moneda de operación",
  "empresa.estoquePadrao": "Depósito estándar de la venta",
  "empresa.section.parametersMoeda": "Moneda",
  "produto.new": "Nuevo producto",
  "produto.edit": "Editar producto",
  "produto.codigo": "Código (SKU)",
  "produto.codigoSuggested": "sugerido",
  "produto.tipo": "Tipo",
  "produto.tipo.moto": "Moto eléctrica",
  "produto.tipo.bicicleta": "Bicicleta eléctrica",
  "produto.marca": "Marca",
  "produto.modelo": "Modelo",
  "produto.descricao": "Descripción",
  "produto.section.general": "Datos del producto",
  "produto.foto": "Foto",
  "produto.fotoHint": "Aparece en la venta. Sin foto, sigue el ícono.",
  "produto.fotoChoose": "Elegir foto",
  "produto.fotoRemove": "Quitar foto",
  "produto.section.price": "Precio e IVA",
  "produto.section.estoque": "Stock en esta sucursal",
  "produto.section.moto": "Ficha de la moto",
  "produto.section.bicicleta": "Ficha de la bicicleta",
  "produto.noStock": "Sin saldo en esta sucursal",
  "produto.qtyInicial": "Cantidad inicial",
  "produto.stockHint": "Las cantidades se ajustan en Operación → Depósitos.",
  "produto.stockHintChassi": "El saldo es el número de chasis disponibles. Incluya o quite chasis aquí.",
  "produto.controlaChassi": "Controla chasis",
  "produto.controlaChassiHint": "Activado: stock y venta por chasis. Desactivado: por cantidad. No cambia después de crear.",
  "produto.chassi": "Chasis",
  "produto.chassiLote": "Chasis",
  "produto.chassiLoteHint": "Uno por línea, o intervalo INICIO~FIN con virgulilla. Ej.: HD5BL2318SA063647~HD5BL2318SA063696",
  "produto.chassiLotePlaceholder": "HD5BL2318SA063647~HD5BL2318SA063696",
  "produto.chassiCount": "{n} chasis",
  "produto.chassiAdd": "Incluir chasis",
  "produto.chassiEmpty": "Ningún chasis en este producto",
  "produto.chassiCodigo": "Cód. interno",
  "produto.situacao.disponivel": "Disponible",
  "produto.situacao.vendido": "Vendido",
  "produto.error.chassiIntervalo": "Intervalo inválido. Use la misma longitud y la virgulilla (~).",
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
  "produto.error.nameRequired": "Indique el nombre del producto",
  "produto.error.yearsRequired": "Indique año de fabricación y año modelo válidos",
  "produto.error.price": "Indique precio de lista y costo válidos (cero o más)",
  "produto.error.qty": "Indique una cantidad inicial válida (cero o más)",
  "produto.iva": "IVA",
  "produto.currency": "Moneda",
  "produto.currency.usd": "Dólar (USD)",
  "produto.currency.pyg": "Guaraní (PYG)",
  "produto.currency.brl": "Real (BRL)",
  "produto.listPrice": "Precio de lista",
  "produto.cost": "Costo",
  "produto.confirmLinkBranch": "El producto {codigo} ya existe en {filiais}. ¿Vincular a esta sucursal?",
  "produto.anoFabricacao": "Año de fabricación",
  "produto.anoModelo": "Año modelo",
  "produto.serieQuadro": "Nº de serie del cuadro",
  "produto.nomeRestore": "Usar marca y modelo",
  "produto.searchPlaceholder": "Código, nombre, marca...",
  "marca.new": "Nueva marca",
  "marca.searchPlaceholder": "Nombre...",
  "marca.edit": "Editar marca",
  "marca.error.nameRequired": "Indique el nombre de la marca",
  "modelo.new": "Nuevo modelo",
  "modelo.edit": "Editar modelo",
  "modelo.error.required": "Indique marca y nombre del modelo",
  "modelo.searchPlaceholder": "Nombre, marca...",
  "estoque.new": "Nuevo depósito",
  "estoque.edit": "Editar depósito",
  "estoque.placeholderName": "Depósito general",
  "estoque.items": "Ítems",
  "estoque.searchPlaceholder": "Nombre...",
  "estoque.itemSearchPlaceholder": "Código, nombre...",
  "estoque.itemNew": "Agregar producto",
  "estoque.itemEdit": "Editar cantidad",
  "estoque.product": "Producto",
  "estoque.qty": "Cantidad",
  "estoque.reserved": "Reservada",
  "estoque.reservedHint": "Para venta abierta. Disponible = cantidad − reservada.",
  "estoque.available": "Disponible",
  "estoque.unit": "un.",
  "estoque.backList": "Volver a depósitos",
  "estoque.backItems": "Volver a los ítems",
  "estoque.error.nameRequired": "Indique el nombre del depósito",
  "estoque.error.productRequired": "Seleccione el producto",
  "estoque.error.qtyInvalid": "Cantidad y reserva deben ser enteros ≥ 0, y la reserva no puede ser mayor que la cantidad",
  "estoque.qtyChassisHint": "La cantidad de este producto sale de los chasis. Inclúyalos en el registro del producto, pestaña Stock.",
  "estoque.padraoBadge": "Estándar",
  "cotacao.new": "Nueva cotización",
  "cotacao.edit": "Editar cotización",
  "cotacao.date": "Fecha",
  "cotacao.dateHint": "Solo la cotización de hoy puede editarse. El historial no se elimina.",
  "cotacao.usdPyg": "USD → PYG",
  "cotacao.usdPygHint": "Guaraníes por 1 dólar. Solo números, sin punto de miles.",
  "cotacao.brlPyg": "BRL → PYG",
  "cotacao.brlPygHint": "Guaraníes por 1 real. Solo números, sin punto de miles.",
  "cotacao.rateExample": "Ejemplo de registro: escriba 1000 (no 1.000). Así 1 US$ = 1000 Gs. en este ejemplo.",
  "cotacao.ratePlaceholder": "1000",
  "cotacao.error.required": "Indique la fecha de la cotización",
  "cotacao.error.rate": "Indique las dos tasas, mayores que cero",
  "cotacao.searchPlaceholder": "Fecha...",
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
  "finalizador.geraReceber": "Genera cuentas por cobrar",
  "finalizador.geraReceberHint": "En la venta, esta forma abre el plan de cuotas y no entra en caja al momento.",
  "finalizador.geraPagar": "Genera cuentas por pagar",
  "finalizador.geraPagarHint": "Para nota de entrada futura. No use al liquidar una cuota.",
  "finalizador.fundoTroco": "Fondo de cambio / saldo de apertura",
  "finalizador.fundoTrocoHint": "Aparece en la apertura de caja y acepta saldo en las tres monedas (Gs., US$, R$).",
  "finalizador.permiteAvulso": "Permite movimiento manual",
  "finalizador.permiteAvulsoHint": "Puede usarse en suministro o sangría en la sesión de caja.",
  "finalizador.section.params": "Parámetros",
  "finalizador.chip.troco": "Cambio",
  "finalizador.chip.avulso": "Manual",
  "finalizador.chip.receber": "CxC",
  "finalizador.chip.pagar": "CxP",
  "finalizador.error.nameRequired": "Indique el nombre del finalizador",
  "finalizador.searchPlaceholder": "Nombre...",
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
  "caixa.disponivel": "Disponible",
  "caixa.transferEmpty": "No hay saldo en esta caja para transferir.",
  "caixa.user": "Usuario",
  "caixa.amount": "Valor",
  "caixa.movementType": "Tipo",
  "caixa.default": "Predeterminada",
  "caixa.error.nameRequired": "Indique el nombre de la caja",
  "caixa.searchPlaceholder": "Nombre...",
  "caixa.error.conferencia": "Indique el conteo de cierre",
  "caixa.error.destino": "Seleccione la caja de destino",
  "caixa.error.valor": "Indique al menos un valor",
  "caixa.error.noneClosed": "No hay caja cerrada para abrir",
  "caixa.error.noFundoTroco": "Ningún finalizador marcado como fondo de cambio. Regístrelo en Finalizadores.",
  "caixa.error.noAvulso": "Ningún finalizador permite movimiento manual. Márquelo en Finalizadores → Parámetros.",
  "caixa.error.lancamento": "Indique tipo, finalizador y valor",
  "caixa.lancamento": "Movimiento",
  "caixa.lancamento.tipo": "Tipo",
  "caixa.lancamento.suprimento": "Suministro (entrada)",
  "caixa.lancamento.sangria": "Sangría (salida)",
  "caixa.lancamento.valor": "Valor",
  "caixa.addFinalizer": "+ Agregar otro finalizador",
  "caixa.addCurrency": "+ Agregar moneda",
  "caixa.conferenciaHint": "Escriba solo números. Gs.: 100000 · US$/R$: 2000 o 2000,50 — sin punto de miles.",
  "caixa.conferenciaLock": "Solo entran finalizadores y monedas que ya tienen movimiento. La falta o el sobrante se ajusta en Movimiento, antes de cerrar.",
  "caixa.conferenciaEmpty": "Ningún movimiento en esta caja. Puede cerrar así, o registrar antes si hace falta.",
  "caixa.removeLine": "Quitar",
  "caixa.include": "Incluir",
  "caixa.informed": "Informado",
  "caixa.difference": "Diferencia",
  "caixa.summary": "Resumen",
  "caixa.fundoTroco": "Fondo de cambio",
  "caixa.ok": "Cuadra",
  "caixa.shortage": "Falta",
  "caixa.surplus": "Sobra",
  "caixa.mov.abertura": "Apertura",
  "caixa.mov.fechamento": "Cierre",
  "caixa.mov.venda": "Venta",
  "caixa.mov.transferencia_saida": "Transferencia (salida)",
  "caixa.mov.transferencia_entrada": "Transferencia (entrada)",
  "caixa.mov.suprimento": "Suministro",
  "caixa.mov.sangria": "Sangría",
  "caixa.mov.recebimento": "Cobro",
  "caixa.mov.pagamento": "Pago",
  "venda.new": "Nueva venta",
  "venda.view": "Venta",
  "venda.status.finalizada": "Finalizada",
  "venda.status.cancelada": "Cancelada",
  "venda.status.aberta": "Abierta",
  "venda.status.orcamento": "Presupuesto",
  "venda.status.orcamentoVencido": "Presupuesto vencido",
  "venda.status.utilizada": "Utilizado",
  "venda.gerarVenda": "Generar venta",
  "venda.retomar": "Retomar venta",
  "venda.cancelarOrcamento": "Cancelar presupuesto",
  "venda.cancelarAberta": "Cancelar venta",
  "venda.trazerOrcamentos": "Traer presupuestos",
  "venda.mesclarOrcamentos": "Combinar presupuestos",
  "venda.clienteTemOrcamentos": "Este cliente tiene {n} presupuesto(s) abierto(s)",
  "venda.incluirOrcamentos": "Incluir en la venta",
  "venda.semOrcamentos": "Ningún presupuesto de este cliente",
  "venda.emAberto": "Abierta #{n}",
  "venda.confirmCancelar": "¿Cancelar este documento? No podrá usarse después.",
  "venda.orcamentoCliente": "Seleccione presupuestos del mismo cliente",
  "venda.orcamentosSelecionados": "{n} presupuestos",
  "venda.utilizadaEm": "Venta #{n}",
  "venda.orcamentoNaVenda": "Incluido en la venta #{n}",
  "venda.filtro.todos": "Todos",
  "venda.filtro.aberta": "Abierta",
  "venda.filtro.orcamento": "Presupuesto",
  "venda.filtro.finalizada": "Finalizada",
  "venda.filtro.cancelada": "Cancelada",
  "venda.filtro.utilizada": "Utilizado",
  "venda.documentoEletronico": "Documento electrónico (SudTax)",
  "venda.montarJsonSudtax": "Armar JSON",
  "venda.copiarJsonSudtax": "Copiar JSON",
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
  "venda.amount": "Valor",
  "venda.currency.pyg": "Gs.",
  "venda.currency.usd": "US$",
  "venda.currency.brl": "R$",
  "venda.equivalent": "Equivale a Gs. {n}",
  "venda.addPay": "+ otra forma",
  "venda.finish": "Finalizar venta",
  "venda.goPay": "Ir al pago",
  "venda.backItems": "Volver a los ítems",
  "venda.seller": "Vendedor",
  "venda.changeSeller": "Cambiar",
  "venda.sellerSearchPlaceholder": "Nombre del usuario",
  "venda.searchPlaceholder": "Número, cliente, vendedor o fecha",
  "venda.error.seller": "Seleccione el vendedor",
  "venda.error.product": "Seleccione un producto",
  "venda.error.qty": "Indique una cantidad válida",
  "venda.error.client": "Seleccione el cliente",
  "venda.error.items": "Agregue al menos un ítem",
  "venda.error.pay": "Indique el pago",
  "venda.parcelas": "Cuotas del crédito",
  "venda.parcelasEmpty": "Indique la cantidad para ver los vencimientos",
  "venda.qtdParcelas": "Cantidad de cuotas",
  "venda.modoVencimento": "Vencimientos",
  "venda.diaVencimento": "Día del mes",
  "venda.modo.intervalo30": "Cada 30 días",
  "venda.modo.diaFixo": "Día fijo del mes",
  "titulo.receber.new": "Nuevo título por cobrar",
  "titulo.pagar.new": "Nuevo título por pagar",
  "titulo.moeda": "Moneda",
  "titulo.valor": "Valor",
  "titulo.saldo": "Saldo",
  "titulo.vencimento": "Vencimiento",
  "titulo.baixar": "Cobrar / pagar",
  "titulo.receberSelecionadas": "Cobrar seleccionadas",
  "titulo.pagarSelecionadas": "Pagar seleccionadas",
  "titulo.selecionadas": "Seleccionadas",
  "titulo.selecionarTodas": "Seleccionar todas las cuotas abiertas",
  "titulo.cotacaoTravada": "Cotización fijada",
  "titulo.fifoHint": "Si el valor es menor que el saldo, liquida primero las cuotas con vencimiento más próximo.",
  "titulo.filtro.abertos": "Abiertos",
  "titulo.filtro.quitados": "Liquidados",
  "titulo.filtro.abertas": "Abiertas",
  "titulo.filtro.pagas": "Pagadas",
  "titulo.filtro.parciais": "Parciales",
  "titulo.filtro.vazio": "Ninguna cuota en este filtro",
  "titulo.desconto": "Descuento",
  "titulo.acrescimo": "Recargo",
  "titulo.quitaSaldo": "Liquida el saldo de",
  "titulo.ajusteValor": "Para liquidar con este ajuste, el valor tiene que ser",
  "titulo.searchPlaceholder": "Cliente, estado...",
  "titulo.error.cliente": "Seleccione el cliente",
  "titulo.error.fornecedor": "Seleccione el proveedor",
  "titulo.error.valor": "Indique un valor válido",
  "titulo.error.selecioneParcelas": "Seleccione al menos una cuota",
  "titulo.status.aberto": "Abierto",
  "titulo.status.parcial": "Parcial",
  "titulo.status.quitado": "Liquidado",
  "titulo.status.cancelado": "Anulado",
  "titulo.parcela.aberta": "Abierta",
  "titulo.parcela.parcial": "Parcial",
  "titulo.parcela.paga": "Pagada",
  "titulo.parcela.cancelada": "Anulada",
  "entrada.new": "Nueva entrada de nota",
  "entrada.documento": "Documento",
  "entrada.tipoDocumento": "Tipo",
  "entrada.tipo.py_factura": "Factura Paraguay",
  "entrada.tipo.exterior": "Exterior / China",
  "entrada.dataEmissao": "Fecha de emisión",
  "entrada.timbrado": "Timbrado",
  "entrada.establecimiento": "Establecimiento",
  "entrada.punto": "Punto de expedición",
  "entrada.numero": "Número",
  "entrada.cdc": "CDC",
  "entrada.numeroDocumento": "Nº invoice / packing list",
  "entrada.incoterm": "Incoterm",
  "entrada.itens": "Ítems",
  "entrada.addItem": "Agregar ítem",
  "entrada.valorUnitario": "Valor unitario",
  "entrada.chassisHint": "Chasis (uno por línea o INICIO~FIM)",
  "entrada.prazo": "plazo",
  "entrada.total": "Total",
  "entrada.tituloGerado": "Título por pagar",
  "entrada.searchPlaceholder": "Proveedor, documento...",
  "entrada.error.itens": "Indique al menos un ítem",
  "entrada.error.pagamento": "Indique al menos una forma de pago",
  "api.VENDA_CREDITO_UNICO": "Use solo una forma a plazo por venta",
  "api.PARCELAS_QTD": "Indique entre 1 y 120 cuotas",
  "api.DIA_VENCIMENTO_INVALIDO": "El día de vencimiento debe estar entre 1 y 28",
  "api.PARCELAS_OBRIGATORIAS": "Indique las cuotas del crédito",
  "api.FINALIZADOR_NAO_LIQUIDA": "Use una forma de caja para liquidar la cuota",
  "api.BAIXA_SEM_PARCELA": "Seleccione al menos una cuota",
  "api.BAIXA_TITULO_MISTO": "Seleccione cuotas del mismo título",
  "api.BAIXA_CLIENTE_MISTO": "No se pueden mezclar clientes en el mismo cobro",
  "api.BAIXA_FORNECEDOR_MISTO": "No se pueden mezclar proveedores en el mismo pago",
  "api.BAIXA_MAIOR_SALDO": "El valor no puede superar el saldo de las cuotas seleccionadas",
  "api.BAIXA_VALOR_AJUSTE": "Con descuento o recargo, el valor tiene que liquidar el saldo seleccionado",
  "api.BAIXA_DESCONTO_MAIOR": "El descuento no puede superar el saldo",
  "api.BAIXA_AJUSTE_INVALIDO": "El descuento y el recargo no pueden ser negativos",
  "api.PARCELA_JA_PAGA": "La cuota ya está liquidada",
  "api.ENTRADA_PY_DUPLICADA": "Esta factura ya fue registrada para el proveedor",
  "api.ENTRADA_PY_CAMPOS": "Indique timbrado, establecimiento, punto y número",
  "api.ENTRADA_EXTERIOR_NUMERO": "Indique el número del documento / packing list",
  "api.ENTRADA_NEGOCIACAO_DIVERGENTE": "La suma de las formas de pago debe igualar el total",
  "venda.clientSearch": "Buscar cliente",
  "venda.clientSearchPlaceholder": "Nombre o documento",
  "venda.changeClient": "Cambiar",
  "venda.productSearch": "Producto / SKU",
  "venda.productSearchPlaceholder": "Código, nombre, marca, modelo o chasis — Enter lanza",
  "venda.emptyCart": "La venta está vacía",
  "venda.emptyHint": "Haga clic en un producto o busque por código. En la moto, elija el chasis.",
  "venda.clear": "Limpiar venta",
  "venda.clienteRapido.title": "Nuevo cliente",
  "venda.clienteRapido.hint": "Alta rápida para cerrar la venta sin salir del PDV",
  "venda.clienteRapido.new": "Registrar nuevo cliente",
  "venda.hold": "Dejar en abierto",
  "venda.heldCount": "{n} en espera",
  "venda.heldNoClient": "Sin cliente",
  "venda.open": "En abierto",
  "venda.openEmpty": "Ninguna",
  "venda.summary": "Resumen",
  "venda.seeSummary": "Ver resumen",
  "venda.discardConfirm": "Hay una venta en curso. ¿Desea descartarla?",
  "venda.filter.all": "Todos",
  "venda.units": "{n} un.",
  "venda.vitrineMore": "Mostrando {n} de {total}. Busque por código o nombre.",
  "venda.pickChassis": "Elija el chasis",
  "venda.chassisSearchPlaceholder": "Lea o escriba el chasis — Enter confirma",
  "venda.chassisDone": "Listo",
  "venda.noChassis": "No hay chasis disponibles de este producto",
  "venda.error.chassisRequired": "Elija el chasis de la moto",
  "venda.chassisMore": "+{n}",
  "venda.chassisInCart": "{n} en el carrito",
  "venda.discount": "Descuento",
  "venda.saleDiscount": "Descuento de la venta",
  "venda.remainingValue": "Valor restante",
  "venda.payAmount": "Valor para finalizar",
  "venda.finalizerSearch": "Buscar finalizador",
  "venda.recibo.title": "Recibo de venta",
  "venda.recibo.print": "Imprimir",
  "venda.recibo.footer": "Documento no fiscal — comprobante interno",
  "venda.dav.titulo": "DAV - DOCUMENTO AUXILIAR DE VENTA - PEDIDO",
  "venda.dav.aviso": "NO ES DOCUMENTO FISCAL - NO ES VÁLIDO COMO RECIBO NI COMO GARANTÍA DE MERCADERÍA",
  "venda.dav.pagamento": "NO COMPRUEBA EL PAGO",
  "venda.dav.tituloOrcamento": "PRESUPUESTO",
  "venda.dav.tituloAberta": "PEDIDO ABIERTO",
  "venda.dav.endereco": "Dirección",
  "venda.dav.telefone": "Teléfono",
  "venda.dav.concordo": "Concuerdo con los valores expresados en este documento",
  "venda.validade": "Validez",
  "venda.salvarOrcamento": "Guardar presupuesto",
  "venda.deixarAberto": "Dejar abierto",
  "venda.continuar": "Continuar",
  "venda.continuando": "Continuando #{n}",
  "venda.confirmVencido": "Este presupuesto venció. ¿Convertir en venta con la cotización de hoy?",
  "venda.subtotal": "Subtotal",
  "venda.paid": "Pagado",
  "venda.remaining": "Falta",
  "venda.noTill": "Ninguna caja predeterminada para este usuario",
  "venda.tillClosed": "Caja predeterminada cerrada",
  "venda.changeTill": "Cambiar",
  "venda.definePay": "Definir pago",
  "venda.payEmpty": "Ninguna forma definida",
  "venda.confirmPay": "Confirmar",
  "venda.payOver": "El valor supera el restante",
  "venda.change": "Vuelto",
  "venda.due": "Vencimiento",
  "venda.unit": "Unit.",
  "venda.itemsCount": "{n} ítems",
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
