ALTER TABLE finalizador ADD COLUMN permite_lancamento_avulso BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE finalizador
SET permite_lancamento_avulso = TRUE
WHERE tipo = 'dinheiro'
  AND status <> 'deletado';
