const API_BASE = 'https://expresstravels.up.railway.app';

let map;
let currentRouteId = 'all';
let rafId = null;
let locIntervalId = null;
let polylineGroup;
let markerGroup;
const busData = {};

const panel = () => document.getElementById('busDetails');
const panelTitle = () => document.getElementById('bd-title');
const panelBody = () => document.getElementById('bd-content');

const busIcons = {
  onTime: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/18042/18042856.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  delayed: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/18357/18357012.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
};

const routesCoordinates = {
  101: [[6.9319,79.8478],[6.9660,79.9000],[7.0500,80.0000],[7.2000,80.2000],[7.2955,80.6356]],
  102: [[6.9319,79.8478],[6.8000,79.9500],[6.6000,80.1000],[6.0367,80.2170]],
  103: [[6.9319,79.8478],[7.5000,79.9000],[8.5000,80.0000],[9.6685,80.0074]],
  104: [[8.3122,80.4131],[7.9000,80.2000],[7.5000,80.0000],[6.9319,79.8478]],
  105: [[6.9319,79.8478],[6.7000,79.9000],[6.2000,80.3000],[5.9485,80.5353]]
};

function round2(n){return Math.round(n*100)/100;}
function fmtTime(ts){try{return new Date(ts).toLocaleTimeString();}catch{return String(ts);}}
function getPositionAlongRoute(routeId,t){
  const coords = routesCoordinates[routeId];
  if(!coords) return [6.9271,79.8612];
  const totalSegments = coords.length-1;
  const segmentIndex = Math.floor(t*totalSegments);
  const segmentT = (t*totalSegments)-segmentIndex;
  const start = coords[segmentIndex];
  const end = coords[segmentIndex+1]||coords[coords.length-1];
  return [start[0]+(end[0]-start[0])*segmentT, start[1]+(end[1]-start[1])*segmentT];
}

