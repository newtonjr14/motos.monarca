UPDATE produto
SET codigo = CONCAT('#', id)
WHERE status = 'deletado';

CREATE UNIQUE INDEX produto_codigo_uk ON produto (codigo);
