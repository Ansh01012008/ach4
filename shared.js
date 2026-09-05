/* =====================================================================
   ACH Boutique — shared.js
   Firebase, global state, catalog/cart/wishlist, auth, search, track,
   checkout, wheel, reviews. Loaded on every page.
   Call injectSharedChrome() once the DOM is ready, then init().
   ===================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBklGlLAK-CvIFfS9K6UqsN3Jk9p58YgQk",
  authDomain: "achweb-8256f.firebaseapp.com",
  projectId: "achweb-8256f",
  storageBucket: "achweb-8256f.firebasestorage.app",
  messagingSenderId: "292133177844",
  appId: "1:292133177844:web:f509be1061d0d8e6aa11a1"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

window.currentUser = null;
auth.onAuthStateChanged(user => {
  window.currentUser = user || null;
  updateAccountIcon();
  if(user){ mergeCloudCartOnLogin(user.uid); }
  else { _cloudMergeDone = false; }
  if(typeof onAuthReady === 'function') onAuthReady(window.currentUser);
});

/* =========================================================
   DEFAULTS
   ========================================================= */
function ph(seed, colorA, colorB){
  return `data:image/svg+xml;utf8,` + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${colorA}'/><stop offset='1' stop-color='${colorB}'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><circle cx='330' cy='60' r='70' fill='rgba(255,255,255,0.15)'/><circle cx='40' cy='450' r='90' fill='rgba(255,255,255,0.12)'/><text x='200' y='260' font-family='Georgia,serif' font-size='24' fill='rgba(255,255,255,0.75)' text-anchor='middle'>${seed}</text></svg>`);
}
const DEFAULT_PRODUCTS = [
  {id:'p1', name:'Handloom Linen Kurta', category:'Ethnic', price:2450, mrp:2900, desc:'Undyed handloom linen kurta with mother-of-pearl buttons and a relaxed A-line cut.', sizes:['S','M','L','XL'], stock:14, images:[ph('Linen Kurta','#eab3c6','#e08ba8')], badge:'New'},
  {id:'p2', name:'Blush Chiffon Saree', category:'Ethnic', price:5200, mrp:6000, desc:'Flowing blush chiffon saree with a delicate scalloped border and lightweight zari work.', sizes:['Free Size'], stock:6, images:[ph('Chiffon Saree','#d9cdf0','#b79ee0')], badge:'Bestseller'},
  {id:'p3', name:'Pearl Drop Earrings', category:'Accessories', price:1650, mrp:1650, desc:'Handcrafted pearl drop earrings finished in rose gold.', sizes:['Free Size'], stock:20, images:[ph('Pearl Earrings','#cda45e','#eab3c6')]},
  {id:'p4', name:'Lavender Co-ord Set', category:'Western', price:3400, mrp:3400, desc:'Two-piece pastel co-ord set — cropped blazer and wide-leg trousers.', sizes:['S','M','L'], stock:9, images:[ph('Co-ord Set','#b79ee0','#eab3c6')], badge:'New'},
  {id:'p5', name:'Cream Wrap Midi Dress', category:'Western', price:2950, mrp:3500, desc:'Flattering wrap midi dress in cream crepe with a tie waist.', sizes:['S','M','L','XL'], stock:11, images:[ph('Wrap Dress','#fdf6f1','#eab3c6')]},
  {id:'p6', name:'Rose Gold Layered Necklace', category:'Accessories', price:1250, mrp:1250, desc:'Delicate layered chain necklace in a warm rose gold finish.', sizes:['Free Size'], stock:25, images:[ph('Necklace','#cda45e','#d9cdf0')]},
  {id:'p7', name:'Anarkali Gown', category:'Ethnic', price:4800, mrp:5600, desc:'Floor-length anarkali gown in dusty rose georgette with embroidered yoke.', sizes:['S','M','L','XL'], stock:7, images:[ph('Anarkali Gown','#e08ba8','#b79ee0')], badge:'Trending'},
  {id:'p8', name:'Satin Slip Skirt', category:'Western', price:1980, mrp:2300, desc:'Bias-cut satin slip skirt in champagne with elasticated back.', sizes:['S','M','L'], stock:13, images:[ph('Satin Skirt','#fdf6f1','#cda45e')]},
];
const DEFAULT_COUPONS = [
  {id:'WELCOME10', code:'WELCOME10', type:'percent', value:10, active:true, desc:'10% off your first order'},
  {id:'FLAT500', code:'FLAT500', type:'flat', value:500, active:true, desc:'Flat ₹500 off on orders above ₹3000', minOrder:3000},
];
const DEFAULT_SETTINGS = {
  showGST:true, gstRate:5, currency:'₹',
  shippingThreshold:2500, shippingFee:99,
  heroEyebrow:'— Festive Edit, 2026', heroTitle:'Quiet luxury, cut for real life.',
  heroSubtitle:'ACH Boutique brings together small-batch textiles and considered silhouettes — pieces made to be worn for years, not seasons.',
  announcementText:'FREE SHIPPING ON ORDERS ABOVE ₹2500  •  USE CODE WELCOME10 FOR 10% OFF YOUR FIRST ORDER  •  HANDCRAFTED IN SMALL BATCHES',
  saleTitle:'Festive Edit — Up to 20% Off', saleSubtitle:'Use code WELCOME10 at checkout · Offer ends soon',
  saleEndDate: new Date(Date.now()+3*86400000).toISOString(),
  aboutItems: [
    {title:'Small Batch', text:'Limited runs of 20–40 pieces per style, so nothing feels mass produced.'},
    {title:'Considered Fabric', text:'Linen, handloom cotton and undyed wool sourced from regional weaving clusters.'},
    {title:'Made to Last', text:'Reinforced seams and natural fibers built for years of wear, not one season.'}
  ],
  wheelEnabled:true,
  wheelPrizes:[
    {label:'20% OFF', type:'percent', value:20, weight:8, code:'SPIN20'},
    {label:'10% OFF', type:'percent', value:10, weight:25, code:'SPIN10'},
    {label:'Free Shipping', type:'flat', value:99, weight:20, code:'SPINSHIP'},
    {label:'15% OFF', type:'percent', value:15, weight:12, code:'SPIN15'},
    {label:'5% OFF', type:'percent', value:5, weight:25, code:'SPIN5'},
    {label:'Try Again', type:'none', value:0, weight:10, code:''}
  ],
  paymentUpiId:'', paymentQrImage:'',
  paymentBank:{ accountName:'', accountNumber:'', ifsc:'', bankName:'' },
  heroImage:'', categoryBanners:{},
  storeAddress:'B61 Palace Orchard, Phase 3\nKolar Road, Bhopal 462042, MP',
  storePhone:'+91 93007 60840', storeEmail:'hello@achboutique.in',
  storeTagline:'Considered clothing, made in small batches.'
};
const WHEEL_COLORS = ['#e08ba8','#b79ee0','#eab3c6','#e08ba8','#b79ee0','#eab3c6','#e08ba8','#b79ee0'];

/* =========================================================
   STATE
   ========================================================= */
let products = [];
let coupons = [];
let orders = [];
let settings = {...DEFAULT_SETTINGS};
let appliedCoupon = null;
let currentFilter = 'all';
let currentProduct = null;
let currentImgIdx = 0;
let selectedPayment = 'upi';
let shippingData = null;
let priceMax = 6000;
let pickedStars = 5;
let firstProductsLoad = true;

function loadLS(key, fallback){
  const raw = localStorage.getItem(key);
  if(!raw) return fallback;
  try{ return JSON.parse(raw); }catch(e){ return fallback; }
}
function saveLS(key, val){
  localStorage.setItem(key, JSON.stringify(val));
  if(key==='ach_cart' || key==='ach_wishlist') queueCloudSync();
}

/* CLOUD SYNC — mirrors cart/wishlist to Firestore per signed-in user so it
   persists across devices. localStorage stays the source of truth for guests
   and as an instant-load cache; Firestore is the durable copy once signed in. */
let _cloudSyncTimer = null;
function queueCloudSync(){
  if(!window.currentUser) return;
  clearTimeout(_cloudSyncTimer);
  _cloudSyncTimer = setTimeout(()=>{
    db.collection('userCarts').doc(window.currentUser.uid).set({
      cart, wishlist, updatedAt: new Date().toISOString()
    }, {merge:true}).catch(e=>console.warn('cloud cart sync failed', e.message));
  }, 600); // debounce rapid qty changes etc.
}

