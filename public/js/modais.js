(function () {
  'use strict';

  var COR = '#7a1f3d';
  var CSS = `
  .gm-overlay{position:fixed;inset:0;background:rgba(20,20,30,.55);display:flex;align-items:center;
    justify-content:center;z-index:9999;opacity:0;transition:opacity .2s;font-family:'Poppins',sans-serif}
  .gm-overlay.aberto{opacity:1}
  .gm-modal{background:#fff;border-radius:16px;padding:32px 28px;width:min(380px,90vw);text-align:center;
    box-shadow:0 20px 50px rgba(0,0,0,.25);transform:translateY(12px) scale(.97);transition:transform .2s}
  .gm-overlay.aberto .gm-modal{transform:none}
  .gm-icone{height:64px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .gm-spinner{width:44px;height:44px;border:4px solid #f0dde3;border-top-color:${COR};
    border-radius:50%;animation:gm-gira .8s linear infinite}
  @keyframes gm-gira{to{transform:rotate(360deg)}}
  .gm-modal h3{margin:0 0 6px;font-size:18px;font-weight:600;color:#222}
  .gm-modal p{margin:0;font-size:13.5px;color:#666;line-height:1.5}
  .gm-barra{height:8px;background:#f0e6e9;border-radius:99px;overflow:hidden;margin-top:20px}
  .gm-barra i{display:block;height:100%;width:0;background:${COR};border-radius:99px}
  .gm-pct{margin-top:8px;font-size:12px;font-weight:600;color:${COR}}
  .gm-acoes{margin-top:20px}
  .gm-btn{padding:10px 26px;border:none;border-radius:10px;background:${COR};color:#fff;cursor:pointer;
    font:600 13px 'Poppins',sans-serif}
  .gm-btn:hover{background:#5f1830}
  .gm-check{width:64px;height:64px}
  .gm-check .c,.gm-check .p{fill:none;stroke:#2e9e5b;stroke-linecap:round;stroke-linejoin:round}
  .gm-check .c{stroke-width:3;stroke-dasharray:151;stroke-dashoffset:151;animation:gm-desenha .5s forwards}
  .gm-check .p{stroke-width:4;stroke-dasharray:50;stroke-dashoffset:50;animation:gm-desenha .4s .4s forwards}
  @keyframes gm-desenha{to{stroke-dashoffset:0}}
  .gm-erro-x{font-size:44px;color:#dc2626;line-height:1}
  `;

  var estilo = document.createElement('style');
  estilo.textContent = CSS;
  document.head.appendChild(estilo);

  var SVG_CHECK =
    '<svg class="gm-check" viewBox="0 0 52 52"><circle class="c" cx="26" cy="26" r="24"/>' +
    '<path class="p" d="M14 27l8 8 16-17"/></svg>';

  function criarModal(html) {
    var overlay = document.createElement('div');
    overlay.className = 'gm-overlay';
    overlay.innerHTML = '<div class="gm-modal">' + html + '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('aberto'); });
    return {
      overlay: overlay,
      q: function (sel) { return overlay.querySelector(sel); },
      fechar: function () {
        overlay.classList.remove('aberto');
        setTimeout(function () { overlay.remove(); }, 200);
      }
    };
  }

  window.redirecionarComModal = function (titulo, texto, destino, tempo) {
    tempo = tempo || 2000;
    var m = criarModal(
      '<div class="gm-icone"><div class="gm-spinner"></div></div>' +
      '<h3>' + titulo + '</h3><p>' + texto + '</p>' +
      '<div class="gm-barra"><i></i></div>'
    );
    var barra = m.q('.gm-barra i');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        barra.style.transition = 'width ' + tempo + 'ms linear';
        barra.style.width = '100%';
      });
    });
    setTimeout(function () { window.location = destino; }, tempo);
  };


  window.gerarRelatorio = window.gerarRelatorio || function (progresso) {
    return new Promise(function (resolve) {
      var p = 0;
      var t = setInterval(function () {
        p = Math.min(100, p + Math.random() * 12 + 4);
        progresso(Math.round(p));
        if (p >= 100) { clearInterval(t); setTimeout(resolve, 300); }
      }, 180);
    });
  };

  var baixando = false;

  window.abrirModalDownload = function () {
    if (baixando) return;
    baixando = true;

    var m = criarModal(
      '<div class="gm-icone" id="gm-icone"><div class="gm-spinner"></div></div>' +
      '<h3 id="gm-titulo">Gerando relatório...</h3>' +
      '<p id="gm-texto">Aguarde enquanto o download é preparado.</p>' +
      '<div class="gm-barra"><i id="gm-barra"></i></div>' +
      '<div class="gm-pct" id="gm-pct">0%</div>' +
      '<div class="gm-acoes" id="gm-acoes" style="display:none">' +
      '<button class="gm-btn" id="gm-fechar" type="button">Fechar</button></div>'
    );

    function terminar() {
      baixando = false;
      m.q('#gm-acoes').style.display = 'block';
      m.q('#gm-fechar').addEventListener('click', m.fechar);
      m.overlay.addEventListener('click', function (e) { if (e.target === m.overlay) m.fechar(); });
    }

    function atualizar(p) {
      m.q('#gm-barra').style.width = p + '%';
      m.q('#gm-pct').textContent = p + '%';
    }

    Promise.resolve(window.gerarRelatorio(atualizar)).then(function () {
      atualizar(100);
      m.q('#gm-icone').innerHTML = SVG_CHECK;
      m.q('#gm-titulo').textContent = 'Download concluído!';
      m.q('#gm-texto').textContent = 'O relatório foi baixado com sucesso.';
      m.q('#gm-pct').style.display = 'none';
      terminar();
    }).catch(function () {
      m.q('#gm-icone').innerHTML = '<div class="gm-erro-x">✕</div>';
      m.q('#gm-titulo').textContent = 'Falha no download';
      m.q('#gm-texto').textContent = 'Não foi possível gerar o relatório. Tente novamente.';
      m.q('#gm-pct').style.display = 'none';
      terminar();
    });
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest('#btn-baixar-relatorio')) window.abrirModalDownload();
  });
})();