// ---- map setup ----
function initMap(){
  map = L.map('map').setView([7.8731,80.7718],7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  polylineGroup=L.layerGroup().addTo(map);
  markerGroup=L.layerGroup().addTo(map);
  addMapLegend();
  const btn=document.getElementById('bd-close');
  if(btn) btn.addEventListener('click',()=>panel().classList.remove('open'));
}

function drawPolylines(){
  polylineGroup.clearLayers();
  if(currentRouteId==='all'){
    for(const rid in routesCoordinates) L.polyline(routesCoordinates[rid],{color:'blue',weight:5,opacity:0.4}).addTo(polylineGroup);
  } else {
    const coords = routesCoordinates[currentRouteId];
    if(coords) L.polyline(coords,{color:'blue',weight:5,opacity:0.9}).addTo(polylineGroup);
  }
}

function addMapLegend(){
  const legend=L.control({position:'bottomright'});
  legend.onAdd=function(){
    const div=L.DomUtil.create('div','legend');
    div.innerHTML=`<h4>Bus Status</h4><i style="background: #27ae60"></i> On Time<br><i style="background: #e74c3c"></i> Delayed`;
    return div;
  };
  legend.addTo(map);
}

// ---- data fetching ----
async function fetchRoutes(){
  const res=await fetch(`${API_BASE}/routes`);
  const routes=await res.json();
  const select=document.getElementById('routeSelect');
  select.innerHTML='';
  const allOption=document.createElement('option'); allOption.value='all'; allOption.textContent='All Routes'; select.appendChild(allOption);
  routes.forEach(r=>{
    const option=document.createElement('option'); option.value=r.route_id; option.textContent=r.name; select.appendChild(option);
  });
  select.onchange=()=>{currentRouteId=select.value; drawPolylines(); fetchAndAnimateBuses();};
  select.selectedIndex=0; drawPolylines(); fetchAndAnimateBuses();
}

async function fetchAndAnimateBuses(){
  try{
    const url=currentRouteId==='all'?`${API_BASE}/buses`:`${API_BASE}/buses?route_id=${currentRouteId}`;
    const res=await fetch(url);
    const buses=await res.json();
    const toShow=currentRouteId==='all'?buses:buses.filter(b=>String(b.route_id)===String(currentRouteId));
    animateBuses(toShow);
  }catch(err){console.error('Error fetching buses:',err);}
}

// ---- details panel logic ----
async function openDetails(bus_id){
  try{
    const res=await fetch(`${API_BASE}/buses/${bus_id}`);
    if(!res.ok) throw new Error('Bus not found');
    const bus=await res.json();
    let lat,lng; const bd=busData[bus_id];
    if(bd?.marker){const m=bd.marker.getLatLng(); lat=m.lat; lng=m.lng;}
    else if(bus.current_location){lat=bus.current_location.latitude; lng=bus.current_location.longitude;}
    let city='Unknown';
    if(typeof lat==='number' && typeof lng==='number'){
      try{const geo=await fetch(`${API_BASE}/geocode?lat=${lat}&lng=${lng}`); if(geo.ok){const j=await geo.json(); if(j.place) city=j.place;}}catch{}
    }
    panelTitle().textContent=`Bus ${bus.bus_id}`;
    panelBody().innerHTML=`
      <div class="details-row"><span>Bus ID:</span><strong>${bus.bus_id}</strong></div>
      <div class="details-row"><span>Route ID:</span><strong>${bus.route_id}</strong></div>
      <div class="details-row"><span>Status:</span><strong class="${bus.status==='On Time'?'status-on-time':'status-delayed'}">${bus.status}</strong></div>
      <div class="details-row"><span>Last Updated:</span><strong>${fmtTime(bus.last_updated)}</strong></div>
      <div class="details-row"><span>City (approx):</span><strong>${city}</strong></div>
      <div class="details-row"><span>Coordinates:</span><strong>${lat?.toFixed?lat.toFixed(5):lat||'-'}, ${lng?.toFixed?lng.toFixed(5):lng||'-'}</strong></div>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="bd-center" class="btn">Center on Map</button>
        <button id="bd-zoom" class="btn" style="background:#5c6bc0">Zoom In</button>
      </div>
    `;
    const centerBtn=document.getElementById('bd-center');
    const zoomBtn=document.getElementById('bd-zoom');
    if(centerBtn) centerBtn.onclick=()=>{if(typeof lat==='number'&&typeof lng==='number') map.panTo([lat,lng],{animate:true});};
    if(zoomBtn) zoomBtn.onclick=()=>{if(typeof lat==='number'&&typeof lng==='number') map.setView([lat,lng],Math.max(map.getZoom(),12),{animate:true});};
    panel().classList.add('open');
  }catch(e){panelTitle().textContent='Bus Details'; panelBody().innerHTML=`<div style="color:#e74c3c">Failed to load bus ${bus_id}.</div>`; panel().classList.add('open');}
}

// ---- main animation ----
async function animateBuses(routeBuses){
  if(rafId){cancelAnimationFrame(rafId); rafId=null;}
  if(locIntervalId){clearInterval(locIntervalId); locIntervalId=null;}
  const keepIds=new Set(routeBuses.map(b=>b.bus_id));
  for(const id of Object.keys(busData)){if(!keepIds.has(Number(id))){if(busData[id].marker) markerGroup.removeLayer(busData[id].marker); delete busData[id];}}
  const tableBody=document.getElementById('busList'); tableBody.innerHTML='';
  routeBuses.forEach(bus=>{
    if(!busData[bus.bus_id]) busData[bus.bus_id]={pos:Math.random(),dir:Math.random()<0.5?1:-1,marker:null};
    const [lat,lng]=getPositionAlongRoute(bus.route_id,busData[bus.bus_id].pos);
    const icon=bus.status==='On Time'?busIcons.onTime:busIcons.delayed;
    if(!busData[bus.bus_id].marker){const m=L.marker([lat,lng],{icon}).bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color:${bus.status==='On Time'?'green':'red'}">${bus.status}</span><br><em>Click marker or row for details</em>`); m.on('click',()=>openDetails(bus.bus_id)); busData[bus.bus_id].marker=m.addTo(markerGroup);}
    else{const m=busData[bus.bus_id].marker; m.setLatLng([lat,lng]); m.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color:${bus.status==='On Time'?'green':'red'}">${bus.status}</span><br><em>Click marker or row for details</em>`);}
    const row=document.createElement('tr'); row.style.cursor='pointer';
    row.innerHTML=`<td>${bus.bus_id}</td><td>${bus.route_id}</td><td class="${bus.status==='On Time'?'status-on-time':'status-delayed'}">${bus.status}</td><td id="loc-${bus.bus_id}">Loading…</td><td>${new Date(bus.last_updated).toLocaleString()}</td>`;
    row.addEventListener('click',()=>openDetails(bus.bus_id));
    tableBody.appendChild(row);
  });

  async function refreshLocationCells(){
    const coords=routeBuses.map(b=>{const m=busData[b.bus_id].marker.getLatLng(); return {bus_id:b.bus_id,key:`${round2(m.lat)},${round2(m.lng)}`,lat:m.lat,lng:m.lng};});
    setTimeout(()=>{coords.forEach(c=>{const cell=document.getElementById(`loc-${c.bus_id}`); if(cell&&cell.textContent==='Loading…') cell.textContent='Unknown';});},6000);
    try{
      const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),5000);
      const res=await fetch(`${API_BASE}/geocode/batch`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({coords:coords.map(c=>({lat:c.lat,lng:c.lng}))}),signal:controller.signal});
      clearTimeout(timeout);
      if(!res.ok) throw new Error('geocode HTTP error');
      const {results}=await res.json();
      coords.forEach(c=>{const cell=document.getElementById(`loc-${c.bus_id}`); if(cell) cell.textContent=results[c.key]||'Unknown';});
    }catch{coords.forEach(c=>{const cell=document.getElementById(`loc-${c.bus_id}`); if(cell) cell.textContent='Unknown';});}
  }

  await refreshLocationCells();
  locIntervalId=setInterval(refreshLocationCells,20000);

  const step=()=>{routeBuses.forEach(bus=>{const speed=0.00008+Math.random()*0.00012; busData[bus.bus_id].pos+=speed*busData[bus.bus_id].dir; if(busData[bus.bus_id].pos>1){busData[bus.bus_id].pos=1;busData[bus.bus_id].dir=-1;} else if(busData[bus.bus_id].pos<0){busData[bus.bus_id].pos=0;busData[bus.bus_id].dir=1;} const [lat,lng]=getPositionAlongRoute(bus.route_id,busData[bus.bus_id].pos); busData[bus.bus_id].marker.setLatLng([lat,lng]);});
    rafId=requestAnimationFrame(step);
  };
  rafId=requestAnimationFrame(step);
}