let _cloudMergeDone = false;
async function mergeCloudCartOnLogin(uid){
  if(_cloudMergeDone) return;
  _cloudMergeDone = true;
  try{
    const doc = await db.collection('userCarts').doc(uid).get();
    if(doc.exists){
      const cloud = doc.data();
      // Union merge: keep local items (in case added while briefly offline) and
      // bring in anything saved from another device, deduping by id+size.
      const key = it => it.id + '|' + (it.size||'');
      const localKeys = new Set(cart.map(key));
      (cloud.cart||[]).forEach(it => { if(!localKeys.has(key(it))) cart.push(it); });
      const wishSet = new Set(wishlist);
      (cloud.wishlist||[]).forEach(id => wishSet.add(id));
      wishlist = [...wishSet];
    }
    localStorage.setItem('ach_cart', JSON.stringify(cart));
    localStorage.setItem('ach_wishlist', JSON.stringify(wishlist));
    updateCartCount();
    const wc = document.getElementById('wishCount'); if(wc) wc.textContent = wishlist.length;
    if(typeof renderCart === 'function') renderCart();
    queueCloudSync(); // push the merged result back up
  }catch(e){ console.warn('cloud cart merge failed', e.message); }
}
let cart = loadLS('ach_cart', []);
let wishlist = loadLS('ach_wishlist', []);

function money(n){ return (settings.currency||'₹') + Number(n).toLocaleString('en-IN'); }


/* =========================================================
   FIREBASE SYNC
   ========================================================= */
async function seedIfEmpty(){
  const snap = await db.collection('products').limit(1).get();
  if(snap.empty){
    const batch = db.batch();
    DEFAULT_PRODUCTS.forEach(p=>{ const {id, ...rest} = p; batch.set(db.collection('products').doc(id), rest); });
    await batch.commit();
  }
  const cSnap = await db.collection('coupons').limit(1).get();
  if(cSnap.empty){
    const batch = db.batch();
    DEFAULT_COUPONS.forEach(c=>{ const {id, ...rest} = c; batch.set(db.collection('coupons').doc(id), rest); });
    await batch.commit();
  }
  const sDoc = await db.collection('settings').doc('main').get();
  if(!sDoc.exists){ await db.collection('settings').doc('main').set(DEFAULT_SETTINGS); }
}

function listenAll(){
  db.collection('settings').doc('main').onSnapshot(doc=>{
    settings = doc.exists ? {...DEFAULT_SETTINGS, ...doc.data()} : {...DEFAULT_SETTINGS};
    applySettingsToDOM();
  }, err=>console.warn('settings listener', err));

  db.collection('products').onSnapshot(snap=>{
    products = snap.docs.map(d=>({id:d.id, ...d.data()}));
    if(typeof renderCatTiles==='function') renderCatTiles();
    if(typeof renderFilterBar==='function') renderFilterBar();
    if(typeof renderGrid==='function') renderGrid();
    if(firstProductsLoad){
      firstProductsLoad=false;
      if(typeof renderRecentlyViewed==='function') renderRecentlyViewed();
      if(typeof renderInstaGrid==='function') renderInstaGrid();
    }
    if(typeof onProductsLoaded === 'function') onProductsLoaded();
  }, err=>console.warn('products listener', err));



  db.collection('coupons').onSnapshot(snap=>{
    coupons = snap.docs.map(d=>({id:d.id, code:d.id, ...d.data()}));
  }, err=>console.warn('coupons listener', err));
}

/* =========================================================
   DYNAMIC CONTENT FROM SETTINGS
   ========================================================= */
function applySettingsToDOM(){
  // Safe-navigation everywhere: several of these elements (hero, about grid,
  // price slider) only exist on index.html — on other pages they're null,
  // and without guards that throw and silently kills everything after it,
  // including footer/header updates that DO exist on every page.
  const $ = id => document.getElementById(id);
  if($('announceText')) $('announceText').textContent = (settings.announcementText||'') + '   •   ' + (settings.announcementText||'');
  if($('heroEyebrow')) $('heroEyebrow').textContent = settings.heroEyebrow || '';
  if($('heroTitle')) $('heroTitle').textContent = settings.heroTitle || '';
  if($('heroSubtitle')) $('heroSubtitle').textContent = settings.heroSubtitle || '';
  if($('heroVisual')){
    if(settings.heroImage){
      $('heroVisual').style.backgroundImage = `url('${settings.heroImage}')`;
      $('heroVisual').style.backgroundSize = 'cover';
      $('heroVisual').style.backgroundPosition = 'center';
      $('heroVisual').classList.add('has-image');
    } else {
      $('heroVisual').style.backgroundImage = '';
      $('heroVisual').classList.remove('has-image');
    }
  }
  if($('saleTitle')) $('saleTitle').textContent = settings.saleTitle || '';
  if($('saleSubtitle')) $('saleSubtitle').textContent = settings.saleSubtitle || '';
  if($('gstFooterNote')) $('gstFooterNote').textContent = settings.showGST ? `Prices inclusive of GST (${settings.gstRate}%)` : '';
  if($('footerTagline')) $('footerTagline').textContent = settings.storeTagline || '';
  if($('footerEmail')) $('footerEmail').textContent = settings.storeEmail || '';
  if($('footerPhone')) $('footerPhone').textContent = settings.storePhone || '';
  if($('footerAddress')) $('footerAddress').innerHTML = (settings.storeAddress || '').replace(/\n/g,'<br>');
  if($('aboutGrid')){
    const ai = settings.aboutItems || DEFAULT_SETTINGS.aboutItems;
    $('aboutGrid').innerHTML = ai.map(a=>`<div><h3>${a.title}</h3><p>${a.text}</p></div>`).join('');
  }
  if($('countdown')) renderCountdown();
  if($('priceSlider')) $('priceSlider').max = Math.max(6000, ...products.map(p=>p.price||0));
  if(typeof onSettingsApplied === 'function') onSettingsApplied();
}

/* =========================================================
   RENDER: CATALOG
   ========================================================= */
const CAT_IMAGES = {
  'Ethnic': ph('Ethnic Wear','#e08ba8','#b79ee0'), 'Western': ph('Western Wear','#b79ee0','#eab3c6'),
  'Accessories': ph('Accessories','#cda45e','#eab3c6')
};
function renderCatTiles(){
  const el = document.getElementById('catTiles'); if(!el) return;
  const cats = [...new Set(products.map(p=>p.category))].slice(0,4);
  el.innerHTML = cats.map(c=>`
    <div class="cat-tile" onclick="filterCategory('${c}')"><img src="${CAT_IMAGES[c] || ph(c,'#8a6a54','#c98a7d')}"><div class="label">${c}</div></div>
  `).join('');
}
function renderFilterBar(){
  const el = document.getElementById('filterBar'); if(!el) return;
  const cats = ['all', ...new Set(products.map(p=>p.category))];
  el.innerHTML = cats.map(c=>
    `<button class="filter-chip ${currentFilter===c?'active':''}" onclick="filterCategory('${c}')">${c==='all'?'All':c}</button>`
  ).join('');
}
function filterCategory(c){ currentFilter=c; renderFilterBar(); renderGrid(); scrollToSection('shop'); }
function onPriceChange(val){ priceMax = Number(val); document.getElementById('priceLabel').textContent = val; renderGrid(); }
function sortList(list){
  const mode = document.getElementById('sortSelect')?.value || 'popular';
  const arr = [...list];
  if(mode==='low') arr.sort((a,b)=>a.price-b.price);
  else if(mode==='high') arr.sort((a,b)=>b.price-a.price);
  else if(mode==='new') arr.reverse();
  return arr;
}
function hashStr(id){ let h=0; for(const c of id) h=(h*31+c.charCodeAt(0))%97; return h; }
function ratingFor(id){
  let hash = 0; for(const c of id) hash = (hash*31 + c.charCodeAt(0)) % 1000;
  return {rating:(4 + (hash%10)/10).toFixed(1), count: 20 + (hash%180)};
}
function renderGrid(){
  const grid = document.getElementById('productGrid'); if(!grid) return;
  let list = currentFilter==='all' ? products : (currentFilter==='New' ? products.filter(p=>p.badge==='New') : products.filter(p=>p.category===currentFilter));
  list = list.filter(p=>p.price<=priceMax);
  list = sortList(list);
  if(products.length===0){ grid.innerHTML = `<div class="loading-note"><div class="spinner-sm"></div>Loading the collection…</div>`; return; }
  if(list.length===0){ grid.innerHTML = `<div class="empty-state">No products match these filters. Try widening your price range.</div>`; return; }
  grid.innerHTML = list.map((p,i)=>{
    const r = ratingFor(p.id);
    const lowStock = p.stock>0 && p.stock<=5;
    const viewerCount = 2 + (i*3 + hashStr(p.id))%9;
    return `
    <div class="card" style="animation-delay:${i*0.05}s;">
      <div class="card-img" onclick="openProduct('${p.id}')">
        ${p.badge?`<span class="card-badge">${p.badge}</span>`:''}
        <button class="wish-btn ${wishlist.includes(p.id)?'active':''}" onclick="event.stopPropagation();toggleWishlist('${p.id}')">${wishlist.includes(p.id)?'♥':'♡'}</button>
        <img src="${p.images[0]}" alt="${p.name}">
        <div class="quick-add">Quick View</div>
      </div>
      <div onclick="openProduct('${p.id}')">
        <div class="card-name">${p.name}</div>
        <div class="card-cat">${p.category}</div>
        <div class="card-rating">★★★★★ <span>${r.rating} (${r.count})</span></div>
        <div class="card-price">${p.mrp>p.price?`<s>${money(p.mrp)}</s>`:''}${money(p.price)}</div>
        ${lowStock?`<span class="urgency">🔥 Only ${p.stock} left</span>`:''}
        <span class="viewers">👀 ${viewerCount} viewing</span>
      </div>
    </div>`;
  }).join('');
}
function scrollToSection(id){ document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); }

