CREATE DATABASE growthmap;

USE growthmap;

CREATE TABLE empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL,
    cnpj CHAR(14) NOT NULL,
	senha VARCHAR(255) NOT NULL
);

CREATE TABLE municipio (
    co_municipio INT PRIMARY KEY,
    nome_municipio VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL
);

CREATE TABLE unidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(200),
    co_municipio INT NOT NULL,
    id_empresa INT NOT NULL,
    cnpj CHAR(14),

    CONSTRAINT fk_unidade_municipio
        FOREIGN KEY (co_municipio)
        REFERENCES municipio(co_municipio),

    CONSTRAINT fk_unidade_empresa
        FOREIGN KEY (id_empresa)
        REFERENCES empresa(id)
);

CREATE TABLE cargo (
    id_cargo INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    nivel_acesso VARCHAR(30) NOT NULL
);

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    fk_cargo INT NOT NULL,
    id_unidade INT NOT NULL,
    area_atuacao VARCHAR(100),
    cpf CHAR(11),

    CONSTRAINT fk_usuario_unidade
        FOREIGN KEY (id_unidade)
        REFERENCES unidade(id),
    CONSTRAINT fk_usuario_cargo
        FOREIGN KEY (fk_cargo)
        REFERENCES cargo (id_cargo)
);

CREATE TABLE desempenho_regional (
    id INT AUTO_INCREMENT PRIMARY KEY,
    co_municipio INT NOT NULL,
    ano SMALLINT NOT NULL,
    media_cn DECIMAL(6,2),
    media_ch DECIMAL(6,2),
    media_lc DECIMAL(6,2),
    media_mt DECIMAL(6,2),
    media_redacao DECIMAL(6,2),
    qtd_participantes INT,

    CONSTRAINT fk_desempenho_municipio
        FOREIGN KEY (co_municipio)
        REFERENCES municipio(co_municipio)
);

CREATE TABLE desempenho_estadual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uf CHAR(2) NOT NULL,
    ano SMALLINT NOT NULL,
    media_cn DECIMAL(6,2),
    media_ch DECIMAL(6,2),
    media_lc DECIMAL(6,2),
    media_mt DECIMAL(6,2),
    media_redacao DECIMAL(6,2),
    qtd_participantes INT NOT NULL,
    UNIQUE (uf, ano)
);

CREATE TABLE config_notificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    canal VARCHAR(20) NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    limiar_media DECIMAL(6,2),
    id_unidade INT NOT NULL,
    id_usuario INT NOT NULL,

    CONSTRAINT fk_config_unidade
        FOREIGN KEY (id_unidade)
        REFERENCES unidade(id),

    CONSTRAINT fk_config_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id)
);

CREATE TABLE logs_sistema(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    acao VARCHAR(100) NOT NULL,
    dataHora DATETIME NOT NULL,
    
    CONSTRAINT fk_id_usuario
		FOREIGN KEY (id_usuario)
		REFERENCES usuario(id)
);

CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,            
    nome VARCHAR(150) NOT NULL,          
    area VARCHAR(100),                   
    data DATE NOT NULL,                 
    rotulo VARCHAR(50),                  
    feita TINYINT DEFAULT 0,            
    fk_usuario INT NOT NULL,

    CONSTRAINT fk_evento_usuario
        FOREIGN KEY (fk_usuario)
        REFERENCES usuario(id)
);

CREATE TABLE modulo (
    id_modulo INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE cargo_modulo (
    fk_cargo INT NOT NULL,
    fk_modulo INT NOT NULL,

    PRIMARY KEY (fk_cargo, fk_modulo),

    CONSTRAINT fk_cargo_modulo_cargo
        FOREIGN KEY (fk_cargo)
        REFERENCES cargo(id_cargo)
        ON DELETE CASCADE,

    CONSTRAINT fk_cargo_modulo_modulo
        FOREIGN KEY (fk_modulo)
        REFERENCES modulo(id_modulo)
);

INSERT INTO modulo (nome) VALUES
('Painel de Eventos'),
('Filiais'),
('Gráficos / Dashboard'),
('Gerenciamento de Usuários');
