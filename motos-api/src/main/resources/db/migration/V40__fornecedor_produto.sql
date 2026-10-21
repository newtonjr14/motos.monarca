CREATE TABLE fornecedor_produto (
    id                          BIGSERIAL PRIMARY KEY,
    id_fornecedor               BIGINT       NOT NULL REFERENCES fornecedor (id),
    codigo_produto_fornecedor   VARCHAR(80)  NOT NULL,
    id_produto                  BIGINT       NOT NULL REFERENCES produto (id)
);

CREATE UNIQUE INDEX fornecedor_produto_codigo_uk
    ON fornecedor_produto (id_fornecedor, lower(codigo_produto_fornecedor));

CREATE INDEX fornecedor_produto_produto ON fornecedor_produto (id_produto);

ALTER TABLE entrada_item ADD COLUMN codigo_produto_fornecedor VARCHAR(80);
