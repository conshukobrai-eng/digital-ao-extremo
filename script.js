/* Rede Lilás — comportamentos compartilhados entre as páginas */
(function () {
  'use strict';

  var SAIDA_RAPIDA_URL = 'https://www.google.com.br/';

  function $(id) { return document.getElementById(id); }

  /* Saída rápida: troca a página por um site comum e não deixa a Rede Lilás no "Voltar" */
  var botoesSaida = document.querySelectorAll('[data-saida-rapida]');
  for (var i = 0; i < botoesSaida.length; i++) {
    botoesSaida[i].addEventListener('click', function () {
      window.location.replace(SAIDA_RAPIDA_URL);
    });
  }

  /* Copiar texto (telefones) */
  function copiarTexto(texto, botao) {
    var rotulo = botao.getAttribute('data-rotulo') || botao.textContent;
    botao.setAttribute('data-rotulo', rotulo);
    function ok() {
      botao.textContent = 'Copiado';
      window.setTimeout(function () { botao.textContent = rotulo; }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () {
        window.prompt('Copie manualmente:', texto);
      });
    } else {
      window.prompt('Copie manualmente:', texto);
    }
  }

  var botoesCopiar = document.querySelectorAll('[data-copy]');
  for (var c = 0; c < botoesCopiar.length; c++) {
    botoesCopiar[c].addEventListener('click', function () {
      copiarTexto(this.getAttribute('data-copy'), this);
    });
  }

  /* Mapa de delegacias próximas (só na página inicial) */
  var mapaStatus = $('mapaStatus');
  if (mapaStatus) {
    var mapa = $('mapaAjuda');
    var mapaVazio = $('mapaVazio');
    var mapaLink = $('mapaLink');
    var botaoLocal = $('usarLocalizacao');

    botaoLocal.addEventListener('click', function () {
      if (!navigator.geolocation) {
        mapaStatus.textContent = 'Seu aparelho não permite localizar delegacias automaticamente. Use o botão do Google Maps.';
        return;
      }
      mapaStatus.textContent = 'Solicitando sua localização...';
      navigator.geolocation.getCurrentPosition(function (posicao) {
        var lat = posicao.coords.latitude;
        var lng = posicao.coords.longitude;
        var busca = encodeURIComponent('delegacias da mulher mais próximas');
        mapa.src = 'https://www.google.com/maps?q=' + busca + '&ll=' + lat + ',' + lng + '&z=14&output=embed';
        mapa.hidden = false;
        mapaVazio.hidden = true;
        mapaLink.href = 'https://www.google.com/maps/search/' + busca + '/@' + lat + ',' + lng + ',14z';
        mapaStatus.textContent = 'Mostrando delegacias próximas à sua localização.';
      }, function () {
        mapaStatus.textContent = 'Não foi possível acessar sua localização. Permita o acesso ou use o botão do Google Maps.';
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
    });
  }

  /* Cadastro de perfil (só na página inicial) */
  var cadastroForm = $('cadastroForm');
  if (cadastroForm) {
    var cadastroStatus = $('cadastroStatus');
    var cadastroErro = $('cadastroErro');
    var cadastroTimeout;
    cadastroForm.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var nome = $('cadastroNome').value.trim();
      var email = $('cadastroEmail').value.trim();
      if (!nome || !email) {
        cadastroErro.hidden = false;
        cadastroStatus.hidden = true;
        return;
      }
      cadastroErro.hidden = true;
      cadastroStatus.hidden = false;
      window.clearTimeout(cadastroTimeout);
      cadastroTimeout = window.setTimeout(function () { cadastroStatus.hidden = true; }, 4000);
      cadastroForm.reset();
    });
  }

  /* Contatos de apoio, salvos só neste aparelho (só na página inicial) */
  var lista = $('listaContatos');
  if (lista) {
    var CHAVE = 'rl_resources';
    var form = $('contatoForm');
    var campoNome = $('contatoNome');
    var campoTel = $('contatoTelefone');
    var erro = $('contatoErro');
    var botaoSalvar = $('contatoSalvar');
    var editando = null;

    var padrao = [
      { name: 'Central de Atendimento à Mulher', phone: '180' },
      { name: 'Polícia Militar', phone: '190' }
    ];

    function carregar() {
      try {
        var bruto = localStorage.getItem(CHAVE);
        if (bruto === null) return padrao.slice();
        var dados = JSON.parse(bruto);
        return Array.isArray(dados) ? dados : [];
      } catch (e) {
        return padrao.slice();
      }
    }

    function salvar(dados) {
      try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* sem armazenamento */ }
    }

    var contatos = carregar();

    function botao(texto, classe, aoClicar) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mini' + (classe ? ' ' + classe : '');
      b.textContent = texto;
      b.addEventListener('click', aoClicar);
      return b;
    }

    function desenhar() {
      lista.textContent = '';
      if (!contatos.length) {
        var vazio = document.createElement('p');
        vazio.className = 'muted';
        vazio.textContent = 'Nenhum contato salvo ainda.';
        lista.appendChild(vazio);
        return;
      }
      contatos.forEach(function (item, indice) {
        var linha = document.createElement('div');
        linha.className = 'crow';

        var info = document.createElement('div');
        info.className = 'cinfo';
        var nome = document.createElement('strong');
        nome.textContent = item.name;
        var tel = document.createElement('span');
        tel.className = 'tel';
        tel.textContent = item.phone;
        info.appendChild(nome);
        info.appendChild(tel);

        var acoes = document.createElement('div');
        acoes.className = 'cact';
        var copiar = botao('Copiar', '', function () { copiarTexto(item.phone, copiar); });
        var editar = botao('Editar', '', function () {
          campoNome.value = item.name;
          campoTel.value = item.phone;
          editando = indice;
          botaoSalvar.textContent = 'Atualizar contato';
          campoNome.focus();
        });
        var remover = botao('Remover', 'del', function () {
          contatos.splice(indice, 1);
          salvar(contatos);
          editando = null;
          botaoSalvar.textContent = 'Adicionar contato';
          desenhar();
        });
        acoes.appendChild(copiar);
        acoes.appendChild(editar);
        acoes.appendChild(remover);

        linha.appendChild(info);
        linha.appendChild(acoes);
        lista.appendChild(linha);
      });
    }

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var nome = campoNome.value.trim();
      var tel = campoTel.value.trim();
      if (!nome || !tel) {
        erro.hidden = false;
        return;
      }
      erro.hidden = true;
      if (editando !== null) {
        contatos[editando] = { name: nome, phone: tel };
      } else {
        contatos.push({ name: nome, phone: tel });
      }
      salvar(contatos);
      editando = null;
      botaoSalvar.textContent = 'Adicionar contato';
      form.reset();
      desenhar();
    });

    desenhar();
  }
})();
