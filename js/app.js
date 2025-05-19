// js/app.js
document.addEventListener('DOMContentLoaded', main);

async function main() {
  const featuredList = document.getElementById('featuredList');
  const container    = document.getElementById('itemList');
  const reportList   = document.getElementById('reportList');
  const viewer       = document.getElementById('viewer');
  const showVideos   = document.getElementById('showVideos');
  const showReports  = document.getElementById('showReports');
  const sortOrder    = document.getElementById('sortOrder');

  let items;
  try {
    const res = await fetch('./data.json');
    if (!res.ok) throw new Error(res.statusText);
    items = await res.json();
  } catch (e) {
    container.textContent = 'Kunde inte ladda innehåll.';
    console.error(e);
    return;
  }

  function makeItem(item) {
    const div = document.createElement('div');
    div.className    = 'sidebar-item';
    div.tabIndex     = 0;
    div.setAttribute('role','button');
    div.dataset.type = item.type;
    div.dataset.src  = item.src;

    // Visa alltid preview-bild om den finns
    let previewHtml;
    if (item.preview) {
      previewHtml = `<img src="${item.preview}" alt="Förhandsvisning" loading="lazy">`;
    } else {
      // PDF-fallback
      previewHtml = `<img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                        alt="PDF" loading="lazy">`;
    }

    div.innerHTML = `
      ${previewHtml}
      <div class="info">
        <span class="title">${item.title}</span>
        <span class="description">${item.description||''}</span>
        <span class="tag">${item.tag||''}</span>
      </div>`;

    div.addEventListener('click', () => selectItem(div, item));
    div.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') selectItem(div, item);
    });
    return div;
  }

function sortItems(list) {
  const mode = sortOrder.value = 'recommended';
  if (mode === 'recommended') {
    // sortera efter ditt nya order‐fält
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
  } else if (mode === 'date') {
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } else if (mode === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  // 'default' behåller listans ordning i data.json (ingen förändring)
}

  function render() {
    let featured = items.filter(i=>i.featured);
    if (!featured.length) featured = items.filter(i=>i.type==='video').slice(0,3);

    let reports = items.filter(i=>i.type==='report');
    let others  = items.filter(i=>i.type==='video' && !featured.includes(i));

    sortItems(featured);
    sortItems(others);
    sortItems(reports);

    featuredList.innerHTML = '';
    container.innerHTML    = '';
    reportList.innerHTML   = '';

    featured.forEach(i=>featuredList.appendChild(makeItem(i)));
    others.forEach(i=>container.appendChild(makeItem(i)));
    reports.forEach(i=>reportList.appendChild(makeItem(i)));

    const first = featured[0]||others[0];
    if (first) selectItem(
      featured[0] ? featuredList.children[0] : container.children[0],
      first
    );
  }

  function selectItem(div, item) {
    pauseCurrent();
    viewer.innerHTML = '';

    // Embed in huvudvisaren
    if (item.mp4) {
      const v = document.createElement('video');
      v.controls=true; v.playsInline=true; v.src=item.mp4;
      viewer.appendChild(v);
    } else {
      const iframe = document.createElement('iframe');
      const sep = item.src.includes('?')?'&':'?';
      iframe.src = item.src.includes('embed')?item.src:item.src+sep+'embed';
      iframe.allow='autoplay; fullscreen';
      iframe.allowFullscreen=true;
      iframe.loading='lazy';
      iframe.title=item.title;
      viewer.appendChild(iframe);
    }

    // Mobil/padda: overlay-länk för nytt fönster
    if (window.innerWidth <= 900) {
      const link = document.createElement('a');
      link.href   = item.mp4||item.src;
      link.target = '_blank';
      link.rel    = 'noopener';
      Object.assign(link.style, {
        position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:10
      });
      viewer.appendChild(link);
    }

    // Markera aktiv
    document.querySelectorAll('.sidebar-item').forEach(el=>el.classList.remove('active'));
    div.classList.add('active');

    // Mobilt scroll: flytta upp och scrolla in
    if (window.innerWidth <= 900) {
      const parent = div.parentNode;
      parent.prepend(div);
      div.scrollIntoView({behavior:'smooth',block:'start'});
      viewer.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  function pauseCurrent() {
    const v = viewer.querySelector('video'); if(v) v.pause();
    const i = viewer.querySelector('iframe'); if(i) i.src='';
  }

  function filterAndRender() {
    render();
    document.querySelectorAll('.sidebar-item').forEach(div=>{
      const t = div.dataset.type;
      const isTop = div.parentNode.id==='featuredList';
      const keep = isTop ||
                   (t==='video' && showVideos.checked) ||
                   (t==='report' && showReports.checked);
      div.classList.toggle('hidden', !keep);
    });
  }

  showVideos.addEventListener('change', filterAndRender);
  showReports.addEventListener('change', filterAndRender);
  sortOrder.addEventListener('change', filterAndRender);

  filterAndRender();
}
