ALTER TABLE finalizador ADD COLUMN gera_credito_cliente BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO finalizador (nome, tipo, status, gera_contas_receber, gera_contas_pagar, gera_credito_cliente)
SELECT 'Crédito do cliente', 'outro', 'ativo', FALSE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM finalizador WHERE LOWER(nome) = 'crédito do cliente');

CREATE TABLE devolucao (
    id              BIGSERIAL PRIMARY KEY,
    id_filial       BIGINT         NOT NULL REFERENCES filial (id),
    id_venda        BIGINT         NOT NULL REFERENCES venda (id),
    id_cliente      BIGINT         NOT NULL REFERENCES cliente (id),
    valor_pyg       DOUBLE PRECISION NOT NULL,
    abatido_pyg     DOUBLE PRECISION NOT NULL DEFAULT 0,
    excesso_pyg     DOUBLE PRECISION NOT NULL DEFAULT 0,
    tratamento      VARCHAR(20)    NOT NULL,
    id_finalizador  BIGINT         REFERENCES finalizador (id),
    moeda_caixa     VARCHAR(3),
    valor_caixa     DOUBLE PRECISION,
    id_caixa_sessao BIGINT         REFERENCES caixa_sessao (id),
    id_cotacao      BIGINT         NOT NULL REFERENCES cotacao (id),
    usd_pyg         DOUBLE PRECISION NOT NULL,
    brl_pyg         DOUBLE PRECISION NOT NULL,
    observacao      VARCHAR(500),
    criado_em       BIGINT         NOT NULL,
    id_usuario      BIGINT         NOT NULL REFERENCES usuario (id),
    status          VARCHAR(20)    NOT NULL DEFAULT 'finalizada'
);

CREATE INDEX devolucao_filial ON devolucao (id_filial);
CREATE INDEX devolucao_venda ON devolucao (id_venda);

CREATE TABLE devolucao_item (
    id             BIGSERIAL PRIMARY KEY,
    id_devolucao   BIGINT NOT NULL REFERENCES devolucao (id),
    id_venda_item  BIGINT NOT NULL REFERENCES venda_item (id),
    quantidade     INT    NOT NULL,
    valor_pyg      DOUBLE PRECISION NOT NULL
);

CREATE TABLE devolucao_item_unidade (
    id                   BIGSERIAL PRIMARY KEY,
    id_devolucao_item    BIGINT NOT NULL REFERENCES devolucao_item (id),
    id_produto_unidade   BIGINT NOT NULL REFERENCES produto_unidade (id)
);

CREATE TABLE cliente_credito (
    id            BIGSERIAL PRIMARY KEY,
    id_filial     BIGINT NOT NULL REFERENCES filial (id),
    id_cliente    BIGINT NOT NULL REFERENCES cliente (id),
    id_devolucao  BIGINT REFERENCES devolucao (id),
    id_venda      BIGINT REFERENCES venda (id),
    valor_pyg     DOUBLE PRECISION NOT NULL,
    criado_em     BIGINT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'ativo'
);

CREATE INDEX cliente_credito_saldo ON cliente_credito (id_filial, id_cliente);
