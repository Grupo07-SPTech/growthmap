var crypto = require("crypto");
var sessoes = new Map();

function criar(idUsuario) {
    var token = crypto.randomBytes(32).toString("hex");
    sessoes.set(token, idUsuario);
    setTimeout(function () {
        sessoes.delete(token);
    }, 8 * 60 * 60 * 1000).unref();
    return token;
}

function identificar(req) {
    var token = req.get("Authorization") || "";
    if (!token.startsWith("Bearer ")) {
        return undefined;
    }
    return sessoes.get(token.slice(7));
}

module.exports = { criar, identificar };
