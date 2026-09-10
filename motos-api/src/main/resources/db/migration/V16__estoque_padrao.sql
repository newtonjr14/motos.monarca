ALTER TABLE estoque ADD COLUMN padrao BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE estoque SET padrao = TRUE
WHERE id IN (
    SELECT id FROM (
        SELECT MIN(id) AS id
        FROM estoque
        WHERE status <> 'deletado'
        GROUP BY id_filial
    ) t
);
