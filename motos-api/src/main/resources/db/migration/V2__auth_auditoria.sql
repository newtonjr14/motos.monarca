ALTER TABLE usuario ADD COLUMN login VARCHAR(80);
ALTER TABLE usuario ADD COLUMN idioma VARCHAR(5) NOT NULL DEFAULT 'pt';

UPDATE usuario SET login = LOWER(SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)) WHERE login IS NULL;

ALTER TABLE usuario ALTER COLUMN login SET NOT NULL;
CREATE UNIQUE INDEX usuario_login ON usuario (login);

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    table_name VARCHAR(80) NOT NULL,
    record_id VARCHAR(80) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values TEXT,
    new_values TEXT,
    user_id BIGINT REFERENCES usuario (id),
    created_at BIGINT NOT NULL
);

CREATE INDEX audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX audit_logs_created_at ON audit_logs (created_at);

CREATE TABLE refresh_token (
    id VARCHAR(36) PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario (id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX refresh_token_usuario ON refresh_token (id_usuario);
CREATE UNIQUE INDEX refresh_token_hash ON refresh_token (token_hash);
