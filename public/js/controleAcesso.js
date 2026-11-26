
var cargoLogado = sessionStorage.getItem("CARGO_USUARIO");
var tipoConta = sessionStorage.getItem("TIPO_CONTA");
var idCargo = sessionStorage.getItem("ID_CARGO");

function cargoNormalizado(cargo) {
    return String(cargo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function ehCoordenador() {
    return cargoNormalizado(cargoLogado).indexOf("coordenador") === 0;
}

function dashboardDoUsuario() {
    if (cargoLogado == "Diretor Geral" || cargoLogado == "Administrador") {
        return "./dashboardDiretorGeral.html";
    }

    if (cargoLogado == "Diretor") {
        return "./dashboardDiretorFilial.html";
    }

    if (ehCoordenador()) {
        return "./dashboardCoordenador.html";
    }

    return "./dashboardProfessor.html";
}

function moduloDaPagina(pagina) {
    if (pagina == "painelEventos.html") {
        return "Painel de Eventos";
    }

    if (pagina == "filiais.html") {
        return "Filiais";
    }

    if (pagina.indexOf("dashboard") == 0) {
        return "Gráficos / Dashboard";
    }

    if (
        pagina == "usuarios.html" ||
        pagina == "cadastroUsuario.html" ||
        pagina == "permissoes.html"
    ) {
        return "Gerenciamento de Usuários";
    }

    return "";
}

function coordenadorGerenciaUsuarios(pagina) {
    return ehCoordenador() &&
        (pagina == "usuarios.html" || pagina == "permissoes.html");
}

function coordenadorAcessaDashboard(pagina) {
    return ehCoordenador() && pagina == "dashboardCoordenador.html";
}

function professorAcessaDashboard(pagina) {
    var cargo = cargoNormalizado(cargoLogado);
    var ehProfessor = cargo.indexOf("professor") === 0 || cargo.indexOf("professora") === 0;
    return ehProfessor && pagina == "dashboardProfessor.html";
}

function aplicarAcesso(modulos) {
    var pagina = window.location.pathname.split("/").pop();
    var moduloAtual = moduloDaPagina(pagina);
    var permitido = tipoConta == "empresa";

    for (var i = 0; i < modulos.length; i++) {
        if (modulos[i] == moduloAtual) {
            permitido = true;
        }
    }

    // Bloqueia a navegação direta para módulos não permitidos
    if (moduloAtual != "" && !permitido && !coordenadorGerenciaUsuarios(pagina) && !coordenadorAcessaDashboard(pagina) && !professorAcessaDashboard(pagina)) {
        alert("Seu cargo não possui acesso a esta página.");
        window.location = "./acessoRapido.html";
        return;
    }

    // Ajusta a sidebar
    var links = document.querySelectorAll(".sidebar .nav-item a");

    for (var i = 0; i < links.length; i++) {
        var destino = links[i].getAttribute("href");
        var nomePagina = destino.split("/").pop();

        if (nomePagina.indexOf("dashboard") == 0) {
            links[i].href = dashboardDoUsuario();
            destino = links[i].getAttribute("href");
            nomePagina = destino.split("/").pop();
        }

        var modulo = moduloDaPagina(nomePagina);

        if (modulo != "" && tipoConta != "empresa") {
            var mostrar = false;

            if (coordenadorGerenciaUsuarios(nomePagina) || coordenadorAcessaDashboard(nomePagina) || professorAcessaDashboard(nomePagina)) {
                mostrar = true;
            }

            for (var j = 0; j < modulos.length; j++) {
                if (modulos[j] == modulo) {
                    mostrar = true;
                }
            }

            if (!mostrar) {
                links[i].parentElement.style.display = "none";
            }
        }
    }

    // Ajusta os cards do Acesso Rápido
    var cards = document.querySelectorAll(".servico");

    for (var i = 0; i < cards.length; i++) {
        var destinoCard = cards[i].getAttribute("href");
        var paginaCard = destinoCard.split("/").pop();

        if (paginaCard.indexOf("dashboard") == 0) {
            cards[i].href = dashboardDoUsuario();
            destinoCard = cards[i].getAttribute("href");
            paginaCard = destinoCard.split("/").pop();
        }

        var moduloCard = moduloDaPagina(paginaCard);

        if (moduloCard != "" && tipoConta != "empresa") {
            var exibir = false;

            if (coordenadorGerenciaUsuarios(paginaCard) || coordenadorAcessaDashboard(paginaCard) || professorAcessaDashboard(paginaCard)) {
                exibir = true;
            }

            for (var j = 0; j < modulos.length; j++) {
                if (modulos[j] == moduloCard) {
                    exibir = true;
                }
            }

            if (!exibir) {
                cards[i].style.display = "none";
            }
        }
    }
}

function carregarAcesso() {
    if (!cargoLogado || !sessionStorage.getItem("ID_EMPRESA")) {
        window.location = "../login.html";
        return;
    }

    // A conta da empresa possui acesso administrativo
    if (tipoConta == "empresa") {
        aplicarAcesso([]);
        return;
    }

    fetch("/permissoes/cargos")
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Não foi possível carregar as permissões.");
            }

            return resposta.json();
        })
        .then(function (cargos) {
            var modulos = [];
            var encontrouCargo = false;

            for (var i = 0; i < cargos.length; i++) {
                if (cargos[i].id_cargo == idCargo) {
                    encontrouCargo = true;

                    for (var j = 0; j < cargos[i].modulos.length; j++) {
                        modulos.push(cargos[i].modulos[j].nome);
                    }
                }
            }

            if (!encontrouCargo) {
                alert("Cargo não encontrado.");
                window.location = "../login.html";
                return;
            }

            aplicarAcesso(modulos);
        })
        .catch(function (erro) {
            console.log(erro);
            alert("Não foi possível verificar as permissões.");
            window.location = "../login.html";
        });
}

carregarAcesso();
