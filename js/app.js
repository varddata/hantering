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

    let preview;
    if (item.type === 'video') {
      const sep   = item.src.includes('?') ? '&' : '?';
      const embed = item.src.includes('embed')
        ? item.src
        : item.src + sep + 'embed';
      preview = `<iframe src="${embed}" allow="autoplay; fullscreen" loading="lazy" title="${item.title}"></iframe>`;
    } else if (item.preview) {
      preview = `<img src="${item.preview}" alt="Preview" loading="lazy">`;
    } else {
      preview = `<img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF" loading="lazy">`;
    }

    div.innerHTML = `
      ${preview}
      <div class="info">
        <span class="title">${item.title}</span>
        <span class="description">${item.description||''}</span>
        <span class="tag">${item.tag}</span>
      </div>`;

    div.addEventListener('click', () => selectItem(div, item));
    div.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') selectItem(div, item);
    });

    return div;
  }

  function sortItems(list) {
    const mode = sortOrder.value;
    if (mode==='date') {
      list.sort((a,b)=> new Date(b.date||0)-new Date(a.date||0));
    } else if (mode==='title') {
      list.sort((a,b)=> a.title.localeCompare(b.title));
    }
  }

  function render() {
    let featured = items.filter(i=>i.featured);
    if (!featured.length) featured = items.filter(i=>i.type==='video').slice(0,3);

    let reports = items.filter(i=>i.type==='report');
    let others  = items.filter(i=>i.type==='video' && !featured.includes(i));

    sortItems(featured); sortItems(others); sortItems(reports);

    featuredList.innerHTML='';
    container.innerHTML='';
    reportList.innerHTML='';

    featured.forEach(i=>featuredList.appendChild(makeItem(i)));
    others.forEach(i=>container.appendChild(makeItem(i)));
    reports.forEach(i=>reportList.appendChild(makeItem(i)));

    const first = featured[0]||others[0];
    if (first) selectItem(featuredList.firstChild||container.firstChild, first);
  }

  function selectItem(div, item) {
    pauseCurrent();
    viewer.innerHTML='';

    if (item.mp4) {
      const v = document.createElement('video');
      v.controls=true; v.playsInline=true; v.src=item.mp4;
      viewer.appendChild(v);
    } else {
      const iframe = document.createElement('iframe');
      const sep = item.src.includes('?')?'&':'?';
      iframe.src = item.src.includes('embed')
        ? item.src
        : item.src + sep + 'embed';
      iframe.allow='autoplay; fullscreen';
      iframe.allowFullscreen=true;
      iframe.loading='lazy';
      iframe.title=item.title;
      viewer.appendChild(iframe);
    }

    // mobil: klick i viewer öppnar nytt fönster
    if (window.innerWidth <= 900) {
      viewer.onclick = () => window.open(item.mp4||item.src,'_blank','noopener');
    } else {
      viewer.onclick = null;
    }

    // scrolla och lyft aktiv i sidlista på mobilen
    if (window.innerWidth <= 900) {
      div.parentNode.prepend(div);
      div.scrollIntoView({behavior:'smooth',block:'start'});
      viewer.scrollIntoView({behavior:'smooth',block:'start'});
    }

    // markera aktiv
    document.querySelectorAll('.sidebar-item').forEach(el=>el.classList.remove('active'));
    div.classList.add('active');
  }

  function pauseCurrent() {
    const v = viewer.querySelector('video'); if(v) v.pause();
    const i = viewer.querySelector('iframe'); if(i) i.src='';
  }

  function filterAndRender() {
    render();
    document.querySelectorAll('.sidebar-item').forEach(div=>{
      const t = div.dataset.type;
      const keep = (t==='video'&&showVideos.checked)
                || (t==='report'&&showReports.checked)
                || div.closest('.top-list')!==null;
      div.classList.toggle('hidden',!keep);
    });
  }

  showVideos.addEventListener('change', filterAndRender);
  showReports.addEventListener('change', filterAndRender);
  sortOrder.addEventListener('change', filterAndRender);

  filterAndRender();
}
