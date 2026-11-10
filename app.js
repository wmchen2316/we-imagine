/* WE IMAGINE 空間攝影作品集：首頁篩選、作品頁照片牆與看大圖。資料來自 data.js（build.py 產生）。 */
(() => {
  const P = window.PROJECTS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const meta = (p) => [p.type, p.credit, p.year, p.photos.length + ' 張'].filter(Boolean).join('　');

  if (document.body.dataset.page === 'home') home();
  if (document.body.dataset.page === 'project') project();

  function home() {
    const works = $('#works'), filters = $('#filters');
    const types = ['全部', ...new Set(P.map((p) => p.type))];
    works.innerHTML = P.map((p, i) => {
      const c = p.photos.find((x) => x.f === p.cover) || p.photos[0];
      const base = `img/${p.slug}/${c.f}`;
      return `<li data-type="${esc(p.type)}" style="view-transition-name:w-${p.slug}">
        <a href="project.html?p=${p.slug}">
          <div class="cover"><img src="${base}-s.jpg" srcset="${base}-s.jpg 1000w, ${base}-l.jpg 2400w" sizes="(max-width:760px) 100vw, 50vw"
            width="${c.w}" height="${c.h}" alt="${esc(p.title)} 空間攝影" ${i ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'}></div>
          <h2>${esc(p.title)}</h2><p>${esc(meta(p))}</p>
        </a></li>`;
    }).join('');
    filters.innerHTML = types.map((t) => {
      const n = t === '全部' ? P.length : P.filter((p) => p.type === t).length;
      return `<button type="button" data-type="${esc(t)}" aria-pressed="false">${esc(t)}<span>${n}</span></button>`;
    }).join('');

    function apply(type) {
      let lead = false;
      for (const li of works.children) {
        const on = type === '全部' || li.dataset.type === type;
        li.hidden = !on;
        const isLead = on && !lead;
        if (isLead) lead = true;
        li.classList.toggle('is-lead', isLead);
        $('img', li).sizes = isLead ? '100vw' : '(max-width:760px) 100vw, 50vw';
      }
      for (const b of filters.children) b.setAttribute('aria-pressed', String(b.dataset.type === type));
    }
    function set(type, animate) {
      if (!types.includes(type)) type = '全部';
      if (animate && document.startViewTransition && !reduce) document.startViewTransition(() => apply(type)); else apply(type);
      const url = new URL(location.href);
      type === '全部' ? url.searchParams.delete('type') : url.searchParams.set('type', type);
      try { history.replaceState(null, '', url); } catch (e) { /* file:// 下部分瀏覽器不允許，略過 */ }
    }
    filters.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.type, true); });
    set(new URLSearchParams(location.search).get('type') || '全部', false);
  }

  function project() {
    const q = new URLSearchParams(location.search);
    const idx = P.findIndex((x) => x.slug === q.get('p'));
    const gallery = $('#gallery');
    if (idx < 0) {
      $('#title').textContent = '找不到這件作品';
      gallery.innerHTML = '<p class="empty">網址可能打錯了。回到<a href="index.html#works">全部作品</a>重新選一件。</p>';
      $('#next').hidden = true;
      return;
    }
    const p = P[idx], photos = p.photos, dir = `img/${p.slug}/`;
    document.title = `${p.title}｜WE IMAGINE 陳為明 空間攝影`;
    $('#title').textContent = p.title;
    $('#facts').innerHTML = [['類型', p.type], ['設計', p.credit], ['年份', p.year], ['照片', photos.length + ' 張']]
      .filter((r) => r[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    const alt = (x, i) => `${p.title}${x.g ? ' ' + x.g : ''}，第 ${i + 1} 張`;
    const tile = (x, i) => `<li style="--ar:${(x.w / x.h).toFixed(4)}"><button type="button" data-i="${i}" aria-label="看大圖：${esc(alt(x, i))}">
      <img src="${dir}${x.f}-s.jpg" width="${x.w}" height="${x.h}" alt="${esc(alt(x, i))}" ${i < 3 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}></button></li>`;
    const groups = [...new Set(photos.map((x) => x.g || ''))];
    gallery.innerHTML = groups.map((g) => (g ? `<h2 class="group">${esc(g)}</h2>` : '') +
      `<ul class="rows">${photos.map((x, i) => ((x.g || '') === g ? tile(x, i) : '')).join('')}</ul>`).join('');
    const nx = P[(idx + 1) % P.length];
    $('#next').href = `project.html?p=${nx.slug}`;
    $('#next strong').textContent = nx.title;

    // 看大圖
    const lb = $('#lb'), img = $('#lb-img'), count = $('#lb-count');
    let cur = 0;
    const setUrl = (i) => { const u = new URL(location.href); i == null ? u.searchParams.delete('i') : u.searchParams.set('i', i + 1); try { history.replaceState(null, '', u); } catch (e) {} };
    function show(i) {
      cur = (i + photos.length) % photos.length;
      const x = photos[cur];
      img.src = `${dir}${x.f}-l.jpg`;
      img.alt = alt(x, cur);
      count.textContent = `${cur + 1} / ${photos.length}`;
      const n = photos[(cur + 1) % photos.length];
      new Image().src = `${dir}${n.f}-l.jpg`;
      setUrl(cur);
    }
    function open(i) { show(i); if (!lb.open) lb.showModal(); }
    gallery.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) open(+b.dataset.i); });
    $('#lb-prev').addEventListener('click', () => show(cur - 1));
    $('#lb-next').addEventListener('click', () => show(cur + 1));
    $('#lb-close').addEventListener('click', () => lb.close());
    $('#lb-stage').addEventListener('click', (e) => { if (e.target.id === 'lb-stage') lb.close(); });
    lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    lb.addEventListener('close', () => setUrl(null));
    let sx = null;
    img.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    img.addEventListener('pointerup', (e) => { if (sx == null) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 48) show(cur + (d < 0 ? 1 : -1)); });
    img.draggable = false;
    const start = +q.get('i');
    if (start >= 1 && start <= photos.length) open(start - 1);
  }
})();
