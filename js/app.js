// js/app.js
document.addEventListener('DOMContentLoaded', main);

async function main() {
  const featuredList = document.getElementById('featuredList');
  const container    = document.getElementById('itemList');
  const reportList   = document.getElementById('reportList');
  const viewer       = document.getElementById('viewer');

  let items;
  try {
    const res = await fetch('./data.json');
    if (!res.ok) throw new Error(res.statusText);
    items = await res.json();
  } catch (e) {
    container.textContent = 'Kunde inte ladda innehåll.';
    console.error('Fetch error:', e);
    return;
  }

  // Skapar en .sidebar-item för både top-list, vänster & högerlistor
  function makeItem(item) {
    const div = document.createElement('div');
    div.className    = 'sidebar-item';
    div.tabIndex     = 0;
    div.setAttribute('role','button');
    div.dataset.type = item.type;
    div.dataset.src  = item.src;

    // Preview: Canva-iframe eller bild eller ikon
    let previewHtml;
    if (item.type === 'video') {
      const sep   = item.src.includes('?') ? '&' : '?';
      const embed = item.src.includes('embed')
        ? item.src
        : item.src + sep + 'embed';
      previewHtml = `
        <iframe
          src="${embed}"
          allow="autoplay; fullscreen"
          loading="lazy"
          title="${item.title}">
        </iframe>`;
    } else if (item.preview) {
      previewHtml = `<img src="${item.preview}" alt="Förhandsvisning" loading="lazy">`;
    } else {
      previewHtml = `<img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                        alt="PDF" loading="lazy">`;
    }

    div.innerHTML = `
      ${previewHtml}
      <div class="info">
        <span class="title">${item.title}</span>
        <span class="description">${item.description || ''}</span>
        <span class="tag">${item.tag || ''}</span>
        <button class="open-new">Öppna i nytt fönster för ljud</button>
      </div>`;

    // Klick / Enter → visa i viewer
    div.addEventListener('click', () => showInViewer(item));
    div.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') showInViewer(item);
    });

    // Öppna i nytt fönster-knapp (pausar först)
    div.querySelector('.open-new').addEventListener('click', e => {
      e.stopPropagation();
      pauseCurrent();
      window.open(item.mp4 || item.src, '_blank', 'noopener');
    });

    return div;
  }

  // Hämta ut valda och dela upp i listor
  let featuredItems = items.filter(i => i.featured);
  if (featuredItems.length === 0) {
    featuredItems = items.filter(i => i.type === 'video').slice(0, 3);
  }
  const reports     = items.filter(i => i.type === 'report');
  const normalItems = items
    .filter(i => i.type === 'video')
    .filter(i => !featuredItems.includes(i));

  // Rendera top-listan
  featuredList.innerHTML = '';
  featuredItems.forEach(item => featuredList.appendChild(makeItem(item)));

  // Rendera vänsterlistan (alla icke-featured filmer)
  container.innerHTML = '';
  normalItems.forEach(item => container.appendChild(makeItem(item)));

  // Rendera högerlistan (rapporter)
  reportList.innerHTML = '';
  reports.forEach(item => reportList.appendChild(makeItem(item)));

  // Visa första i viewer
  const first = featuredItems[0] || normalItems[0];
  if (first) showInViewer(first);

  // Koppla filter
  document.getElementById('showVideos').addEventListener('change', filter);
  document.getElementById('showReports').addEventListener('change', filter);

  // Visar valt objekt i content-display
  function showInViewer(item) {
    pauseCurrent();
    viewer.innerHTML = '';

    if (item.mp4) {
      const v = document.createElement('video');
      v.controls    = true;
      v.playsInline = true;
      v.src         = item.mp4;
      viewer.appendChild(v);
    } else {
      const iframe = document.createElement('iframe');
      const sep    = item.src.includes('?') ? '&' : '?';
      iframe.src           = item.src.includes('embed')
                              ? item.src
                              : item.src + sep + 'embed';
      iframe.allow         = 'autoplay; fullscreen';
      iframe.allowFullscreen = true;
      iframe.loading       = 'lazy';
      iframe.title         = item.title;
      viewer.appendChild(iframe);
    }

    const btn = document.createElement('button');
    btn.textContent = 'Öppna i nytt fönster för ljud';
    btn.className   = 'open-new';
    btn.style.position = 'absolute';
    btn.style.top      = '1rem';
    btn.style.right    = '1rem';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      pauseCurrent();
      window.open(item.mp4 || item.src, '_blank', 'noopener');
    });
    viewer.appendChild(btn);
  }

  // Pausar/stoppar befintlig spelare
  function pauseCurrent() {
    const v = viewer.querySelector('video');
    if (v) v.pause();
    const i = viewer.querySelector('iframe');
    if (i) i.src = '';
  }

  // Filtreringsfunktion
  function filter() {
    const sv = document.getElementById('showVideos').checked;
    const sr = document.getElementById('showReports').checked;
    document.querySelectorAll('.sidebar-item').forEach(div => {
      const t = div.dataset.type;
      const isFeatured = featuredItems.some(f => f.src === div.dataset.src);
      const ok = isFeatured ||
                 (t === 'video' && sv) ||
                 (t === 'report' && sr);
      div.classList.toggle('hidden', !ok);
    });
  }
}
