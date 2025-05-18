// js/app.js
document.addEventListener('DOMContentLoaded', loadContent);

async function loadContent() {
  const container = document.getElementById('itemList');
  const viewer = document.getElementById('viewer');

  let content;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(res.statusText);
    content = await res.json();
  } catch (e) {
    container.innerText = 'Kunde inte ladda innehåll.';
    console.error(e);
    return;
  }

  container.innerHTML = '';
  content.forEach(item => {
    const div = document.createElement('div');
    div.className = 'sidebar-item';
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    div.dataset.type = item.type;
    div.dataset.src  = item.src;

    // SIDOPANEL: Endast bild eller generic placeholder för video
    let previewHtml;
    if (item.type === 'video') {
      if (item.preview) {
        previewHtml = `<img src="${item.preview}" alt="Förhandsvisning" loading="lazy">`;
      } else {
        previewHtml = `<div class="video-placeholder"></div>`;
      }
    } else if (item.preview) {
      previewHtml = `<img src="${item.preview}" alt="Förhandsvisning" loading="lazy">`;
    } else {
      previewHtml = `<img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF" loading="lazy">`;
    }

    div.innerHTML = `
      ${previewHtml}
      <div class="info">
        <span class="title">${item.title}</span>
        <span class="description">${item.description}</span>
        <span class="tag">${item.tag}</span>
        <button class="open-new">Öppna i nytt fönster</button>
      </div>
    `;

    // Funktion för att visa i huvudfönstret
    function openViewer() {
      viewer.innerHTML = '';
      // "Öppna i nytt fönster" i visaren
      const btn = document.createElement('button');
      btn.textContent = 'Öppna i nytt fönster';
      btn.className = 'open-new';
      btn.style.position = 'absolute';
      btn.style.top  = '1rem';
      btn.style.right= '1rem';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        window.open(item.src, '_blank', 'noopener');
      });
      // Välj mp4 eller embed
      if (item.mp4) {
        const vid = document.createElement('video');
        vid.controls    = true;
        vid.playsInline = true;
        vid.style.width = '100%';
        vid.style.height= '100%';
        const srcEl    = document.createElement('source');
        srcEl.src      = item.mp4;
        srcEl.type     = 'video/mp4';
        vid.appendChild(srcEl);
        viewer.appendChild(vid);
      } else {
        const iframe = document.createElement('iframe');
        const sep    = item.src.includes('?') ? '&' : '?';
        iframe.src       = item.src.includes('embed') ? item.src : `${item.src}${sep}embed`;
        iframe.allow     = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.loading   = 'lazy';
        iframe.title     = item.title;
        viewer.appendChild(iframe);
      }
      viewer.appendChild(btn);
    }

    // Klick / Enter öppnar
    div.addEventListener('click', openViewer);
    div.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openViewer();
    });
    // Öppna i nytt fönster från sidpanelen
    div.querySelector('.open-new').addEventListener('click', e => {
      e.stopPropagation();
      window.open(item.src, '_blank', 'noopener');
    });

    container.appendChild(div);
  });

  // Auto-öppna första
  const first = content.find(c => c.type==='video' || c.type==='report');
  if (first) {
    document.querySelector(`.sidebar-item[data-src="${first.src}"]`).click();
  }

  // Filtrering
  document.getElementById('showVideos').addEventListener('change', filterItems);
  document.getElementById('showReports').addEventListener('change', filterItems);
}

function filterItems() {
  const showVideos  = document.getElementById('showVideos').checked;
  const showReports = document.getElementById('showReports').checked;
  document.querySelectorAll('.sidebar-item').forEach(item => {
    const type = item.dataset.type;
    const vis  = (type==='video' && showVideos) || (type==='report' && showReports);
    item.classList.toggle('hidden', !vis);
  });
}
