ALTER TABLE filial ADD COLUMN id_estoque_padrao BIGINT;

UPDATE filial SET id_estoque_padrao = (
    SELECT MIN(e.id)
    FROM estoque e
    WHERE e.id_filial = filial.id
      AND e.padrao = TRUE
      AND e.status <> 'deletado'
);

UPDATE filial SET id_estoque_padrao = (
    SELECT MIN(e.id)
    FROM estoque e
    WHERE e.id_filial = filial.id
      AND e.status <> 'deletado'
)
WHERE id_estoque_padrao IS NULL;

ALTER TABLE estoque DROP COLUMN padrao;