// ---- boot ----
initMap(); fetchRoutes();
setInterval(fetchAndAnimateBuses,30000);












// let map;
// let currentRouteId = 'all';

// // animation & geocode refresh handles
// let rafId = null;
// let locIntervalId = null;

// // layer groups so we can clear/redraw easily
// let polylineGroup;
// let markerGroup;

// // quick refs for details panel
// const panel = () => document.getElementById('busDetails');
// const panelTitle = () => document.getElementById('bd-title');
// const panelBody = () => document.getElementById('bd-content');

// // Bus icons
// const busIcons = {
//   onTime: L.icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/18042/18042856.png',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   }),
//   delayed: L.icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/18357/18357012.png',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   })
// };

// // Polylines aligned to your DB IDs
// const routesCoordinates = {
//   101: [ // Colombo → Kandy
//     [6.9319, 79.8478],
//     [6.9660, 79.9000],
//     [7.0500, 80.0000],
//     [7.2000, 80.2000],
//     [7.2955, 80.6356]
//   ],
//   102: [ // Colombo → Galle
//     [6.9319, 79.8478],
//     [6.8000, 79.9500],
//     [6.6000, 80.1000],
//     [6.0367, 80.2170]
//   ],
//   103: [ // Colombo → Jaffna
//     [6.9319, 79.8478],
//     [7.5000, 79.9000],
//     [8.5000, 80.0000],
//     [9.6685, 80.0074]
//   ],
//   104: [ // Anuradhapura → Colombo
//     [8.3122, 80.4131],
//     [7.9000, 80.2000],
//     [7.5000, 80.0000],
//     [6.9319, 79.8478]
//   ],
//   105: [ // Colombo → Matara
//     [6.9319, 79.8478],
//     [6.7000, 79.9000],
//     [6.2000, 80.3000],
//     [5.9485, 80.5353]
//   ]
// };

// // Track bus pos/dir/marker
// // structure: { [bus_id]: { pos, dir, marker, lastKnownLatLng? } }
// const busData = {};

// // ---- helpers ----
// function round2(n) { return Math.round(n * 100) / 100; }
// function fmtTime(ts) {
//   try { return new Date(ts).toLocaleTimeString(); } catch { return String(ts); }
// }
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // ---- map setup ----
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   polylineGroup = L.layerGroup().addTo(map);
//   markerGroup  = L.layerGroup().addTo(map);

//   addMapLegend();

//   // close details panel handler
//   const btn = document.getElementById('bd-close');
//   if (btn) btn.addEventListener('click', () => panel().classList.remove('open'));
// }

// function drawPolylines() {
//   polylineGroup.clearLayers();