/* SEARCH */
function openSearch(){
  document.getElementById('searchInput').value='';
  document.getElementById('searchResults').innerHTML = `<p style="font-size:13px;color:#8a7480;">Try "kurta", "saree", or a category name.</p>`;
  document.getElementById('searchModalBg').classList.add('show');
  setTimeout(()=>document.getElementById('searchInput').focus(), 100);
}
function runSearch(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const box = document.getElementById('searchResults');
  if(!q){ box.innerHTML = `<p style="font-size:13px;color:#8a7480;">Try "kurta", "saree", or a category name.</p>`; return; }
  const results = products.filter(p=> p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q));
  if(results.length===0){ box.innerHTML = `<p style="font-size:13px;color:#8a7480;">No products match "${q}".</p>`; return; }
  box.innerHTML = results.map(p=>`
    <div class="cart-item" style="cursor:pointer;" onclick="closeModal('searchModalBg');openProduct('${p.id}')">
      <img src="${p.images[0]}"><div class="cart-item-info"><div class="name">${p.name}</div><div class="meta">${p.category}</div></div>
      <div class="cart-item-price">${money(p.price)}</div>
    </div>
  `).join('');
}

/* TRACK ORDER — live Firestore query */
function openTrackOrder(){
  document.getElementById('trackOrderId').value='';
  document.getElementById('trackPhone').value='';
  document.getElementById('trackResult').innerHTML='';
  document.getElementById('trackModalBg').classList.add('show');
}
async function runTrackOrder(){
  const id = document.getElementById('trackOrderId').value.trim().toUpperCase();
  const phone = document.getElementById('trackPhone').value.trim();
  const box = document.getElementById('trackResult');
  box.innerHTML = `<div class="spinner-sm"></div>`;
  try{
    const snap = await db.collection('orders').doc(id).get();
    if(!snap.exists || snap.data().customer.phone !== phone){
      box.innerHTML = `<p style="font-size:13px;color:#b5473a;">No matching order found. Check your Order ID and phone number.</p>`; return;
    }
    const order = snap.data();
    const stages = ['Placed','Processing','Shipped','Delivered'];
    const idx = stages.indexOf(order.status);
    box.innerHTML = `
      <div style="border-top:1px solid var(--stone);padding-top:16px;">
        <div style="font-size:14px;margin-bottom:4px;">Order <b>${id}</b></div>
        <div style="font-size:12px;color:#8a7480;margin-bottom:16px;">${new Date(order.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · ${money(order.total)} · ${order.payment}</div>
        <div class="progress-steps" style="justify-content:flex-start;margin:0 0 8px;">${stages.map((s,i)=>`<span class="${i<=idx?'on':''}" style="width:10px;height:10px;"></span>`).join('')}</div>
        <div style="font-size:14px;color:var(--moss);font-family:'Fraunces',serif;">${order.status}</div>
      </div>`;
  }catch(e){ box.innerHTML = `<p style="font-size:13px;color:#b5473a;">Could not reach the order database. Try again shortly.</p>`; }
}

