function postar(endpoint, payload) {
    if (!process.env.EMAIL_API_URL) {
        console.log("EMAIL_API_URL não configurada, e-mail não enviado.");
        return Promise.resolve();
    }


    const urlBase = process.env.EMAIL_API_URL.replace(/\/+$/, "");
    const caminhoFormatado = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    
    return fetch(`${urlBase}${caminhoFormatado}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
    })
        .then(function (response) {
            if (!response.ok) {
                console.log("Serviço de e-mail respondeu " + response.status);
            }
        })
        .catch(function (err) {
            console.log("Serviço de e-mail indisponível:", err.message);
        });
}

function avisarCadastro(nome, email) {
    return postar("/api/emails/cadastro", { nome: nome, email: email });
}

function avisarEvento(nome, email, evento, area, data) {
    return postar("/api/emails/evento", {
        nome: nome,
        email: email,
        evento: evento,
        area: area,
        data: data,
    });
}

module.exports = { avisarCadastro, avisarEvento };