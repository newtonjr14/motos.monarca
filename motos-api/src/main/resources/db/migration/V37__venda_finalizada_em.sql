ALTER TABLE venda ADD COLUMN finalizada_em bigint;

UPDATE venda
SET finalizada_em = criado_em
WHERE status = 'finalizada';