/* SIZE GUIDE */
function openSizeGuide(){
  document.getElementById('wishModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('wishModalBg')">✕</button>
    <div style="padding:34px;">
      <h2 style="margin-bottom:16px;">Size Guide</h2>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <thead><tr style="text-align:left;border-bottom:2px solid var(--stone);"><th style="padding:8px;">Size</th><th style="padding:8px;">Bust (in)</th><th style="padding:8px;">Waist (in)</th><th style="padding:8px;">Hip (in)</th></tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--stone);"><td style="padding:8px;">S</td><td style="padding:8px;">34</td><td style="padding:8px;">28</td><td style="padding:8px;">36</td></tr>
          <tr style="border-bottom:1px solid var(--stone);"><td style="padding:8px;">M</td><td style="padding:8px;">36</td><td style="padding:8px;">30</td><td style="padding:8px;">38</td></tr>
          <tr style="border-bottom:1px solid var(--stone);"><td style="padding:8px;">L</td><td style="padding:8px;">38</td><td style="padding:8px;">32</td><td style="padding:8px;">40</td></tr>
          <tr><td style="padding:8px;">XL</td><td style="padding:8px;">40</td><td style="padding:8px;">34</td><td style="padding:8px;">42</td></tr>
        </tbody>
      </table>
      <p style="font-size:12px;color:#8a7480;margin-top:16px;">All pieces are hand-finished — measurements may vary by up to half an inch.</p>
    </div>`;
  document.getElementById('wishModalBg').classList.add('show');
}

function closeModal(id){ document.getElementById(id).classList.remove('show'); }
function selectSize(el){ document.querySelectorAll('#sizeRow .size-chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }

/* PRODUCT NAVIGATION (multi-page: goes to product.html instead of opening a modal) */
function openProduct(id){
  window.location.href = 'product.html?id=' + encodeURIComponent(id);
}
function renderRelated(p){
  const rel = products.filter(x=>x.category===p.category && x.id!==p.id).slice(0,3);
  if(rel.length===0) return '';
  return `
    <div style="margin-top:30px;border-top:1px solid var(--stone);padding-top:20px;">
      <div style="font-size:12px;color:#8a7480;margin-bottom:12px;">You may also like</div>
      <div style="display:flex;gap:12px;">
        ${rel.map(r=>`
          <div style="cursor:pointer;flex:1;" onclick="openProduct('${r.id}')">
            <div style="aspect-ratio:3/4;background:var(--stone);overflow:hidden;margin-bottom:6px;border-radius:10px;"><img src="${r.images[0]}" style="width:100%;height:100%;object-fit:cover;"></div>
            <div style="font-size:11px;">${r.name}</div><div style="font-size:11px;color:var(--rose);">${money(r.price)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}
function notifyMe(productId){
  const email = document.getElementById('notifyEmail').value.trim();
  if(!email || !email.includes('@')){ alert('Enter a valid email.'); return; }
  db.collection('stockAlerts').add({productId, email, date:new Date().toISOString()}).catch(()=>{});
  showToast("We'll email you when it's back in stock!");
  document.getElementById('notifyEmail').value='';
}

/* CART */
function addToCart(productId){
  const sizeEl = document.querySelector('#sizeRow .size-chip.active');
  const size = sizeEl ? sizeEl.textContent : 'Free Size';
  const existing = cart.find(c=>c.productId===productId && c.size===size);
  if(existing){ existing.qty += 1; } else { cart.push({productId, size, qty:1}); }
  saveLS('ach_cart', cart);
  updateCartCount();
  closeModal('pdModalBg');
  showToast(`Added "${products.find(p=>p.id===productId)?.name || 'item'}" to your bag`);
  openCart();
}
function updateCartCount(){ document.getElementById('cartCount').textContent = cart.reduce((s,c)=>s+c.qty,0); }
function openCart(){ renderCart(); document.getElementById('cartOverlay').classList.add('show'); document.getElementById('cartDrawer').classList.add('show'); }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('show'); document.getElementById('cartDrawer').classList.remove('show'); }
function cartLines(){ return cart.map(c=>{ const p = products.find(pp=>pp.id===c.productId); return p ? {...c, product:p} : null; }).filter(Boolean); }
function cartSubtotal(){ return cartLines().reduce((s,l)=>s+l.product.price*l.qty,0); }
function couponDiscount(subtotal){
  if(!appliedCoupon) return 0;
  if(appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) return 0;
  if(appliedCoupon.type==='percent') return Math.round(subtotal*appliedCoupon.value/100);
  return Math.min(appliedCoupon.value, subtotal);
}
function gstAmount(base){ return settings.showGST ? Math.round(base*settings.gstRate/100) : 0; }
function shippingFee(subtotal){ return subtotal>=(settings.shippingThreshold||2500) || subtotal===0 ? 0 : (settings.shippingFee||99); }

function renderCart(){
  const lines = cartLines();
  const body = document.getElementById('cartBody');
  body.innerHTML = lines.length===0 ? `<div class="empty-state">Your bag is empty.</div>` : lines.map(l=>`
    <div class="cart-item">
      <img src="${l.product.images[0]}">
      <div class="cart-item-info">
        <div class="name">${l.product.name}</div><div class="meta">Size: ${l.size}</div>
        <div class="qty-ctrl"><button onclick="changeQty('${l.productId}','${l.size}',-1)">−</button><span>${l.qty}</span><button onclick="changeQty('${l.productId}','${l.size}',1)">+</button></div>
        <a class="remove-link" onclick="removeFromCart('${l.productId}','${l.size}')">Remove</a>
      </div>
      <div class="cart-item-price">${money(l.product.price*l.qty)}</div>
    </div>`).join('');
  const subtotal = cartSubtotal();
  const discount = couponDiscount(subtotal);
  const ship = shippingFee(subtotal);
  const taxable = subtotal - discount;
  const gst = gstAmount(taxable);
  const total = taxable + gst + ship;
  document.getElementById('cartFoot').innerHTML = `
    <div class="coupon-row">
      <input type="text" id="couponInput" placeholder="Coupon code" value="${appliedCoupon?appliedCoupon.code:''}" ${appliedCoupon?'disabled':''}>
      ${appliedCoupon ? `<button class="btn btn-outline" onclick="removeCoupon()">Remove</button>` : `<button class="btn btn-outline" onclick="applyCoupon()">Apply</button>`}
    </div>
    <div class="coupon-msg" id="couponMsg"></div>
    <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    ${discount>0?`<div class="summary-row" style="color:var(--moss)"><span>Coupon (${appliedCoupon.code})</span><span>−${money(discount)}</span></div>`:''}
    <div class="summary-row"><span>Shipping</span><span>${ship===0?'Free':money(ship)}</span></div>
    ${settings.showGST?`<div class="summary-row"><span>GST (${settings.gstRate}%)</span><span>${money(gst)}</span></div>`:''}
    <div class="summary-row total"><span>Total</span><span>${money(total)}</span></div>
    <button class="btn full-btn" style="margin-top:14px;" ${lines.length===0?'disabled':''} onclick="openCheckout()">Proceed to Checkout</button>`;
}
function changeQty(productId, size, delta){
  const item = cart.find(c=>c.productId===productId && c.size===size);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) cart = cart.filter(c=>!(c.productId===productId && c.size===size));
  saveLS('ach_cart', cart);
  updateCartCount(); renderCart();
}
function removeFromCart(productId, size){
  cart = cart.filter(c=>!(c.productId===productId && c.size===size));
  saveLS('ach_cart', cart);
  updateCartCount(); renderCart();
}
function applyCoupon(){
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  const c = coupons.find(cp=>cp.code.toUpperCase()===code && cp.active);
  const msgEl = document.getElementById('couponMsg');
  if(!c){ msgEl.textContent='Invalid or inactive coupon code.'; msgEl.className='coupon-msg err'; return; }
  if(c.minOrder && cartSubtotal()<c.minOrder){ msgEl.textContent=`Minimum order of ${money(c.minOrder)} required.`; msgEl.className='coupon-msg err'; return; }
  appliedCoupon = c;
  msgEl.textContent = `"${c.code}" applied — ${c.desc||''}`;
  msgEl.className='coupon-msg ok';
  renderCart();
}
function removeCoupon(){ appliedCoupon=null; renderCart(); }
function subscribeNewsletter(){
  const email = document.getElementById('nlEmail').value.trim();
  const msg = document.getElementById('nlMsg');
  if(!email || !email.includes('@')){ msg.style.color='#b5473a'; msg.textContent='Enter a valid email address.'; return; }
  db.collection('newsletter').add({email, date:new Date().toISOString()}).catch(()=>{});
  msg.style.color='var(--moss)'; msg.textContent='Subscribed! Watch your inbox for 10% off.';
  document.getElementById('nlEmail').value='';
}

/* WISHLIST */
function toggleWishlist(id){
  const wasIn = wishlist.includes(id);
  if(wasIn) wishlist = wishlist.filter(w=>w!==id); else wishlist.push(id);
  saveLS('ach_wishlist', wishlist);
  renderGrid();
  document.getElementById('wishCount').textContent = wishlist.length;
  const p = products.find(pp=>pp.id===id);
  showToast(wasIn ? `Removed from wishlist` : `Saved "${p?p.name:'item'}" to wishlist`);
}
function openWishlistView(){
  const items = products.filter(p=>wishlist.includes(p.id));
  document.getElementById('wishModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('wishModalBg')">✕</button>
    <div style="padding:34px;">
      <h2 style="margin-bottom:20px;">Your Wishlist</h2>
      ${items.length===0?`<p style="font-size:13px;color:#8a7480;">Nothing saved yet — tap the heart on any product to save it here.</p>`:
      items.map(p=>`
        <div class="cart-item"><img src="${p.images[0]}">
          <div class="cart-item-info"><div class="name">${p.name}</div><div class="meta">${money(p.price)}</div><a class="remove-link" onclick="toggleWishlist('${p.id}');openWishlistView();">Remove</a></div>
          <button class="btn" style="padding:9px 16px;font-size:12px;" onclick="closeModal('wishModalBg');openProduct('${p.id}')">View</button>
        </div>`).join('')}
    </div>`;
  document.getElementById('wishModalBg').classList.add('show');
}

/* CHECKOUT */
function orderTotals(){
  const subtotal = cartSubtotal();
  const discount = couponDiscount(subtotal);
  const ship = shippingFee(subtotal);
  const taxable = subtotal - discount;
  const gst = gstAmount(taxable);
  return {subtotal, discount, ship, gst, total: taxable+gst+ship};
}
function stepperHtml(active){
  const steps = ['Shipping','Verify','Payment','Confirm'];
  return `<div class="stepper">${steps.map((s,i)=>{
    const n=i+1, state = n<active?'done':(n===active?'active':'');
    return `<div class="step ${state}"><div class="dot">${n<active?'✓':n}</div><span>${s}</span></div>${i<steps.length-1?'<div class="step-line"></div>':''}`;
  }).join('')}</div>`;
}
function openCheckout(){
  if(cart.length===0) return;
  closeCart();
  renderCheckoutStep1();
  document.getElementById('checkoutModalBg').classList.add('show');
}
function renderCheckoutStep1(){
  document.getElementById('checkoutModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('checkoutModalBg')">✕</button>
    <div class="checkout-shell">
      ${stepperHtml(1)}
      <form id="shipForm" onsubmit="goToVerify(event)">
        <h3 style="margin-bottom:16px;">Shipping Details</h3>
        <div class="form-grid">
          <div class="field"><label>Full Name</label><input required id="ckName" value="${shippingData?.name||''}"></div>
          <div class="field"><label>Phone Number</label><input required id="ckPhone" type="tel" pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number" value="${shippingData?.phone||''}"></div>
          <div class="field full"><label>Email <span style="font-weight:400;color:#8a7480;">(optional — for order updates)</span></label><input id="ckEmail" type="email" value="${shippingData?.email||''}"></div>
          <div class="field full"><label>Address</label><input required id="ckAddress" value="${shippingData?.address||''}"></div>
          <div class="field"><label>City</label><input required id="ckCity" value="${shippingData?.city||''}"></div>
          <div class="field"><label>Pincode</label><input required id="ckPin" value="${shippingData?.pin||''}"></div>
        </div>
        <button type="submit" class="btn full-btn" style="margin-top:20px;">Continue to Verification</button>
      </form>
    </div>`;
}
function goToVerify(e){
  e.preventDefault();
  shippingData = {
    name: document.getElementById('ckName').value, phone: document.getElementById('ckPhone').value,
    email: document.getElementById('ckEmail').value, address: document.getElementById('ckAddress').value,
    city: document.getElementById('ckCity').value, pin: document.getElementById('ckPin').value
  };
  renderCheckoutStep1b();
}

/* ===== OTP VERIFICATION =====
   Phone  → auto-verified because user logged in via Firebase Auth (no re-OTP needed)
   Email  → real 6-digit OTP sent via Brevo transactional API
   ======================================= */

/* EmailJS config — public key, safe to commit */
const EJS_SERVICE  = 'service_xu0ot7h';
const EJS_TEMPLATE = 'template_336mhcg';

let otpState = {
  phone: { verified: false },
  email: { code: null, verified: false, cooldown: 0, sending: false }
};

/* Phone is already verified via Firebase Auth login — mark it immediately */
function autoVerifyPhone(){
  otpState.phone.verified = true;
}

/* Send real OTP email via EmailJS (Gmail) */
async function sendEmailOtp(){
  if(otpState.email.sending) return;
  if(otpState.email.cooldown > 0) return;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpState.email.code = code;
  otpState.email.verified = false;
  otpState.email.sending = true;

  const btn = document.getElementById('resendBtn_email');
  if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; }

  try {
    await emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
      to_email: shippingData.email,
      to_name:  shippingData.name || 'Customer',
      otp_code: code,
      order_note: 'ACH Boutique Order Verification'
    });

    showToast(`OTP sent to ${shippingData.email}`);
    startEmailCooldown();

  } catch(e){
    console.error('EmailJS error:', e);
    const hint = document.getElementById('otpHint_email');
    if(hint) hint.textContent = (e.text || e.message || 'Could not send email. Try again.');
    if(btn){ btn.disabled = false; btn.textContent = 'Resend Code'; }
  }

  otpState.email.sending = false;
}

function startEmailCooldown(){
  otpState.email.cooldown = 30;
  const tick = ()=>{
    otpState.email.cooldown--;
    const btn = document.getElementById('resendBtn_email');
    if(btn){
      if(otpState.email.cooldown > 0){
        btn.disabled = true;
        btn.textContent = `Resend in ${otpState.email.cooldown}s`;
      } else {
        btn.disabled = false;
        btn.textContent = 'Resend Code';
        btn.onclick = sendEmailOtp;
      }
    }
    if(otpState.email.cooldown > 0) setTimeout(tick, 1000);
  };
  tick();
}

/* Remembers emails already OTP-verified on this device so we never ask twice */
function isEmailPreVerified(email){
  if(!email) return false;
  const list = loadLS('ach_verified_emails', []);
  return list.some(e => e.toLowerCase() === email.toLowerCase());
}
function rememberVerifiedEmail(email){
  const list = loadLS('ach_verified_emails', []);
  if(!list.some(e => e.toLowerCase() === email.toLowerCase())){
    list.push(email);
    saveLS('ach_verified_emails', list);
  }
}

function verifyEmailOtp(){
  const input = document.getElementById('otpInput_email').value.trim();
  const errEl = document.getElementById('otpErr_email');
  if(input.length !== 6){ errEl.textContent = 'Enter the 6-digit code.'; return; }
  if(input !== otpState.email.code){ errEl.textContent = 'Incorrect code. Please try again.'; return; }
  errEl.textContent = '';
  otpState.email.verified = true;
  rememberVerifiedEmail(shippingData.email);
  renderCheckoutStep1b();
}

function renderCheckoutStep1b(){
  /* Phone is verified via Firebase Auth — mark it immediately */
  autoVerifyPhone();

  const email = (shippingData.email||'').trim();
  const emailProvided = email.length > 0;

  /* Reset OTP state if the email changed since we last sent/verified a code */
  if(otpState.email.forEmail !== email){
    otpState.email = { code:null, verified:false, cooldown:0, sending:false, forEmail: email };
  }

  /* No email given → nothing to verify, skip straight past this step's email block */
  if(!emailProvided){
    otpState.email.verified = true;
  }
  /* Email given and already verified on this device before → skip OTP, don't ask again */
  else if(isEmailPreVerified(email)){
    otpState.email.verified = true;
  }
  /* Otherwise, send a fresh OTP on first render only */
  else if(!otpState.email.code && !otpState.email.sending){
    otpState.email.verified = false;
    sendEmailOtp();
  }

  const bothVerified = otpState.phone.verified && otpState.email.verified;

  document.getElementById('checkoutModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('checkoutModalBg')">✕</button>
    <div class="checkout-shell">
      ${stepperHtml(2)}
      <h3 style="margin-bottom:6px;">Verify Your Details</h3>
      <p style="font-size:13px;color:#8a7480;margin-bottom:20px;">Your mobile is already verified.${emailProvided?' Just confirm your email to continue.':''}</p>

      <!-- Phone: auto-verified, shown as done -->
      <div style="border:1px solid #c9dfcb;border-radius:12px;padding:14px 18px;margin-bottom:14px;background:#eef6ef;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">📱</span>
        <div>
          <div style="font-size:13px;font-weight:500;">Mobile: +91 ${shippingData.phone}</div>
          <div style="font-size:12px;color:var(--moss);">✓ Verified via login</div>
        </div>
      </div>

      ${!emailProvided ? `
      <div style="border:1px solid var(--stone);border-radius:12px;padding:14px 18px;margin-bottom:16px;background:#fff;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">✉️</span>
        <div style="font-size:12px;color:#8a7480;">No email provided — you'll only get order updates by SMS.</div>
      </div>
      ` : otpState.email.verified ? `
      <div style="border:1px solid #c9dfcb;border-radius:12px;padding:14px 18px;margin-bottom:16px;background:#eef6ef;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">✉️</span>
        <div>
          <div style="font-size:13px;font-weight:500;">Email: ${email}</div>
          <div style="font-size:12px;color:var(--moss);">✓ Verified${isEmailPreVerified(email)?' previously':''}</div>
        </div>
      </div>
      ` : `
      <!-- Email: real OTP via EmailJS -->
      <div style="border:1px solid var(--stone);border-radius:12px;padding:18px;margin-bottom:16px;background:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;font-weight:500;">✉️ Email: ${email}</div>
            <div style="font-size:12px;color:#8a7480;margin-top:2px;">OTP sent to your inbox</div>
          </div>
          <button class="mini-btn" id="resendBtn_email" disabled>Resend in 30s</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <input type="text" id="otpInput_email" maxlength="6" placeholder="6-digit OTP"
            style="flex:1;padding:10px;border:1px solid var(--stone);border-radius:8px;letter-spacing:4px;font-size:18px;text-align:center;"
            oninput="this.value=this.value.replace(/\\D/g,'')"
            onkeydown="if(event.key==='Enter')verifyEmailOtp()">
          <button class="btn" style="padding:10px 18px;font-size:13px;" onclick="verifyEmailOtp()">Verify</button>
        </div>
        <div style="font-size:11px;color:#b5473a;margin-top:6px;" id="otpErr_email"></div>
        <div style="font-size:11px;color:#8a7480;margin-top:6px;" id="otpHint_email"></div>
      </div>
      `}

      <div style="display:flex;gap:10px;margin-top:10px;">
        <button class="btn btn-outline" style="flex:1;" onclick="renderCheckoutStep1()">Back</button>
        <button class="btn" style="flex:2;" ${bothVerified?'':'disabled'} onclick="renderCheckoutStep2()">Continue to Payment</button>
      </div>
    </div>`;

  /* restart cooldown display if OTP already sent */
  if(emailProvided && !otpState.email.verified && otpState.email.cooldown > 0) startEmailCooldown();
}
function renderCheckoutStep2(){
  const t = orderTotals();
  document.getElementById('checkoutModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('checkoutModalBg')">✕</button>
    <div class="checkout-shell">
      ${stepperHtml(3)}
      <h3 style="margin-bottom:16px;">Choose Payment Method</h3>
      <div class="pay-options">
        <div class="pay-opt ${selectedPayment==='upi'?'selected':''}" onclick="selectPayment('upi')"><div class="radio"></div><div class="pico">📱</div><div class="ptxt"><div class="t1">UPI</div><div class="t2">Google Pay, PhonePe, Paytm &amp; more</div></div></div>
        <div class="pay-opt ${selectedPayment==='banking'?'selected':''}" onclick="selectPayment('banking')"><div class="radio"></div><div class="pico">🏦</div><div class="ptxt"><div class="t1">Net Banking</div><div class="t2">Direct bank transfer</div></div></div>
      </div>
      <div class="order-summary">
        <div class="order-line"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.discount>0?`<div class="order-line" style="color:var(--moss)"><span>Coupon (${appliedCoupon.code})</span><span>−${money(t.discount)}</span></div>`:''}
        <div class="order-line"><span>Shipping</span><span>${t.ship===0?'Free':money(t.ship)}</span></div>
        ${settings.showGST?`<div class="order-line"><span>GST (${settings.gstRate}%)</span><span>${money(t.gst)}</span></div>`:`<div class="order-line"><span>GST</span><span>Not applicable</span></div>`}
        <div class="order-line total"><span>Total Payable</span><span>${money(t.total)}</span></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button class="btn btn-outline" style="flex:1;" onclick="renderCheckoutStep1b()">Back</button>
        <button class="btn" style="flex:2;" onclick="goToGateway()">Continue</button>
      </div>
    </div>`;
}
function selectPayment(method){ selectedPayment = method; renderCheckoutStep2(); }
function goToGateway(){
  if(!settings.paymentUpiId && selectedPayment==='upi'){
    alert('The store has not set up a UPI ID yet. Please choose Net Banking, or contact us.');
    return;
  }
  const bank = settings.paymentBank || {};
  if(selectedPayment==='banking' && !bank.accountNumber){
    alert('The store has not set up bank transfer details yet. Please choose UPI, or contact us.');
    return;
  }
  launchManualPayment(selectedPayment==='upi' ? 'UPI' : 'Net Banking');
}
async function finalizeOrder(paymentMethod){
  const t = orderTotals();
  const id = 'ACH' + Date.now().toString().slice(-8);
  const order = {
    id, date: new Date().toISOString(), customer: shippingData, payment: paymentMethod,
    paymentStatus: paymentMethod==='COD' ? 'Pending (COD)' : 'Paid',
    items: cartLines().map(l=>({name:l.product.name, size:l.size, qty:l.qty, price:l.product.price})),
    coupon: appliedCoupon ? appliedCoupon.code : null,
    subtotal:t.subtotal, discount:t.discount, shipping:t.ship, gst:t.gst, gstApplied: settings.showGST, total:t.total,
    status: 'Placed', uid: window.currentUser ? window.currentUser.uid : null
  };
  try{ await db.collection('orders').doc(id).set(order); }catch(e){ console.warn('order write failed', e); }

  // send order confirmation email
  sendOrderConfirmationEmail(order);

  cart = []; appliedCoupon = null; shippingData = null; selectedPayment='upi';
  otpState = { phone:{ verified:false }, email:{ code:null, verified:false, cooldown:0, sending:false } };
  saveLS('ach_cart', cart);
  updateCartCount();
  closeModal('checkoutModalBg');
  document.getElementById('successOrderId').textContent = id;
  document.getElementById('successPayNote').textContent = paymentMethod==='COD' ? `Pay ${money(order.total)} on delivery.` : `Payment of ${money(order.total)} received via ${paymentMethod}.`;
  const viewLink = document.getElementById('successViewOrderLink');
  if(viewLink) viewLink.href = 'confirmation.html?order=' + id;
  document.getElementById('successModalBg').classList.add('show');
  launchConfetti();
}

async function sendOrderConfirmationEmail(order){
  try {
    const itemsList = order.items.map(i=>`${i.name} (${i.size}) x${i.qty} — ₹${i.price}`).join('\n');
    await emailjs.send('service_xu0ot7h', 'template_336mhcg', {
      to_email: order.customer.email,
      to_name:  order.customer.name,
      otp_code: `Order Confirmed ✓\n\nOrder ID: ${order.id}\n\nItems:\n${itemsList}\n\nTotal: ₹${order.total}\nPayment: ${order.payment}\n\nWe'll ship to: ${order.customer.address}, ${order.customer.city} — ${order.customer.pin}\n\nThank you for shopping with ACH Boutique!`,
      order_note: `Order ID: ${order.id}`
    });
  } catch(e){ console.warn('Confirmation email failed:', e); }
}

