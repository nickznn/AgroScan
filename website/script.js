(function () {
  'use strict';
  var cfg = window.AGROSCAN_SITE || {};
  var $ = function (id) { return document.getElementById(id); };

  // ---------------------------------------------------------- endereço do app (config.js ou ?app=...)
  function appUrl() {
    var fromQuery = new URLSearchParams(location.search).get('app');
    var url = (fromQuery || cfg.appUrl || '').trim();
    return /^https?:\/\//i.test(url) ? url : '';
  }

  function renderQr() {
    var url = appUrl();
    var box = $('qr');
    var open = $('open-app');
    var copy = $('copy-app');
    var note = $('app-note');
    if (!url) {
      box.className = 'qr-box empty';
      box.textContent = 'O QR Code aparece aqui assim que o endereço do app for definido.';
      $('qr-url').textContent = 'Em breve';
      open.setAttribute('aria-disabled', 'true');
      open.removeAttribute('href');
      copy.disabled = true;
      copy.style.opacity = '.45';
      note.textContent = 'Para ativar: defina "appUrl" em website/config.js, ou abra o site com ?app=https://SEU-ENDERECO no final do endereço.';
      return;
    }
    var qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    box.className = 'qr-box';
    box.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
    $('qr-url').textContent = url;
    open.href = url;
    open.removeAttribute('aria-disabled');
    copy.disabled = false;
    copy.style.opacity = '';
    note.textContent = 'Protótipo acadêmico: os dados criados aqui são de teste.';
    copy.onclick = function () {
      var done = function () { copy.textContent = 'Link copiado!'; setTimeout(function () { copy.textContent = 'Copiar link'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
      else done();
    };
  }

  // ---------------------------------------------------------- equipe
  function initials(name) {
    var parts = String(name).trim().split(/\s+/);
    return ((parts[0] || '')[0] || '') + ((parts.length > 1 ? parts[parts.length - 1][0] : '') || '');
  }

  function renderTeam() {
    var wrap = $('team');
    (cfg.team || []).forEach(function (m) {
      var card = document.createElement('article');
      card.className = 'card member reveal';
      var av = document.createElement('div');
      av.className = 'avatar';
      if (m.photo) {
        var img = document.createElement('img');
        img.src = m.photo;
        img.alt = m.name;
        av.appendChild(img);
      } else {
        av.textContent = initials(m.name).toUpperCase();
      }
      var h = document.createElement('h3');
      h.textContent = m.name;
      var p = document.createElement('p');
      p.textContent = m.role;
      card.append(av, h, p);
      wrap.appendChild(card);
    });
  }

  // ---------------------------------------------------------- contato
  function renderContact() {
    var c = cfg.contact || {};
    var list = $('contact-list');
    var items = [];
    if (c.email) items.push(['@', 'E-mail', c.email, 'mailto:' + c.email]);
    if (c.whatsapp) items.push(['W', 'WhatsApp', '+' + c.whatsapp, 'https://wa.me/' + c.whatsapp.replace(/\D/g, '')]);
    if (c.instagram) items.push(['IG', 'Instagram', '@' + c.instagram.replace(/^@/, ''), 'https://instagram.com/' + c.instagram.replace(/^@/, '')]);
    if (c.linkedin) items.push(['in', 'LinkedIn', 'Nosso perfil', c.linkedin]);
    if (!items.length) {
      var li = document.createElement('li');
      li.className = 'small';
      li.textContent = 'Defina os contatos em website/config.js.';
      list.appendChild(li);
    }
    items.forEach(function (it) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = it[3];
      if (!/^mailto:/.test(it[3])) { a.target = '_blank'; a.rel = 'noopener'; }
      var ic = document.createElement('span');
      ic.className = 'ci';
      ic.textContent = it[0];
      var t = document.createElement('span');
      var small = document.createElement('small');
      small.textContent = it[1];
      t.append(small, document.createTextNode(it[2]));
      a.append(ic, t);
      li.appendChild(a);
      list.appendChild(li);
    });

    $('contact-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var ok = true;
      ['nome', 'email', 'msg'].forEach(function (n) {
        var el = f.elements[n];
        var valid = el.value.trim() !== '' && (n !== 'email' || /^\S+@\S+\.\S+$/.test(el.value.trim()));
        el.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      var note = $('form-note');
      if (!ok) { note.textContent = 'Preencha nome, um e-mail válido e a mensagem.'; return; }
      if (!c.email) { note.textContent = 'Defina o e-mail de contato em website/config.js para ativar o envio.'; return; }
      var body = f.elements.msg.value.trim() + '\n\n— ' + f.elements.nome.value.trim() + ' (' + f.elements.email.value.trim() + ')';
      location.href = 'mailto:' + c.email + '?subject=' + encodeURIComponent('Contato pelo site AgroScan') + '&body=' + encodeURIComponent(body);
      note.textContent = 'Abrimos o seu aplicativo de e-mail com a mensagem pronta.';
    });
  }

  // ---------------------------------------------------------- menu, rodapé e animação ao rolar
  function initChrome() {
    var burger = $('burger');
    var links = $('links');
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    $('year').textContent = new Date().getFullYear();
    document.querySelectorAll('[data-slogan]').forEach(function (el) { el.textContent = cfg.slogan || ''; });
    var repo = $('repo-link');
    if (cfg.repoUrl) repo.href = cfg.repoUrl; else repo.parentNode.style.display = 'none';
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  renderQr();
  renderTeam();
  renderContact();
  initChrome();
  initReveal();
})();
