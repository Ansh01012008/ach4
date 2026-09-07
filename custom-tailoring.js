/* ===== Custom Tailoring — measurement sets from the boutique's own reference sheet ===== */
const GARMENT_FIELDS = {
  'Kurti': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Waist Point','Hip','Hip Length','Chak Length','Sleeves','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck','Bottom Length','Bottom Waist','Bottom Hip','Bottom Thigh','Bottom Knee','Bottom Width'],
  'Blouse': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Sleeves Length','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck'],
  'Gown': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Waist Point','Hip','Hip Length','Chak Length','Sleeves Length','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck'],
  'Cord Set': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Waist Point','Hip','Hip Length','Chak Length','Sleeves','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck','Bottom Length','Bottom Waist','Bottom Hip','Bottom Thigh','Bottom Knee','Bottom Width'],
  'Pant Suit': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Waist Point','Hip','Hip Length','Chak Length','Sleeves','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck','Bottom Length','Bottom Waist','Bottom Hip','Bottom Thigh','Bottom Knee','Bottom Width'],
  'Lehnga': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Chak Length','Sleeves','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck','Bottom Length','Bottom Waist','Bottom Hip','Bottom Width','Hip Length'],
  'Skirt': ['Length','Waist','Hip','Thigh','Knee','Bottom Width'],
  'Shirt/Top': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Waist Point','Hip','Hip Length','Chak Length','Sleeves Length','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck'],
  'Garara/Sarara Dress': ['Length','Shoulder','Chest','Chest Point','Under Chest','Chest Span','Waist','Waist Point','Hip','Hip Length','Chak Length','Sleeves','Sleeve Loosing','Arm Hole','Daman','Front Neck','Back Neck','Bottom Length','Bottom Waist','Bottom Hip','Bottom Thigh','Bottom Knee','Bottom Width']
};

let ctSelectedGarment = null;
let ctFabricSource = 'customer';
let ctDesignImages = [];
let ctCurrentStep = 1;
let ctMyRequests = [];
let ctSelectedFabricProduct = null;
const CT_STATUS_ORDER = ['New','Reviewed','Quoted','In Progress','Ready','Delivered'];

function initCustomTailoringPage(){
  const grid = document.getElementById('ctGarmentGrid');
  grid.innerHTML = Object.keys(GARMENT_FIELDS).map(g=>
    `<div class="ct-garment-opt" data-garment="${g}" onclick="selectGarment('${g}')">${g}</div>`
  ).join('');
  // Fires once Firebase resolves auth state (defined globally in shared.js's onAuthStateChanged)
  window.onAuthReady = function(user){
    if(user) loadMyCustomRequests(user.uid);
  };
}

