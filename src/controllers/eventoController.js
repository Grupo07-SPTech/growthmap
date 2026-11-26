var eventoModel = require("../models/eventoModel");

var usuarioModel = require("../models/usuarioModel");
var notificacaoService = require("../services/notificacaoService");
var sessaoEventos = require("../sessaoEventos");

async function verificarAcesso(req, res, exigeAlteracao) {
    var idUsuario = sessaoEventos.identificar(req);
    if (!idUsuario) {
        res.status(401).send("Entre novamente com uma conta de colaborador.");
        return;
    }

    try {
        var usuarios = await eventoModel.buscarAcesso(idUsuario);
        if (!usuarios.length) {
            res.status(403).send("Seu cargo não possui acesso ao Painel de Eventos.");
            return;
        }

        var nivel = usuarios[0].nivel_acesso.trim().toLowerCase();
        var podeAlterar = nivel === "administrativo" || nivel === "operacional";
        if (exigeAlteracao && !podeAlterar) {
            res.status(403).send("Seu nível permite apenas consultar eventos.");
            return;
        }

        res.set("X-Eventos-Pode-Alterar", String(podeAlterar));
        return idUsuario;
    } catch (erro) {
        console.error(erro);
        res.status(500).send("Não foi possível verificar o acesso aos eventos.");
    }
}

async function listar(req, res) {
    var idUsuario = await verificarAcesso(req, res, false);
    if (!idUsuario) return;

    if (req.params.idUsuario !== String(idUsuario)) {
        return res.sendStatus(403);
    }

    eventoModel.listar(idUsuario)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

async function cadastrar(req, res) {
    var idUsuario = await verificarAcesso(req, res, true);
    if (!idUsuario) return;

    var tipo = req.body.tipoServer;
    var nome = req.body.nomeServer;
    var area = req.body.areaServer;
    var data = req.body.dataServer;
    var rotulo = req.body.rotuloServer;

    if (!nome || !data) {
        res.status(400).send("Dados obrigatórios não preenchidos!");
    } else {
        eventoModel.cadastrar(tipo || 'tarefa', nome, area || 'Geral', data, rotulo || 'Tarefa', idUsuario)
            .then(function (resultado) {
                res.status(201).json(resultado);
                 avisarEventoPorEmail(fkUsuario, nome, area || 'Geral', data);
            })
            .catch(function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

async function atualizar(req, res) {
    var idUsuario = await verificarAcesso(req, res, true);
    if (!idUsuario) return;

    var idEvento = req.params.idEvento;
    var feita = req.body.feitaServer;
    var nome = req.body.nomeServer;
    var area = req.body.areaServer;

    if (feita === undefined && nome === undefined && area === undefined) {
        return res.status(400).send("Nenhum campo para atualizar foi enviado!");
    }

    if (feita !== undefined && feita !== 0 && feita !== 1 && typeof feita !== "boolean") {
        return res.status(400).send("Status do evento inválido.");
    }
    if (nome !== undefined && (typeof nome !== "string" || !nome.trim())) {
        return res.status(400).send("Nome do evento inválido.");
    }
    if (area !== undefined && typeof area !== "string") {
        return res.status(400).send("Área do evento inválida.");
    }

    eventoModel.atualizar(idEvento, idUsuario, nome ?? null, area ?? null, feita ?? null)
        .then(resultado => responderAlteracao(res, resultado))
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

async function deletar(req, res) {
    var idUsuario = await verificarAcesso(req, res, true);
    if (!idUsuario) return;

    var idEvento = req.params.idEvento;

    eventoModel.deletar(idEvento, idUsuario)
        .then(resultado => responderAlteracao(res, resultado))
        .catch(erro => res.status(500).json(erro.sqlMessage));
}

function avisarEventoPorEmail(idUsuario, nomeEvento, area, data) {
    usuarioModel.buscarPorId(idUsuario)
        .then(function (usuarios) {
            if (usuarios.length > 0) {
                notificacaoService.avisarEvento(
                    usuarios[0].nome,
                    usuarios[0].email,
                    nomeEvento,
                    area,
                    data
                );
            }
        })
        .catch(function (erro) {
            console.log("Não foi possível buscar o e-mail do usuário:", erro.sqlMessage || erro);
        });

}

module.exports = {
    listar,
    cadastrar,
    atualizar,
    deletar
};
