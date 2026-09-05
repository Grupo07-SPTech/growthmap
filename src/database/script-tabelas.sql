CREATE DATABASE growthmap;

USE growthmap;

-- =========================================
-- TABELA: empresa
-- =========================================

CREATE TABLE empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL,
    cnpj CHAR(14) NOT NULL,
	senha VARCHAR(255) NOT NULL
);


-- =========================================
-- TABELA: municipio
-- =========================================

CREATE TABLE municipio (
    co_municipio INT PRIMARY KEY,
    nome_municipio VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL
);


-- =========================================
-- TABELA: unidade
-- =========================================

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


-- =========================================
-- TABELA: usuario
-- =========================================

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    id_unidade INT NOT NULL,

    CONSTRAINT fk_usuario_unidade
        FOREIGN KEY (id_unidade)
        REFERENCES unidade(id)
);


-- =========================================
-- TABELA: desempenho_regional
-- =========================================

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


-- =========================================
-- TABELA: painel_acompanhamento
-- =========================================

CREATE TABLE painel_acompanhamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    co_municipio INT NOT NULL,
    area_conhecimento VARCHAR(20),
    observacao VARCHAR(255),
    data_criacao DATETIME,

    CONSTRAINT fk_painel_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id),

    CONSTRAINT fk_painel_municipio
        FOREIGN KEY (co_municipio)
        REFERENCES municipio(co_municipio)
);


-- =========================================
-- TABELA: config_notificacao
-- =========================================

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