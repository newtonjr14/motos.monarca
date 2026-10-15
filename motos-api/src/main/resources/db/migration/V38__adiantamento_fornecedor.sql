ALTER TABLE caixa_movimentacao ADD COLUMN id_fornecedor BIGINT REFERENCES fornecedor (id);
CREATE INDEX caixa_movimentacao_fornecedor ON caixa_movimentacao (id_fornecedor);

ALTER TABLE entrada_negociacao ADD COLUMN id_caixa_movimentacao BIGINT REFERENCES caixa_movimentacao (id);
CREATE INDEX entrada_negociacao_adiantamento ON entrada_negociacao (id_caixa_movimentacao);