//   if (currentRouteId === 'all') {
//     for (const rid in routesCoordinates) {
//       L.polyline(routesCoordinates[rid], { color: 'blue', weight: 5, opacity: 0.4 })
//         .addTo(polylineGroup);
//     }
//   } else {
//     const coords = routesCoordinates[currentRouteId];
//     if (coords) {
//       L.polyline(coords, { color: 'blue', weight: 5, opacity: 0.9 })
//         .addTo(polylineGroup);
//     }
//   }
// }

// function addMapLegend() {
//   const legend = L.control({ position: 'bottomright' });
//   legend.onAdd = function() {
//     const div = L.DomUtil.create('div', 'legend');
//     div.innerHTML = `
//       <h4>Bus Status</h4>
//       <i style="background: #27ae60"></i> On Time<br>
//       <i style="background: #e74c3c"></i> Delayed
//     `;
//     return div;
//   };
//   legend.addTo(map);
// }

// // ---- data fetching ----
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // wipe & add "All Routes"
//   select.innerHTML = '';
//   const allOption = document.createElement('option');
//   allOption.value = 'all';
//   allOption.textContent = 'All Routes';
//   select.appendChild(allOption);

//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.name;
//     select.appendChild(option);
//   });

//   select.onchange = () => {
//     currentRouteId = select.value;
//     drawPolylines();
//     fetchAndAnimateBuses();
//   };

//   select.selectedIndex = 0;
//   drawPolylines();
//   fetchAndAnimateBuses();
// }

// async function fetchAndAnimateBuses() {
//   try {
//     const url = currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`;
//     const res = await fetch(url);
//     const buses = await res.json();

//     const toShow = currentRouteId === 'all'
//       ? buses
//       : buses.filter(b => String(b.route_id) === String(currentRouteId));

//     animateBuses(toShow);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // ---- details panel logic ----
// async function openDetails(bus_id) {
//   try {
//     // 1) fetch bus
//     const res = await fetch(`/buses/${bus_id}`);
//     if (!res.ok) throw new Error('Bus not found');
//     const bus = await res.json();

//     // 2) compute current coords (prefer marker's live latlng)
//     let lat, lng;
//     const bd = busData[bus_id];
//     if (bd?.marker) {
//       const m = bd.marker.getLatLng();
//       lat = m.lat; lng = m.lng;
//     } else if (bus.current_location) {
//       lat = bus.current_location.latitude;
//       lng = bus.current_location.longitude;
//     }

//     // 3) reverse city via internal endpoint (best-effort)
//     let city = 'Unknown';
//     if (typeof lat === 'number' && typeof lng === 'number') {
//       try {
//         const geo = await fetch(`/geocode?lat=${lat}&lng=${lng}`);
//         if (geo.ok) {
//           const j = await geo.json();
//           if (j.place) city = j.place;
//         }
//       } catch {}
//     }

//     // 4) fill panel
//     panelTitle().textContent = `Bus ${bus.bus_id}`;
//     panelBody().innerHTML = `
//       <div class="details-row"><span>Bus ID:</span><strong>${bus.bus_id}</strong></div>
//       <div class="details-row"><span>Route ID:</span><strong>${bus.route_id}</strong></div>
//       <div class="details-row"><span>Status:</span>
//         <strong class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</strong>
//       </div>
//       <div class="details-row"><span>Last Updated:</span><strong>${fmtTime(bus.last_updated)}</strong></div>
//       <div class="details-row"><span>City (approx):</span><strong>${city}</strong></div>
//       <div class="details-row"><span>Coordinates:</span>
//         <strong>${(lat?.toFixed ? lat.toFixed(5) : lat) || '-'}, ${(lng?.toFixed ? lng.toFixed(5) : lng) || '-'}</strong>
//       </div>
//       <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
//         <button id="bd-center" class="btn">Center on Map</button>
//         <button id="bd-zoom" class="btn" style="background:#5c6bc0">Zoom In</button>
//       </div>
//     `;

//     // actions
//     const centerBtn = document.getElementById('bd-center');
//     const zoomBtn = document.getElementById('bd-zoom');
//     if (centerBtn) {
//       centerBtn.onclick = () => {
//         if (typeof lat === 'number' && typeof lng === 'number') {
//           map.panTo([lat, lng], { animate: true });
//         }
//       };
//     }
//     if (zoomBtn) {
//       zoomBtn.onclick = () => {
//         if (typeof lat === 'number' && typeof lng === 'number') {
//           map.setView([lat, lng], Math.max(map.getZoom(), 12), { animate: true });
//         }
//       };
//     }

