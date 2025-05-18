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

    // Om video: visa en iframe i sidpanelen, annars bild eller PDF-ikon
    let preview;
    if (item.type === 'video') {
      preview = `
        <iframe
          src="${item.src}"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowfullscreen
          loading="lazy"
          title="${item.title}">
        </iframe>`;
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
        <span class="description">${item.description}</span>
        <span class="tag">${item.tag}</span>
      </div>
    `;

    function openViewer() {
      // Bygger korrekta embed-parametrar (ingen dubbel ?)
      const separator = item.src.includes('?') ? '&' : '?';
      const src = item.src.includes('embed') ? item.src : `${item.src}${separator}embed`;

      viewer.innerHTML = `
        <iframe
          src="${src}"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowfullscreen
          loading="lazy"
          title="${item.title}">
        </iframe>`;
    }

    div.addEventListener('click', openViewer);
    div.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openViewer();
    });

    container.appendChild(div);
  });

  // Visa första video automatiskt (om det finns någon)
  const firstVideo = content.find(c => c.type === 'video');
  if (firstVideo) {
    document.querySelector(`.sidebar-item[data-src="${firstVideo.src}"]`).click();
  }

  // Koppla filter-checkboxar
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
