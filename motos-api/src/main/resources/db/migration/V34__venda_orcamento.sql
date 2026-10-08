ALTER TABLE venda ALTER COLUMN id_caixa_sessao DROP NOT NULL;
ALTER TABLE venda ADD COLUMN validade varchar(10);
