var modal = document.getElementById("modal-permissao");
var form = document.getElementById("form-permissao");
var tabela = document.getElementById("tabela-permissoes-corpo");
var cargoLogado = sessionStorage.getItem("CARGO_USUARIO") || "";
var perfil = cargoLogado.trim().toLocaleLowerCase("pt-BR");
var ehDiretor = perfil === "diretor" || perfil === "diretor geral";
var prefixoPermitido = ehDiretor ? "coordenador" : perfil === "coordenador" ? "professor" : null;
var descricaoPermitida = ehDiretor ? "coordenadores" : "professores";

var cargos = [];
var idEditando = null;

function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function podeGerenciarCargo(nome) {
    var nomeNormalizado = normalizar(nome);

    if (!prefixoPermitido) return false;
    if (prefixoPermitido === "professor") {
        return nomeNormalizado.indexOf("professor") === 0 || nomeNormalizado.indexOf("professora") === 0;
    }
    return nomeNormalizado.indexOf(prefixoPermitido) === 0 || nomeNormalizado.indexOf("coordenadora") === 0;
}

function configurarTela() {
    var botaoNovo = document.getElementById("btn-abrir-modal");
    var orientacao = document.getElementById("orientacao-cargos");

    if (!prefixoPermitido) {
        botaoNovo.style.display = "none";
        orientacao.textContent = "Seu cargo não pode gerenciar cargos nesta tela.";
        tabela.innerHTML = '<tr><td colspan="4">Não há cargos disponíveis para gerenciamento.</td></tr>';
        return;
    }

    orientacao.textContent = "Você pode criar e gerenciar apenas cargos de " + descricaoPermitida + ".";
    document.getElementById("label-cargo").textContent = ehDiretor ? "Nome do cargo de coordenação:" : "Nome do cargo de professor:";
    document.getElementById("inp-cargo").placeholder = ehDiretor ? "Ex.: Coordenador Pedagógico" : "Ex.: Professor de Matemática";
    document.getElementById("ajuda-cargo").textContent = "O nome do cargo deve começar com “" + (ehDiretor ? "Coordenador" : "Professor") + "”.";
}

// LISTAR MÓDULOS
function listarModulos() {
    fetch("/permissoes/modulos")
        .then(function (resposta) { return resposta.json(); })
        .then(function (modulos) {
            var grupo = document.getElementById("grupo-modulos");
            grupo.innerHTML = "";

            for (var i = 0; i < modulos.length; i++) {
                var label = document.createElement("label");
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = modulos[i].id_modulo;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(" " + modulos[i].nome));
                grupo.appendChild(label);
            }
        })
        .catch(function (erro) { console.log(erro); });
}

// LISTAR SOMENTE OS CARGOS QUE O PERFIL ATUAL PODE GERENCIAR
function listarCargos() {
    if (!prefixoPermitido) return;

    fetch("/permissoes/cargos")
        .then(function (resposta) { return resposta.json(); })
        .then(function (resultado) {
            cargos = resultado.filter(function (cargo) { return podeGerenciarCargo(cargo.nome); });
            tabela.innerHTML = "";

            if (cargos.length === 0) {
                tabela.innerHTML = '<tr><td colspan="4">Nenhum cargo de ' + descricaoPermitida + ' cadastrado.</td></tr>';
                return;
            }

            for (var i = 0; i < cargos.length; i++) {
                var cargo = cargos[i];
                var nomesModulos = cargo.modulos.map(function (modulo) { return modulo.nome; }).join(", ");
                var linha = document.createElement("tr");
                var colunaCargo = document.createElement("td");
                colunaCargo.textContent = cargo.nome;

                var colunaNivel = document.createElement("td");
                var badge = document.createElement("span");
                badge.className = "badge " + cargo.nivel_acesso.toLowerCase();
                badge.textContent = cargo.nivel_acesso;
                colunaNivel.appendChild(badge);

                var colunaModulos = document.createElement("td");
                colunaModulos.textContent = nomesModulos || "Nenhum";

                var colunaAcoes = document.createElement("td");
                var divAcoes = document.createElement("div");
                divAcoes.className = "acoes-tabela";
                var botaoEditar = document.createElement("button");
                botaoEditar.className = "btn-acao editar";
                botaoEditar.textContent = "Editar";
                botaoEditar.onclick = criarEdicao(cargo.id_cargo);
                var botaoExcluir = document.createElement("button");
                botaoExcluir.className = "btn-acao excluir";
                botaoExcluir.textContent = "Excluir";
                botaoExcluir.onclick = criarExclusao(cargo.id_cargo);

                divAcoes.appendChild(botaoEditar);
                divAcoes.appendChild(botaoExcluir);
                colunaAcoes.appendChild(divAcoes);
                linha.appendChild(colunaCargo);
                linha.appendChild(colunaNivel);
                linha.appendChild(colunaModulos);
                linha.appendChild(colunaAcoes);
                tabela.appendChild(linha);
            }
        })
        .catch(function (erro) { console.log(erro); });
}

