CREATE TABLE estoque_movimento (
    id BIGSERIAL PRIMARY KEY,
    id_filial BIGINT NOT NULL REFERENCES filial (id),
    id_estoque BIGINT NOT NULL REFERENCES estoque (id),
    id_produto BIGINT NOT NULL REFERENCES produto (id),
    tipo VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,
    saldo_depois INTEGER NOT NULL,
    id_documento BIGINT,
    observacao VARCHAR(240),
    id_usuario BIGINT REFERENCES usuario (id),
    criado_em BIGINT NOT NULL
);

CREATE INDEX idx_estoque_movimento_filial_data ON estoque_movimento (id_filial, criado_em DESC);
CREATE INDEX idx_estoque_movimento_produto ON estoque_movimento (id_produto);
