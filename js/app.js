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
    div.dataset.src = item.src;

    // Preview i sidpanelen
    let previewHtml;
    if (item.type === 'video') {
      previewHtml = `
        <iframe
          src="${item.src}"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowfullscreen
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
        <span class="description">${item.description}</span>
        <span class="tag">${item.tag}</span>
        <button class="open-new">Öppna i nytt fönster</button>
      </div>
    `;

    // Funktion för att visa innehåll i huvudfönstret
    function openViewer() {
      viewer.innerHTML = '';

      // "Öppna i nytt fönster"-knapp i visaren
      const newWindowBtn = document.createElement('button');
      newWindowBtn.textContent = 'Öppna i nytt fönster';
      newWindowBtn.className = 'open-new';
      newWindowBtn.style.position = 'absolute';
      newWindowBtn.style.top = '1rem';
      newWindowBtn.style.right = '1rem';
      newWindowBtn.addEventListener('click', e => {
        e.stopPropagation();
        window.open(item.src, '_blank', 'noopener');
      });

      // Om du har en mp4‐länk i data.json så visas en video‐tag – ger ljud i mobil:
      if (item.mp4) {
        const videoEl = document.createElement('video');
        videoEl.controls = true;
        videoEl.playsInline = true;
        videoEl.style.position = 'absolute';
        videoEl.style.top = '0';
        videoEl.style.left = '0';
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        const sourceEl = document.createElement('source');
        sourceEl.src = item.mp4;
        sourceEl.type = 'video/mp4';
        videoEl.appendChild(sourceEl);
        viewer.appendChild(videoEl);
      } else {
        // Default embed-iframe
        const iframe = document.createElement('iframe');
        const sep = item.src.includes('?') ? '&' : '?';
        const src = item.src.includes('embed') ? item.src : `${item.src}${sep}embed`;
        iframe.src = src;
        iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        iframe.title = item.title;
        viewer.appendChild(iframe);
      }

      viewer.appendChild(newWindowBtn);
    }

    // Klick och Enter för att öppna i viewer
    div.addEventListener('click', openViewer);
    div.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openViewer();
    });

    // "Öppna i nytt fönster"-knapp i sidpanelen
    div.querySelector('.open-new').addEventListener('click', e => {
      e.stopPropagation();
      window.open(item.src, '_blank', 'noopener');
    });

    container.appendChild(div);
  });

  // Auto‐öppna första post (video eller rapport)
  const first = content.find(c => c.type === 'video' || c.type === 'report');
  if (first) {
    const firstDiv = document.querySelector(`.sidebar-item[data-src="${first.src}"]`);
    if (firstDiv) firstDiv.click();
  }

  // Filtrerings‐checkboxar
  document.getElementById('showVideos').addEventListener('change', filterItems);
  document.getElementById('showReports').addEventListener('change', filterItems);
}

function filterItems() {
  const showVideos = document.getElementById('showVideos').checked;
  const showReports = document.getElementById('showReports').checked;
  document.querySelectorAll('.sidebar-item').forEach(item => {
    const type = item.dataset.type;
    const visible = (type === 'video' && showVideos) || (type === 'report' && showReports);
    item.classList.toggle('hidden', !visible);
  });
}