function criarEdicao(id) { return function () { editarCargo(id); }; }
function criarExclusao(id) { return function () { excluirCargo(id); }; }

document.getElementById("btn-abrir-modal").onclick = function () {
    if (!prefixoPermitido) return;
    idEditando = null;
    form.reset();
    document.getElementById("modal-titulo").textContent = "Adicionar cargo de " + (ehDiretor ? "coordenação" : "professor");
    modal.classList.remove("oculto");
};

document.getElementById("btn-fechar-modal").onclick = function () { modal.classList.add("oculto"); };

function editarCargo(id) {
    var cargo = cargos.find(function (item) { return item.id_cargo == id; });
    if (!cargo || !podeGerenciarCargo(cargo.nome)) return;

    idEditando = id;
    document.getElementById("inp-cargo").value = cargo.nome;
    document.getElementById("inp-nivel").value = cargo.nivel_acesso;
    document.getElementById("modal-titulo").textContent = "Editar cargo";
    var checkboxes = document.querySelectorAll("#grupo-modulos input");

    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = cargo.modulos.some(function (modulo) { return checkboxes[i].value == modulo.id_modulo; });
    }
    modal.classList.remove("oculto");
}

function excluirCargo(id) {
    var cargo = cargos.find(function (item) { return item.id_cargo == id; });
    if (!cargo || !podeGerenciarCargo(cargo.nome)) return;

    if (confirm("Deseja excluir este cargo?")) {
        fetch("/permissoes/cargos/" + id, { method: "DELETE" })
            .then(function (resposta) {
                if (resposta.ok) {
                    alert("Cargo excluído com sucesso!");
                    listarCargos();
                } else {
                    alert("Não foi possível excluir o cargo. Verifique se existem usuários vinculados.");
                }
            })
            .catch(function (erro) { console.log(erro); });
    }
}

form.onsubmit = function (evento) {
    evento.preventDefault();
    if (!prefixoPermitido) return;

    var nome = document.getElementById("inp-cargo").value.trim();
    if (!podeGerenciarCargo(nome)) {
        alert("O nome do cargo deve começar com “" + (ehDiretor ? "Coordenador" : "Professor") + "”.");
        return;
    }

    var nivel = document.getElementById("inp-nivel").value;
    var checkboxes = document.querySelectorAll("#grupo-modulos input:checked");
    var modulos = Array.from(checkboxes).map(function (checkbox) { return Number(checkbox.value); });
    var url = "/permissoes/cargos";
    var metodo = "POST";

    if (idEditando != null) {
        var cargoEditado = cargos.find(function (item) { return item.id_cargo == idEditando; });
        if (!cargoEditado || !podeGerenciarCargo(cargoEditado.nome)) return;
        url += "/" + idEditando;
        metodo = "PUT";
    }

    fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome, nivel_acesso: nivel, modulos: modulos })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                alert("Cargo e permissões salvos com sucesso!");
                modal.classList.add("oculto");
                form.reset();
                listarCargos();
            } else {
                alert("Erro ao salvar cargo e permissões!");
            }
        })
        .catch(function (erro) { console.log(erro); });
};

configurarTela();
listarModulos();
listarCargos();