/* RECENTLY VIEWED */
function trackRecentlyViewed(id){
  let rv = loadLS('ach_recently_viewed', []);
  rv = rv.filter(r=>r!==id); rv.unshift(id); rv = rv.slice(0,8);
  saveLS('ach_recently_viewed', rv);
  renderRecentlyViewed();
}
function renderRecentlyViewed(){
  const section = document.getElementById('recentlyViewed'); if(!section) return;
  const rv = loadLS('ach_recently_viewed', []).filter(id=>products.find(p=>p.id===id));
  if(rv.length===0){ section.style.display='none'; return; }
  section.style.display='block'; section.classList.add('in');
  document.getElementById('rvRow').innerHTML = rv.map(id=>{
    const p = products.find(pp=>pp.id===id);
    return `<div class="rv-item" onclick="openProduct('${p.id}')"><img src="${p.images[0]}"><div class="name">${p.name}</div><div class="price">${money(p.price)}</div></div>`;
  }).join('');
}
function renderInstaGrid(){
  const el = document.getElementById('instaGrid'); if(!el) return;
  const imgs = products.slice(0,5).map(p=>p.images[0]);
  el.innerHTML = imgs.map(img=>`<div class="insta-item"><img src="${img}"></div>`).join('');
}

/* REVIEWS — Firestore collection "reviews" */
async function loadReviewsFor(productId){
  const wrap = document.getElementById('reviewsBlock');
  if(!wrap) return;
  wrap.innerHTML = `<div style="margin-top:30px;border-top:1px solid var(--stone);padding-top:20px;"><div class="spinner-sm"></div></div>`;
  try{
    const snap = await db.collection('reviews').where('productId','==',productId).get();
    const reviews = snap.docs.map(d=>d.data());
    const seed = ratingFor(productId);
    wrap.innerHTML = `
      <div style="margin-top:30px;border-top:1px solid var(--stone);padding-top:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div style="font-size:13px;color:#8a7480;">★ ${seed.rating} · ${seed.count + reviews.length} reviews</div>
          <button class="mini-btn" onclick="toggleReviewForm()">Write a Review</button>
        </div>
        <div id="reviewFormWrap"></div>
        <div id="reviewList">${reviews.slice().reverse().map(r=>`<div class="review-item"><div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div><div class="review-text">${r.text}</div><div class="review-meta">${r.name}</div></div>`).join('') || '<p style="font-size:12px;color:#8a7480;">Be the first to leave a review for this piece.</p>'}</div>
      </div>`;
  }catch(e){ wrap.innerHTML = ''; }
}
function toggleReviewForm(){
  pickedStars = 5;
  const wrap = document.getElementById('reviewFormWrap');
  if(wrap.innerHTML){ wrap.innerHTML=''; return; }
  wrap.innerHTML = `
    <div style="background:var(--blush);border-radius:12px;padding:16px;margin-bottom:14px;">
      <div class="star-picker" id="starPicker">${[1,2,3,4,5].map(n=>`<span class="on" onclick="setStars(${n})">★</span>`).join('')}</div>
      <input type="text" id="reviewName" placeholder="Your name" style="width:100%;padding:9px;border:1px solid var(--stone);border-radius:6px;margin-bottom:8px;">
      <textarea id="reviewText" placeholder="Share your experience..." rows="2" style="width:100%;padding:9px;border:1px solid var(--stone);border-radius:6px;margin-bottom:8px;"></textarea>
      <button class="btn" style="padding:9px 18px;font-size:12px;" onclick="submitReview('${currentProduct.id}')">Submit Review</button>
    </div>`;
}
function setStars(n){ pickedStars=n; document.querySelectorAll('#starPicker span').forEach((s,i)=>s.classList.toggle('on', i<n)); }
async function submitReview(productId){
  const name = document.getElementById('reviewName').value.trim() || 'Anonymous';
  const text = document.getElementById('reviewText').value.trim();
  if(!text){ alert('Please write a short review.'); return; }
  try{
    await db.collection('reviews').add({productId, name, text, stars:pickedStars, date:new Date().toISOString()});
    showToast('Thanks for your review!');
    loadReviewsFor(productId);
    document.getElementById('reviewFormWrap').innerHTML='';
  }catch(e){ alert('Could not save your review right now.'); }
}

