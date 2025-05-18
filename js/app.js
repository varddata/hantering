// js/app.js
document.addEventListener('DOMContentLoaded', main);

async function main() {
  const featuredList = document.getElementById('featuredList');
  const container    = document.getElementById('itemList');
  const reportList   = document.getElementById('reportList');
  const viewer       = document.getElementById('viewer');

  let items;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(res.statusText);
    items = await res.json();
  } catch (e) {
    container.textContent = 'Kunde inte ladda innehåll.';
    console.error(e);
    return;
  }

  // Gemensam fabrik för listobjekt
  function makeItem(item) {
    const div = document.createElement('div');
    div.className    = 'sidebar-item';
    div.tabIndex     = 0;
    div.setAttribute('role','button');
    div.dataset.type = item.type;
    div.dataset.src  = item.src;
    if (item.featured) div.classList.add('featured');

    // Preview: Canva-iframe eller bild
    let preview;
    if (item.type === 'video') {
      const sep = item.src.includes('?') ? '&' : '?';
      const embed = item.src.includes('embed')
        ? item.src
        : item.src + sep + 'embed';
      preview = `<iframe src="${embed}" allow="autoplay; fullscreen" loading="lazy" title="${item.title}"></iframe>`;
    } else if (item.preview) {
      preview = `<img src="${item.preview}" alt="Förhandsvisning" loading="lazy">`;
    } else {
      preview = `<img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                     alt="PDF" loading="lazy">`;
    }

    div.innerHTML = `
      ${preview}
      <div class="info">
        <span class="title">${item.title}</span>
        <span class="description">${item.description || ''}</span>
        <span class="tag">${item.tag || ''}</span>
        <button class="open-new">Öppna i nytt fönster för ljud</button>
      </div>`;

    // Klick eller Enter → visa i viewer
    div.addEventListener('click', () => showInViewer(item));
    div.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') showInViewer(item);
    });

    // Öppna i nytt fönster-knapp
    div.querySelector('.open-new').addEventListener('click', e => {
      e.stopPropagation();
      pauseCurrent();
      window.open(item.mp4 || item.src, '_blank', 'noopener');
    });

    return div;
  }

  // Rendera alla listor
  items.forEach(item => {
    const el = makeItem(item);
    if (item.featured) featuredList.appendChild(el);
    else if (item.type === 'report') reportList.appendChild(el);
    else container.appendChild(el);
  });

  // Initial visning: första featured eller första video
  const first = items.find(i => i.featured) || items.find(i => i.type==='video');
  if (first) showInViewer(first);

  // Visa i huvudfönster
  function showInViewer(item) {
    pauseCurrent();
    viewer.innerHTML = '';
    // Spelare
    if (item.mp4) {
      const v = document.createElement('video');
      v.controls    = true;
      v.playsInline = true;
      v.src         = item.mp4;
      viewer.appendChild(v);
    } else {
      const iframe = document.createElement('iframe');
      const sep    = item.src.includes('?') ? '&' : '?';
      iframe.src            = item.src.includes('embed')
                              ? item.src
                              : item.src + sep + 'embed';
      iframe.allow          = 'autoplay; fullscreen';
      iframe.allowFullscreen = true;
      iframe.loading        = 'lazy';
      iframe.title          = item.title;
      viewer.appendChild(iframe);
    }
    // knapp i viewer
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

  // Pausa/töm tidigare spelare
  function pauseCurrent() {
    const v = viewer.querySelector('video');
    if (v) v.pause();
    const i = viewer.querySelector('iframe');
    if (i) i.src = '';
  }

  // Filter-funktion
  document.getElementById('showVideos').addEventListener('change', filter);
  document.getElementById('showReports').addEventListener('change', filter);
  function filter() {
    const sv = document.getElementById('showVideos').checked;
    const sr = document.getElementById('showReports').checked;
    document.querySelectorAll('.sidebar-item').forEach(div => {
      const t = div.dataset.type;
      const ok = (t==='video' && sv) || (t==='report' && sr) || div.classList.contains('featured');
      div.classList.toggle('hidden', !ok);
    });
  }
}
