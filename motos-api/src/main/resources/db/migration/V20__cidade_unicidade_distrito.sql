ALTER TABLE cidade ADD COLUMN id_pai_chave BIGINT NOT NULL DEFAULT 0;

UPDATE cidade SET id_pai_chave = COALESCE(id_cidade_municipio, 0);

DROP INDEX IF EXISTS cidade_id_divisao_nome;

CREATE UNIQUE INDEX cidade_divisao_nome_pai ON cidade (id_divisao, nome, id_pai_chave);