/* STYLE QUIZ */
function runQuiz(category){
  const picks = products.filter(p=>p.category===category).slice(0,3);
  document.getElementById('quizBody').innerHTML = `
    <div class="quiz-result">
      <p style="font-size:13px;margin-bottom:14px;">Here's your ${category} edit ✨</p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
        ${picks.map(p=>`<div style="cursor:pointer;width:110px;" onclick="openProduct('${p.id}')"><div style="aspect-ratio:3/4;border-radius:10px;overflow:hidden;margin-bottom:6px;"><img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;"></div><div style="font-size:11px;">${p.name}</div></div>`).join('')}
      </div>
      <button class="mini-btn" style="margin-top:16px;" onclick="location.reload()">Retake Quiz</button>
    </div>`;
}

/* SPIN WHEEL — equal-sized slices for a fair-looking wheel; the ACTUAL landing
   spot is picked by weighted probability from admin settings, then the wheel is
   rotated to stop precisely on that slice ("controlled pin"). */
function buildWheelSvg(){
  const svg = document.getElementById('wheelSvg');
  const prizes = (settings.wheelPrizes && settings.wheelPrizes.length) ? settings.wheelPrizes : DEFAULT_SETTINGS.wheelPrizes;
  const n = prizes.length;
  const sliceDeg = 360/n;
  let svgParts = [];
  prizes.forEach((p,i)=>{
    const start = -90 + i*sliceDeg, end = start+sliceDeg;
    const large = sliceDeg>180?1:0;
    const r=100,cx=100,cy=100;
    const x1 = cx + r*Math.cos(start*Math.PI/180), y1 = cy + r*Math.sin(start*Math.PI/180);
    const x2 = cx + r*Math.cos(end*Math.PI/180), y2 = cy + r*Math.sin(end*Math.PI/180);
    const mid = (start+end)/2;
    const lx = cx + 62*Math.cos(mid*Math.PI/180), ly = cy + 62*Math.sin(mid*Math.PI/180);
    svgParts.push(`<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${WHEEL_COLORS[i%WHEEL_COLORS.length]}"/>`);
    svgParts.push(`<text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" font-size="10" fill="#fff" font-family="Fraunces,serif" text-anchor="middle">${p.label}</text>`);
  });
  svg.innerHTML = svgParts.join('');
  return prizes;
}
function maybeShowWheel(){
  if(!settings.wheelEnabled) return;
  if(sessionStorage.getItem('ach_wheel_shown')) return;
  setTimeout(()=>{
    buildWheelSvg();
    document.getElementById('wheelModalBg').classList.add('show');
  }, 3500);
}
function pickWeightedPrize(prizes){
  const total = prizes.reduce((s,p)=>s+Number(p.weight||1),0) || 1;
  let r = Math.random()*total;
  for(const p of prizes){ r -= Number(p.weight||1); if(r<=0) return p; }
  return prizes[prizes.length-1];
}
function spinWheel(){
  document.getElementById('spinBtn').setAttribute('disabled','');
  const prizes = (settings.wheelPrizes && settings.wheelPrizes.length) ? settings.wheelPrizes : DEFAULT_SETTINGS.wheelPrizes;
  const n = prizes.length;
  const sliceDeg = 360/n;
  const prize = pickWeightedPrize(prizes); // probability decided here, off-screen
  const prizeIdx = prizes.indexOf(prize);
  // land the pointer in the middle of that equal slice, with a touch of randomness so it doesn't look robotic
  const jitter = (Math.random()-0.5) * (sliceDeg*0.5);
  const targetMid = -90 + prizeIdx*sliceDeg + sliceDeg/2 + jitter;
  const spins = 5*360 + (360 - (targetMid+90));
  document.getElementById('wheelSvg').style.transform = `rotate(${spins}deg)`;
  sessionStorage.setItem('ach_wheel_shown','1');
  setTimeout(()=>{
    if(prize.type!=='none' && prize.code){
      db.collection('coupons').doc(prize.code).set({code:prize.code, type:prize.type, value:prize.value, active:true, desc:`Won on the spin wheel — ${prize.label}`}, {merge:true}).catch(()=>{});
      document.getElementById('spinResult').innerHTML = `<p style="font-family:'Fraunces',serif;font-size:20px;">🎉 You won ${prize.label}!</p><p style="font-size:12px;margin-top:6px;">Use code <b>${prize.code}</b> at checkout.</p>`;
      launchConfetti();
    } else {
      document.getElementById('spinResult').innerHTML = `<p style="font-family:'Fraunces',serif;font-size:20px;">Almost! Better luck next visit 🍀</p>`;
    }
  }, 4300);
}

