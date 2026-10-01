CREATE TABLE produto_foto (
    id_produto BIGINT PRIMARY KEY REFERENCES produto (id) ON DELETE CASCADE,
    content_type VARCHAR(40) NOT NULL,
    conteudo BYTEA NOT NULL
);