//     // show panel
//     panel().classList.add('open');
//   } catch (e) {
//     panelTitle().textContent = 'Bus Details';
//     panelBody().innerHTML = `<div style="color:#e74c3c">Failed to load bus ${bus_id}.</div>`;
//     panel().classList.add('open');
//   }
// }

// // ---- main animation & table (with periodic batch geocode) ----
// async function animateBuses(routeBuses) {
//   // stop previous loops
//   if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
//   if (locIntervalId) { clearInterval(locIntervalId); locIntervalId = null; }

//   // remove markers of buses that are NOT in the new set
//   const keepIds = new Set(routeBuses.map(b => b.bus_id));
//   for (const id of Object.keys(busData)) {
//     if (!keepIds.has(Number(id))) {
//       if (busData[id].marker) {
//         markerGroup.removeLayer(busData[id].marker);
//       }
//       delete busData[id];
//     }
//   }

//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   // create/update markers for current set only
//   routeBuses.forEach(bus => {
//     if (!busData[bus.bus_id]) {
//       busData[bus.bus_id] = {
//         pos: Math.random(),
//         dir: Math.random() < 0.5 ? 1 : -1,
//         marker: null
//       };
//     }

//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//     const icon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     if (!busData[bus.bus_id].marker) {
//       const m = L.marker([lat, lng], { icon })
//         .bindPopup(
//           `<strong>Bus ${bus.bus_id}</strong><br>
//            Status: <span style="color:${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span><br>
//            <em>Click marker or row for details</em>`
//         );
//       m.on('click', () => openDetails(bus.bus_id));
//       busData[bus.bus_id].marker = m.addTo(markerGroup);
//     } else {
//       const m = busData[bus.bus_id].marker;
//       m.setLatLng([lat, lng]);
//       m.setPopupContent(
//         `<strong>Bus ${bus.bus_id}</strong><br>
//          Status: <span style="color:${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span><br>
//          <em>Click marker or row for details</em>`
//       );
//     }

//     const row = document.createElement('tr');
//     row.style.cursor = 'pointer';
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td id="loc-${bus.bus_id}">Loading…</td>
//       <td>${new Date(bus.last_updated).toLocaleString()}</td>
//     `;
//     row.addEventListener('click', () => openDetails(bus.bus_id));
//     tableBody.appendChild(row);
//   });

//   // geocode current marker positions
//   async function refreshLocationCells() {
//     const coords = routeBuses.map(b => {
//       const m = busData[b.bus_id].marker.getLatLng();
//       return { bus_id: b.bus_id, key: `${round2(m.lat)},${round2(m.lng)}`, lat: m.lat, lng: m.lng };
//     });

//     setTimeout(() => {
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell && cell.textContent === 'Loading…') cell.textContent = 'Unknown';
//       });
//     }, 6000);

//     try {
//       const controller = new AbortController();
//       const timeout = setTimeout(() => controller.abort(), 5000);

//       const res = await fetch('/geocode/batch', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ coords: coords.map(c => ({ lat: c.lat, lng: c.lng })) }),
//         signal: controller.signal
//       });
//       clearTimeout(timeout);
//       if (!res.ok) throw new Error('geocode HTTP error');

//       const { results } = await res.json();
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell) cell.textContent = results[c.key] || 'Unknown';
//       });
//     } catch {
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell) cell.textContent = 'Unknown';
//       });
//     }
//   }

//   await refreshLocationCells();
//   locIntervalId = setInterval(refreshLocationCells, 20000);

//   // animation (slow)
//   const step = () => {
//     routeBuses.forEach(bus => {
//       const speed = 0.00008 + Math.random() * 0.00012;
//       busData[bus.bus_id].pos += speed * busData[bus.bus_id].dir;

//       if (busData[bus.bus_id].pos > 1) { busData[bus.bus_id].pos = 1; busData[bus.bus_id].dir = -1; }
//       else if (busData[bus.bus_id].pos < 0) { busData[bus.bus_id].pos = 0; busData[bus.bus_id].dir = 1; }

//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//     });

//     rafId = requestAnimationFrame(step);
//   };
//   rafId = requestAnimationFrame(step);
// }

// // ---- boot ----
// initMap();
// fetchRoutes();

// // keep statuses fresh
// setInterval(fetchAndAnimateBuses, 30000);


