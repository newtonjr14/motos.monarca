ALTER TABLE produto ADD COLUMN controla_chassi BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE produto SET controla_chassi = TRUE WHERE tipo = 'moto';