async function loadMyCustomRequests(uid){
  try{
    const snap = await db.collection('customOrders').where('uid','==',uid).orderBy('date','desc').limit(10).get();
    ctMyRequests = snap.docs.map(d=>({id:d.id, ...d.data()}));
    if(ctMyRequests.length) renderCtHistory();
  }catch(e){ console.warn('custom order history fetch failed', e); }
}
function renderCtHistory(){
  const section = document.getElementById('ctHistorySection');
  section.style.display = 'block';
  section.innerHTML = `
    <h3 style="margin-bottom:12px;">Your Previous Requests</h3>
    ${ctMyRequests.map(r=>{
      const stepIdx = CT_STATUS_ORDER.indexOf(r.status);
      const isCancelled = r.status === 'Cancelled';
      return `
      <div class="ct-history-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <b>${r.garment}</b> <span style="font-size:11px;color:#8a7480;">— ${r.id}</span>
            <div style="font-size:12px;color:#8a7480;">${new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}${r.quotedPrice?` · Quoted ₹${r.quotedPrice}`:''}${r.expectedDelivery?` · Ready by ${new Date(r.expectedDelivery).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`:''}</div>
          </div>
          ${!isCancelled && Object.keys(r.measurements||{}).length ? `<button class="mini-btn" onclick='ctReuseMeasurements(${JSON.stringify(r).replace(/'/g,"&apos;")})'>Reuse for New Order</button>` : ''}
        </div>
        ${!isCancelled ? `
        <div class="ct-history-track">
          ${CT_STATUS_ORDER.map((s,i)=>`
            ${i>0?`<div class="line ${i<=stepIdx?'done':''}"></div>`:''}
            <div class="dot ${i<=stepIdx?'done':''}" title="${s}"></div>
          `).join('')}
        </div>
        <div style="font-size:11px;color:#8a7480;margin-top:4px;">${r.status}</div>
        ` : `<div style="font-size:12px;color:#b5473a;margin-top:8px;">Cancelled</div>`}
      </div>`;
    }).join('')}
  `;
}
function ctReuseMeasurements(oldRequest){
  selectGarment(oldRequest.garment);
  document.querySelectorAll('.ct-garment-opt').forEach(el=>el.classList.toggle('selected', el.dataset.garment===oldRequest.garment));
  setTimeout(()=>{
    Object.entries(oldRequest.measurements||{}).forEach(([k,v])=>{
      const inp = document.querySelector(`#ctMeasGrid [data-meas="${k}"]`);
      if(inp) inp.value = v;
    });
    showToast('Measurements copied from your previous order — review before submitting.');
  }, 50);
  ctGoStep(2);
  window.scrollTo({top:0, behavior:'smooth'});
}

function selectGarment(g){
  ctSelectedGarment = g;
  document.querySelectorAll('.ct-garment-opt').forEach(el=>el.classList.toggle('selected', el.dataset.garment===g));
  const measGrid = document.getElementById('ctMeasGrid');
  measGrid.innerHTML = GARMENT_FIELDS[g].map(f=>
    `<div class="field"><label>${f}</label><input data-meas="${f}" placeholder="in inches"></div>`
  ).join('');
}

function selectFabricSource(src){
  ctFabricSource = src;
  document.getElementById('ctFabricCustomer').classList.toggle('selected', src==='customer');
  document.getElementById('ctFabricStore').classList.toggle('selected', src==='store');
  document.getElementById('ctFabricNote').style.display = src==='store' ? 'block' : 'none';
  const catalogEl = document.getElementById('ctFabricCatalog');
  if(src==='store'){
    catalogEl.style.display = 'block';
    renderFabricCatalog();
  } else {
    catalogEl.style.display = 'none';
    ctSelectedFabricProduct = null;
  }
}
function renderFabricCatalog(){
  const catalogEl = document.getElementById('ctFabricCatalog');
  const fabricProducts = products.filter(p => p.unit==='meter' || /fabric|saree/i.test(p.category||''));
  if(fabricProducts.length===0){
    catalogEl.innerHTML = `<p style="font-size:12px;color:#8a7480;">Our fabric catalog isn't listed online yet — no problem, we'll show you options in person or over a call.</p>`;
    return;
  }
  catalogEl.innerHTML = `
    <label style="font-size:13px;font-weight:500;margin-bottom:8px;display:block;">Pick a fabric (optional — you can also decide later)</label>
    ${fabricProducts.map(p=>`
      <div class="ct-fabric-item" id="ctFab_${p.id}" onclick="selectFabricProduct('${p.id}')">
        <span>${p.name} — ${p.category}</span>
        <b>${money(p.price)}${p.unit==='meter'?'/m':''}</b>
      </div>
    `).join('')}
  `;
}
function selectFabricProduct(id){
  ctSelectedFabricProduct = ctSelectedFabricProduct===id ? null : id;
  document.querySelectorAll('.ct-fabric-item').forEach(el=>el.classList.toggle('selected', el.id==='ctFab_'+ctSelectedFabricProduct));
}
function onProductsLoaded(){
  // Re-render the fabric picker if it's open and products just finished loading
  if(document.getElementById('ctFabricCatalog')?.style.display === 'block') renderFabricCatalog();
}

