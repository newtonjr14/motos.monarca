ALTER TABLE cidade
    ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'municipio';

ALTER TABLE cidade
    ADD COLUMN id_cidade_municipio BIGINT REFERENCES cidade (id);

ALTER TABLE cidade
    ADD CONSTRAINT cidade_tipo_pai CHECK (
        (tipo = 'municipio' AND id_cidade_municipio IS NULL)
        OR (tipo = 'distrito' AND id_cidade_municipio IS NOT NULL)
    );

CREATE INDEX cidade_id_cidade_municipio ON cidade (id_cidade_municipio);
