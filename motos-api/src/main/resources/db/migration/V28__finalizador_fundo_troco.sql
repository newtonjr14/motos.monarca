ALTER TABLE finalizador ADD COLUMN fundo_troco BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE finalizador
SET fundo_troco = TRUE
WHERE tipo = 'dinheiro'
  AND status <> 'deletado';