function resizeImageToBase64(file, maxPx){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if(w > maxPx || h > maxPx){
          if(w > h){ h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleCtDesignUpload(e){
  const files = Array.from(e.target.files);
  const statusEl = document.getElementById('ctUploadStatus');
  for(const file of files){
    if(ctDesignImages.length >= 5){ statusEl.textContent = 'Maximum 5 photos.'; return; }
    statusEl.textContent = `Processing ${file.name}…`;
    try{
      const base64 = await resizeImageToBase64(file, 900);
      ctDesignImages.push(base64);
      renderCtUploads();
      statusEl.textContent = '';
    }catch(err){
      statusEl.textContent = 'Failed to process image.';
    }
  }
}
function renderCtUploads(){
  document.getElementById('ctUploadGrid').innerHTML = ctDesignImages.map((img,i)=>
    `<div class="ct-upload-thumb"><img src="${img}"><span class="rm" onclick="removeCtUpload(${i})">✕</span></div>`
  ).join('');
}
function removeCtUpload(i){ ctDesignImages.splice(i,1); renderCtUploads(); }

function ctGoStep(n){
  if(n===2 && !ctSelectedGarment){ alert('Please select a garment type first.'); return; }
  document.querySelectorAll('.ct-step').forEach(el=>el.classList.remove('active'));
  document.getElementById('ctStep'+n).classList.add('active');
  ctCurrentStep = n;
  [1,2,3,4].forEach(i=>{
    const el = document.getElementById('ctp'+i);
    if(el) el.classList.toggle('done', i<=n);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

function collectMeasurements(){
  const out = {};
  document.querySelectorAll('#ctMeasGrid [data-meas]').forEach(inp=>{
    if(inp.value.trim()) out[inp.dataset.meas] = inp.value.trim();
  });
  return out;
}

function ctReviewAndGo(){
  const name = document.getElementById('ctFullName').value.trim();
  const phone = document.getElementById('ctFullPhone').value.trim();
  if(!name){ alert('Please enter your name.'); return; }
  if(phone.length !== 10){ alert('Please enter a valid 10-digit phone number.'); return; }

  const meas = collectMeasurements();
  const notes = document.getElementById('ctNotes').value.trim();
  document.getElementById('ctReviewCard').innerHTML = `
    <h3 style="margin-bottom:14px;">Review Your Request</h3>
    <div class="ct-review-row"><span>Garment</span><b>${ctSelectedGarment}</b></div>
    <div class="ct-review-row"><span>Fabric</span><b>${ctFabricSource==='customer'?"My Own Fabric":"ACH Boutique Fabric"}${ctSelectedFabricProduct?' — '+products.find(p=>p.id===ctSelectedFabricProduct)?.name:''}</b></div>
    <div class="ct-review-row"><span>Name</span><b>${name}</b></div>
    <div class="ct-review-row"><span>Phone</span><b>${phone}</b></div>
    ${Object.keys(meas).length ? `<div style="margin-top:12px;font-size:12px;color:#8a7480;">Measurements: ${Object.entries(meas).map(([k,v])=>`${k}: ${v}"`).join(', ')}</div>` : `<div style="margin-top:12px;font-size:12px;color:#8a7480;">No measurements entered — we'll confirm at pickup/fitting.</div>`}
    ${notes ? `<div style="margin-top:8px;font-size:12px;color:#8a7480;">Notes: ${notes}</div>` : ''}
    ${ctDesignImages.length ? `<div style="margin-top:12px;display:flex;gap:8px;">${ctDesignImages.map(img=>`<img src="${img}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">`).join('')}</div>` : ''}
  `;
  ctGoStep(4);
}

/* Simple standalone UPI QR + deep link for the optional token advance —
   shown inline on this same page (no separate tab/window). */
function ctPayAdvance(){
  const amt = Number(document.getElementById('ctAdvanceAmt').value);
  if(!amt || amt <= 0){ alert('Enter a valid advance amount.'); return; }
  if(!settings.paymentUpiId){ alert('Online advance payment is not set up yet — you can still submit your request and pay in person.'); return; }
  const upiLink = `upi://pay?pa=${settings.paymentUpiId}&pn=${encodeURIComponent('ACH Boutique')}&am=${amt}&cu=INR&tn=${encodeURIComponent('Custom stitching advance')}`;
  const isMobile = window.innerWidth <= 768;

  if(isMobile){
    // On mobile, a UPI deep link is meant to hand off to the customer's UPI
    // app directly — that's expected/normal, not an extra unwanted page.
    window.location.href = upiLink;
    document.getElementById('ctAdvanceStatus').textContent = `Opening your UPI app for ₹${amt}… come back here once paid.`;
  } else {
    // On desktop, show the QR right here on the page instead of opening a new tab.
    const qrWrap = document.getElementById('ctAdvanceQrWrap');
    document.getElementById('ctAdvanceQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    qrWrap.style.display = 'block';
  }
  window._ctAdvancePaid = amt;
}
function ctConfirmAdvancePaid(){
  document.getElementById('ctAdvanceQrWrap').style.display = 'none';
  document.getElementById('ctAdvanceStatus').textContent = `₹${window._ctAdvancePaid} noted — we'll confirm it on our end when reviewing your request.`;
}

async function submitCustomOrder(){
  const btn = document.getElementById('ctSubmitBtn');
  btn.disabled = true; btn.textContent = 'Submitting…';

  const requestId = 'CT' + Date.now().toString().slice(-8);
  const data = {
    id: requestId,
    garment: ctSelectedGarment,
    fabricSource: ctFabricSource,
    selectedFabric: ctSelectedFabricProduct ? {id: ctSelectedFabricProduct, name: products.find(p=>p.id===ctSelectedFabricProduct)?.name} : null,
    measurements: collectMeasurements(),
    designImages: ctDesignImages,
    notes: document.getElementById('ctNotes').value.trim(),
    customer: {
      name: document.getElementById('ctFullName').value.trim(),
      phone: document.getElementById('ctFullPhone').value.trim(),
      email: document.getElementById('ctFullEmail').value.trim(),
      address: document.getElementById('ctFullAddr').value.trim()
    },
    advancePaid: window._ctAdvancePaid || 0,
    status: 'New',
    quotedPrice: null,
    expectedDelivery: null,
    date: new Date().toISOString(),
    uid: window.currentUser ? window.currentUser.uid : null
  };

  try{
    await db.collection('customOrders').doc(requestId).set(data);
    // Notify the shop by email (best-effort — the Firestore save above is the source of truth)
    fetch('https://formspree.io/f/xgaezbkr', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: `New Custom Stitching Request — ${requestId}`,
        name: data.customer.name, phone: data.customer.phone,
        message: `Garment: ${data.garment}\nFabric: ${data.fabricSource}\nNotes: ${data.notes}\nSee full details + photos in admin.`
      })
    }).catch(()=>{});

    // Confirmation email to the customer, if they gave one — reuses the same
    // template/service already proven to work for order confirmations.
    if(data.customer.email){
      emailjs.send('service_xu0ot7h', 'template_336mhcg', {
        to_email: data.customer.email,
        to_name: data.customer.name,
        otp_code: `Custom Stitching Request Received ✓\n\nReference ID: ${requestId}\n\nGarment: ${data.garment}\nFabric: ${data.fabricSource==='customer'?"Your own fabric":"ACH Boutique fabric"}${data.selectedFabric?' ('+data.selectedFabric.name+')':''}\n\nWe'll review your measurements and design reference, then get back to you with a price quote and expected delivery date.\n\nTrack your request anytime at ${window.location.origin}/track.html using this Reference ID and your phone number.\n\nThank you for choosing ACH Boutique!`,
        order_note: `Custom Stitching Request: ${requestId}`
      }).catch(e=>console.warn('confirmation email failed', e));
    }

    document.querySelectorAll('.ct-step').forEach(el=>el.classList.remove('active'));
    document.getElementById('ctStepDone').classList.add('active');
    document.getElementById('ctDoneId').textContent = requestId;
  }catch(e){
    alert('Could not submit your request: ' + e.message);
    btn.disabled = false; btn.textContent = 'Submit Request';
  }
}
