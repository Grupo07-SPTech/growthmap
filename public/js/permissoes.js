
var modal = document.getElementById("modal-permissao");
var form = document.getElementById("form-permissao");
var tabela = document.getElementById("tabela-permissoes-corpo");

var cargos = [];
var idEditando = null;

// LISTAR MÓDULOS
function listarModulos() {
    fetch("/permissoes/modulos")
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (modulos) {
            var grupo = document.getElementById("grupo-modulos");
            grupo.innerHTML = "";

            for (var i = 0; i < modulos.length; i++) {
                var label = document.createElement("label");
                var checkbox = document.createElement("input");

                checkbox.type = "checkbox";
                checkbox.value = modulos[i].id_modulo;

                label.appendChild(checkbox);
                label.appendChild(
                    document.createTextNode(" " + modulos[i].nome)
                );

                grupo.appendChild(label);
            }
        })
        .catch(function (erro) {
            console.log(erro);
        });
}

// LISTAR CARGOS
function listarCargos() {
    fetch("/permissoes/cargos")
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (resultado) {
            cargos = resultado;
            tabela.innerHTML = "";

            for (var i = 0; i < cargos.length; i++) {
                var cargo = cargos[i];
                var nomesModulos = "";

                for (var j = 0; j < cargo.modulos.length; j++) {
                    if (j > 0) {
                        nomesModulos += ", ";
                    }

                    nomesModulos += cargo.modulos[j].nome;
                }

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
        .catch(function (erro) {
            console.log(erro);
        });
}

function criarEdicao(id) {
    return function () {
        editarCargo(id);
    };
}

function criarExclusao(id) {
    return function () {
        excluirCargo(id);
    };
}

// ABRIR MODAL PARA CADASTRO
document.getElementById("btn-abrir-modal").onclick = function () {
    idEditando = null;
    form.reset();

    document.getElementById("modal-titulo").textContent =
        "Adicionar Novo Cargo";

    modal.classList.remove("oculto");
};

// FECHAR MODAL
document.getElementById("btn-fechar-modal").onclick = function () {
    modal.classList.add("oculto");
};

// EDITAR CARGO
function editarCargo(id) {
    for (var i = 0; i < cargos.length; i++) {
        if (cargos[i].id_cargo == id) {
            var cargo = cargos[i];

            idEditando = id;

            document.getElementById("inp-cargo").value = cargo.nome;
            document.getElementById("inp-nivel").value = cargo.nivel_acesso;
            document.getElementById("modal-titulo").textContent =
                "Editar Cargo";

            var checkboxes =
                document.querySelectorAll("#grupo-modulos input");

            for (var j = 0; j < checkboxes.length; j++) {
                checkboxes[j].checked = false;

                for (var k = 0; k < cargo.modulos.length; k++) {
                    if (checkboxes[j].value == cargo.modulos[k].id_modulo) {
                        checkboxes[j].checked = true;
                    }
                }
            }

            modal.classList.remove("oculto");
        }
    }
}

// EXCLUIR CARGO
function excluirCargo(id) {
    if (confirm("Deseja excluir este cargo?")) {
        fetch("/permissoes/cargos/" + id, {
            method: "DELETE"
        })
        .then(function (resposta) {
            if (resposta.ok) {
                alert("Cargo excluído com sucesso!");
                listarCargos();
            } else {
                alert("Não foi possível excluir o cargo. Verifique se existem usuários vinculados.");
            }
        })
        .catch(function (erro) {
            console.log(erro);
        });
    }
}

// CADASTRAR OU ATUALIZAR
form.onsubmit = function (evento) {
    evento.preventDefault();

    var nome = document.getElementById("inp-cargo").value;
    var nivel = document.getElementById("inp-nivel").value;

    var checkboxes =
        document.querySelectorAll("#grupo-modulos input:checked");

    var modulos = [];

    for (var i = 0; i < checkboxes.length; i++) {
        modulos.push(Number(checkboxes[i].value));
    }

    var url = "/permissoes/cargos";
    var metodo = "POST";

    if (idEditando != null) {
        url += "/" + idEditando;
        metodo = "PUT";
    }

    fetch(url, {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome: nome,
            nivel_acesso: nivel,
            modulos: modulos
        })
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
    .catch(function (erro) {
        console.log(erro);
    });
};

listarModulos();
listarCargos();
