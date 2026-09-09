ALTER TABLE venda_negociacao ADD COLUMN moeda VARCHAR(3) NOT NULL DEFAULT 'pyg';
ALTER TABLE venda_negociacao ADD COLUMN valor_pyg DOUBLE PRECISION;
UPDATE venda_negociacao SET valor_pyg = valor;
ALTER TABLE venda_negociacao ALTER COLUMN valor_pyg SET NOT NULL;

ALTER TABLE caixa_movimentacao_finalizador ADD COLUMN moeda VARCHAR(3) NOT NULL DEFAULT 'pyg';
ALTER TABLE caixa_movimentacao_finalizador ADD COLUMN valor_pyg DOUBLE PRECISION;
UPDATE caixa_movimentacao_finalizador SET valor_pyg = valor;
ALTER TABLE caixa_movimentacao_finalizador ALTER COLUMN valor_pyg SET NOT NULL;