/* SCROLL REVEAL + COUNTDOWN */
function initScrollReveal(){
  const io = new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); }); }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}
let countdownTimer = null;
function renderCountdown(){
  if(countdownTimer) clearInterval(countdownTimer);
  const target = new Date(settings.saleEndDate || Date.now()+3*86400000);
  function tick(){
    const diff = Math.max(0, target - new Date());
    const d = Math.floor(diff/86400000), h = Math.floor(diff%86400000/3600000), m = Math.floor(diff%3600000/60000), s = Math.floor(diff%60000/1000);
    const el = document.getElementById('countdown');
    if(!el) return;
    el.innerHTML = [['DAYS',d],['HRS',h],['MIN',m],['SEC',s]].map(([lbl,val])=>`<div class="c-box"><div class="c-num">${String(val).padStart(2,'0')}</div><div class="c-lbl">${lbl}</div></div>`).join('');
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* TOAST + CONFETTI */
function showToast(msg){
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
function launchConfetti(){
  const colors = ['#e08ba8','#b79ee0','#eab3c6','#cda45e'];
  for(let i=0;i<40;i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random()*100+'vw';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    document.body.appendChild(el);
    const duration = 1800 + Math.random()*1400;
    el.animate([{transform:`translateY(0) rotate(0deg)`, opacity:1},{transform:`translateY(100vh) rotate(${360+Math.random()*360}deg)`, opacity:0.8}], {duration, easing:'ease-in'});
    setTimeout(()=>el.remove(), duration);
  }
}

/* INIT */
async function init(){
  updateCartCount();
  document.getElementById('wishCount').textContent = wishlist.length;
  initScrollReveal();
  try{
    await seedIfEmpty();
  }catch(e){ console.warn('Seeding skipped (likely Firestore rules):', e.message); }
  listenAll();
  setTimeout(maybeShowWheel, 500);
}
// init() is called by the page after injectSharedChrome()


let _postLoginCallback = null;

/* Firebase Auth's email/password provider needs an email-shaped identifier.
   We derive one from the phone number so customers only ever see "phone number". */
function phoneToEmail(phone){ return phone + '@ach-boutique.local'; }

function authErrMsg(e){
  const code = e.code || '';
  if(code.includes('email-already-in-use')) return 'An account already exists with this phone number. Try signing in instead.';
  if(code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if(code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-login-credentials')) return 'Incorrect phone number or password.';
  if(code.includes('user-not-found')) return 'No account found with this phone number. Create one instead?';
  if(code.includes('invalid-email')) return 'Enter a valid 10-digit phone number.';
  if(code.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes and try again.';
  if(code.includes('network-request-failed')) return 'Network error. Check your connection.';
  return (e.message || 'Something went wrong. Please try again.').replace('Firebase: ','').split(' (auth/')[0];
}

function openAccountOrLogin(){
  if(window.currentUser){
    // already signed in — show simple signed-in panel
    openSignedInPanel();
  } else {
    openAuthModal();
  }
}

async function openSignedInPanel(){
  const phone = window.currentUser.displayName || '';
  const uid = window.currentUser.uid;

  // fetch this user's orders
  let myOrders = [];
  try {
    const snap = await db.collection('orders').where('uid','==',uid).orderBy('date','desc').limit(20).get();
    myOrders = snap.docs.map(d=>({id:d.id,...d.data()}));
  } catch(e){ console.warn('orders fetch:', e); }

  document.getElementById('wishModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('wishModalBg')">✕</button>
    <div style="padding:32px;">
      <h2 style="margin-bottom:4px;">My Account</h2>
      <p style="font-size:13px;color:#8a7480;margin-bottom:24px;">Signed in as <b>${phone}</b></p>

      <h3 style="font-size:15px;margin-bottom:12px;">My Orders</h3>
      ${myOrders.length === 0
        ? `<p style="font-size:13px;color:#8a7480;margin-bottom:20px;">No orders yet. Start shopping!</p>`
        : myOrders.map(o=>`
          <div style="border:1px solid var(--stone);border-radius:12px;padding:14px 16px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:12px;font-weight:600;color:var(--charcoal);">${o.id}</span>
              <span style="font-size:11px;background:${o.status==='Delivered'?'#eef6ef':o.status==='Cancelled'?'#fdecea':'#f3f0fa'};color:${o.status==='Delivered'?'#3f6b41':o.status==='Cancelled'?'#b5473a':'#5c4a8a'};padding:3px 10px;border-radius:20px;">${o.status}</span>
            </div>
            <div style="font-size:12px;color:#8a7480;margin-bottom:4px;">${new Date(o.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
            <div style="font-size:13px;margin-bottom:6px;">${o.items.map(i=>i.name+' x'+i.qty).join(', ')}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;">₹${o.total}</span>
              <span style="font-size:11px;color:#8a7480;">${o.payment} · ${o.paymentStatus||''}</span>
            </div>
          </div>`).join('')}

      <button class="btn btn-outline" style="width:100%;margin-top:12px;" onclick="signOutUser()">Sign Out</button>
    </div>`;
  document.getElementById('wishModalBg').classList.add('show');
}

function openAuthModal(callback){
  _postLoginCallback = callback || null;
  switchAuthStep('login');
  document.getElementById('authModalBg').classList.add('show');
}

function closeAuthModal(){
  document.getElementById('authModalBg').classList.remove('show');
}

/* Swaps between the login form and the create-account form inside the same
   modal, and resets error/inputs. Also used by signup.html / login.html. */
function switchAuthStep(step){
  const isLogin = step==='login';
  document.getElementById('authStepLogin').style.display = isLogin ? '' : 'none';
  document.getElementById('authStepSignup').style.display = isLogin ? 'none' : '';
  document.getElementById('authStepDone').style.display = 'none';
  ['authErrLogin','authErrSignup'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=''; });
  const loginBtn = document.getElementById('authLoginBtn');
  if(loginBtn){ loginBtn.disabled=false; loginBtn.textContent='Sign In'; }
  const signupBtn = document.getElementById('authSignupBtn');
  if(signupBtn){ signupBtn.disabled=false; signupBtn.textContent='Create Account'; }
}
function resetAuthModal(){ switchAuthStep('login'); }

async function signInWithPassword(){
  const phone = document.getElementById('authPhoneLogin').value.trim();
  const password = document.getElementById('authPasswordLogin').value;
  const err = document.getElementById('authErrLogin');
  if(phone.length !== 10){ err.textContent = 'Enter a valid 10-digit mobile number.'; return; }
  if(!password){ err.textContent = 'Enter your password.'; return; }
  const btn = document.getElementById('authLoginBtn');
  btn.disabled = true; btn.textContent = 'Signing in…'; err.textContent = '';
  try {
    const cred = await auth.signInWithEmailAndPassword(phoneToEmail(phone), password);
    const user = cred.user;
    await db.collection('customers').doc(user.uid).set({
      phone, uid: user.uid, lastLogin: new Date().toISOString()
    }, { merge: true });
    showAuthSuccess(phone);
  } catch(e){
    console.error('signIn error:', e);
    err.textContent = authErrMsg(e);
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

async function signUpWithPassword(){
  const phone = document.getElementById('authPhoneSignup').value.trim();
  const password = document.getElementById('authPasswordSignup').value;
  const confirm = document.getElementById('authPasswordConfirm').value;
  const err = document.getElementById('authErrSignup');
  if(phone.length !== 10){ err.textContent = 'Enter a valid 10-digit mobile number.'; return; }
  if(password.length < 6){ err.textContent = 'Password must be at least 6 characters.'; return; }
  if(password !== confirm){ err.textContent = 'Passwords do not match.'; return; }
  const btn = document.getElementById('authSignupBtn');
  btn.disabled = true; btn.textContent = 'Creating account…'; err.textContent = '';
  try {
    const cred = await auth.createUserWithEmailAndPassword(phoneToEmail(phone), password);
    const user = cred.user;
    await user.updateProfile({ displayName: phone });
    await db.collection('customers').doc(user.uid).set({
      phone, uid: user.uid, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
    }, { merge: true });
    showAuthSuccess(phone, true);
  } catch(e){
    console.error('signUp error:', e);
    err.textContent = authErrMsg(e);
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

function showAuthSuccess(phone, isNew){
  document.getElementById('authStepLogin').style.display = 'none';
  document.getElementById('authStepSignup').style.display = 'none';
  document.getElementById('authStepDone').style.display = '';
  document.getElementById('authDoneMsg').textContent = isNew
    ? `Account created! Signed in as +91 ${phone}`
    : `Welcome back! Signed in as +91 ${phone}`;
  setTimeout(()=>{
    closeAuthModal();
    showToast(isNew ? 'Account created 🎉' : 'Signed in successfully 🎉');
    if(_postLoginCallback){ _postLoginCallback(); _postLoginCallback = null; }
  }, 1400);
}

function updateAccountIcon(){
  const inner = document.getElementById('accountIconInner');
  if(!inner) return;
  if(window.currentUser){
    const phone = window.currentUser.displayName || '';
    // show last 4 digits as a small pill
    const last4 = phone.slice(-4);
    inner.innerHTML = `<div class="account-initial">${last4}</div>`;
  } else {
    inner.textContent = '👤';
  }
}
/* Header account icon now navigates to a real page instead of opening the
   old modal-overlay — signed-in users go to their account, others to login. */
function goToAccount(){
  window.location.href = window.currentUser ? 'account.html' : 'login.html';
}

async function signOutUser(){
  await auth.signOut();
  closeModal('wishModalBg');
  showToast('Signed out.');
}

// intercept checkout: require login first
const _origOpenCheckout = window.openCheckout;
window.openCheckout = function(){
  if(cart.length === 0) return;
  if(!window.currentUser){
    closeCart();
    openAuthModal(()=>{
      // after login, re-open cart so customer can proceed
      setTimeout(openCart, 300);
    });
    return;
  }
  if(_origOpenCheckout) _origOpenCheckout();
};

async function launchManualPayment(method){
  // method is 'UPI' or 'Net Banking' — both are manual/offline collection (no payment gateway).
  const t = orderTotals();
  const orderId = 'ACH' + Date.now().toString().slice(-8);
  const order = {
    id: orderId,
    date: new Date().toISOString(),
    customer: shippingData,
    uid: window.currentUser ? window.currentUser.uid : null,
    payment: method,
    paymentStatus: 'Pending',
    items: cartLines().map(l=>({name:l.product.name, size:l.size, qty:l.qty, price:l.product.price})),
    coupon: appliedCoupon ? appliedCoupon.code : null,
    subtotal: t.subtotal, discount: t.discount, shipping: t.ship,
    gst: t.gst, gstApplied: settings.showGST, total: t.total,
    status: 'Placed'
  };
  try { await db.collection('orders').doc(orderId).set(order); } catch(e){ console.warn('order write failed', e); }

  closeModal('checkoutModalBg');

  if(method==='UPI'){
    const upiId = settings.paymentUpiId;
    const payeeName = 'ACH Boutique';
    const amount = t.total.toFixed(2);
    const note = encodeURIComponent('ACH Order ' + orderId);
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${note}`;
    showManualPaymentModal({ method, orderId, amount, upiLink, upiId });
  } else {
    showManualPaymentModal({ method, orderId, amount: t.total.toFixed(2) });
  }
}

function showManualPaymentModal({ method, orderId, amount, upiLink, upiId }){
  const existing = document.getElementById('upiModalBg');
  if(existing) existing.remove();

  const isMobile = window.innerWidth <= 768;
  const bank = settings.paymentBank || {};

  const el = document.createElement('div');
  el.className = 'upi-modal-bg';
  el.id = 'upiModalBg';

  let bodyHtml = '';

  if(method==='UPI'){
    bodyHtml = `
      ${isMobile ? `
      <p style="font-size:12px;color:#8a7480;margin-bottom:12px;">Tap to open your UPI app</p>
      <div class="upi-apps-row">
        <a class="upi-app-btn" href="${upiLink}" onclick="upiAppOpened('${orderId}')"><span class="ico">G</span><span>GPay</span></a>
        <a class="upi-app-btn" href="${upiLink}" onclick="upiAppOpened('${orderId}')"><span class="ico">📲</span><span>PhonePe</span></a>
        <a class="upi-app-btn" href="${upiLink}" onclick="upiAppOpened('${orderId}')"><span class="ico">P</span><span>Paytm</span></a>
        <a class="upi-app-btn" href="${upiLink}" onclick="upiAppOpened('${orderId}')"><span class="ico">↗</span><span>Any App</span></a>
      </div>
      ` : `
      <div id="upiQrWrap" style="display:block;">
        <p>Scan with any UPI app — GPay, PhonePe, Paytm</p>
        <div id="upiQr">${settings.paymentQrImage ? `<img src="${settings.paymentQrImage}" style="width:180px;height:180px;object-fit:contain;">` : ''}</div>
      </div>
      `}
      <div class="upi-divider">or pay manually to</div>
      <div class="upi-id-display">
        <span>${upiId}</span>
        <span style="font-size:11px;color:#8a7480;">ACH Boutique</span>
      </div>`;
  } else {
    bodyHtml = `
      <div class="upi-id-display" style="flex-direction:column;align-items:flex-start;gap:6px;">
        <div><b>Account Name:</b> ${bank.accountName||'—'}</div>
        <div><b>Account Number:</b> ${bank.accountNumber||'—'}</div>
        <div><b>IFSC Code:</b> ${bank.ifsc||'—'}</div>
        <div><b>Bank:</b> ${bank.bankName||'—'}</div>
      </div>
      <p style="font-size:12px;color:#8a7480;margin-top:10px;">Transfer using any bank app (NEFT/IMPS/UPI to account) and confirm below once done.</p>`;
  }

  el.innerHTML = `
    <div class="upi-modal-box">
      <h2>${method==='UPI' ? 'Pay via UPI' : 'Pay via Net Banking'}</h2>
      <p class="upi-sub">Complete your payment to confirm the order</p>
      <div class="upi-amount-badge">₹${amount}</div>
      ${bodyHtml}
      <p style="font-size:11px;color:#a3939c;margin:14px 0 18px;">Order ID: <b>${orderId}</b> · Amount: <b>₹${amount}</b></p>
      <div class="upi-success-note" id="upiSuccessNote">
        ✅ Payment initiated. Once you've sent the money, tap the button below.
      </div>
      <button class="upi-paid-btn" id="upiConfirmBtn" onclick="manualPaymentConfirmed('${orderId}', '${amount}', '${method}')">
        I've Paid — Confirm Order
      </button>
      <button class="upi-cancel-btn" onclick="manualPaymentCancelled('${orderId}')">Cancel Order</button>
    </div>`;

  document.body.appendChild(el);

  if(method==='UPI' && !isMobile && !settings.paymentQrImage){
    loadUpiQr(upiLink);
  }
}

function loadUpiQr(text){
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  script.onload = () => {
    const el = document.getElementById('upiQr');
    if(el) new QRCode(el, { text, width:180, height:180, colorDark:'#3a2e38', colorLight:'#ffffff' });
  };
  document.head.appendChild(script);
}

function upiAppOpened(orderId){
  setTimeout(()=>{
    const note = document.getElementById('upiSuccessNote');
    if(note) note.style.display = 'block';
  }, 2500);
}

async function manualPaymentConfirmed(orderId, amount, method){
  const btn = document.getElementById('upiConfirmBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'Pending Verification',
      paidAt: new Date().toISOString()
    });
  } catch(e){ console.warn('status update failed', e); }

  if(shippingData && shippingData.email){
    sendOrderConfirmationEmail({
      id: orderId, customer: shippingData, payment: method,
      items: cartLines().map(l=>({name:l.product.name, size:l.size, qty:l.qty, price:l.product.price})),
      total: amount
    });
  }

  cart = []; appliedCoupon = null; shippingData = null; selectedPayment = 'upi';
  otpState = { phone:{verified:false}, email:{ code:null, verified:false, cooldown:0, sending:false, forEmail:null } };
  saveLS('ach_cart', cart);
  updateCartCount();

  const modalEl = document.getElementById('upiModalBg');
  if(modalEl) modalEl.remove();

  document.getElementById('successOrderId').textContent = orderId;
  document.getElementById('successPayNote').textContent =
    `Payment of ₹${amount} via ${method} is being verified. We'll confirm your order shortly.`;
  const viewLink = document.getElementById('successViewOrderLink');
  if(viewLink) viewLink.href = 'confirmation.html?order=' + orderId;
  document.getElementById('successModalBg').classList.add('show');
  launchConfetti();
}

async function manualPaymentCancelled(orderId){
  if(!confirm('Cancel this order?')) return;
  try {
    await db.collection('orders').doc(orderId).update({ status:'Cancelled', paymentStatus:'Cancelled' });
  } catch(e){}
  const modalEl = document.getElementById('upiModalBg');
  if(modalEl) modalEl.remove();
  showToast('Order cancelled.');
}
