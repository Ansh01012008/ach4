/* ============================================================
   ACH Boutique — shared config
   All pages load the Firebase compat SDKs first, then this file.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBklGlLAK-CvIFfS9K6UqsN3Jk9p58YgQk",
  authDomain: "achweb-8256f.firebaseapp.com",
  projectId: "achweb-8256f",
  storageBucket: "achweb-8256f.firebasestorage.app",
  messagingSenderId: "292133177844",
  appId: "1:292133177844:web:f509be1061d0d8e6aa11a1"
};

firebase.initializeApp(firebaseConfig);
const db      = firebase.firestore();
const storage = firebase.storage();
const auth    = firebase.auth();

/* EmailJS — public key, safe to commit */
const EJS_SERVICE  = 'service_xu0ot7h';
const EJS_TEMPLATE = 'template_336mhcg';

/* currency helper */
function money(n){ return '₹' + Number(n).toLocaleString('en-IN'); }

/* redirect to login if not signed in, then come back */
function requireAuth(){
  return new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      if(user){ resolve(user); }
      else {
        const back = encodeURIComponent(location.href);
        location.href = `login.html?next=${back}`;
      }
    });
  });
}

/* show a small toast */
function showToast(msg, duration=3000){
  let t = document.getElementById('_toast');
  if(!t){
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = `position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
      background:#3a2e38;color:#fff;padding:10px 22px;border-radius:24px;
      font-size:13px;z-index:9999;opacity:0;transition:opacity .25s;pointer-events:none;
      font-family:'Jost',sans-serif;white-space:nowrap;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.opacity='0'; }, duration);
}

/* send email via EmailJS */
async function sendEmail(to_email, to_name, message, note=''){
  await emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
    to_email, to_name, otp_code: message, order_note: note
  });
}

/* shared CSS variables injected into <head> */
const ACH_THEME = `
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root{
      --rose:#e08ba8;--blush:#fdf0f5;--blush-deep:#f5d6e4;
      --lavender:#d9cdf0;--lavender-deep:#b79ee0;
      --ivory:#fdf6f1;--stone:#ecdfe6;--charcoal:#3a2e38;
      --white:#fff;--moss:#4a6741;
    }
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Jost',sans-serif;background:var(--ivory);color:var(--charcoal);min-height:100vh;}
    a{color:inherit;text-decoration:none;}
    button{cursor:pointer;font-family:inherit;}
    input,textarea,select{font-family:inherit;}
    .btn{
      display:inline-block;padding:12px 28px;
      background:linear-gradient(120deg,var(--rose),var(--lavender-deep));
      color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;transition:opacity .2s;
    }
    .btn:hover{opacity:.88;}
    .btn:disabled{opacity:.42;pointer-events:none;}
    .btn-outline{background:transparent;border:1px solid var(--stone);color:var(--charcoal);}
    .btn-outline:hover{background:var(--stone);}
    .card{background:var(--white);border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(58,46,56,.06);}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
    .field label{font-size:12px;color:#8a7480;font-weight:500;letter-spacing:.04em;text-transform:uppercase;}
    .field input,.field select,.field textarea{
      padding:11px 14px;border:1px solid var(--stone);border-radius:8px;
      font-size:14px;background:var(--ivory);color:var(--charcoal);
    }
    .field input:focus,.field select:focus,.field textarea:focus{
      outline:none;border-color:var(--rose);
    }
    /* top nav shared across customer pages */
    .site-nav{
      position:sticky;top:0;z-index:50;background:var(--white);
      border-bottom:1px solid var(--stone);padding:0 24px;
      display:flex;align-items:center;justify-content:space-between;height:60px;
    }
    .site-nav .logo{font-family:'Fraunces',serif;font-size:20px;letter-spacing:.02em;}
    .site-nav .nav-links{display:flex;gap:24px;font-size:13px;}
    .site-nav .nav-links a{color:#8a7480;transition:color .15s;}
    .site-nav .nav-links a:hover,.site-nav .nav-links a.active{color:var(--charcoal);}
    .site-nav .nav-icons{display:flex;gap:12px;align-items:center;}
    .icon-btn{background:none;border:none;font-size:18px;padding:6px;border-radius:8px;transition:background .15s;}
    .icon-btn:hover{background:var(--blush);}
    .page-wrap{max-width:1100px;margin:0 auto;padding:32px 24px;}
    .page-title{font-family:'Fraunces',serif;font-size:28px;margin-bottom:8px;}
    .page-sub{font-size:13px;color:#8a7480;margin-bottom:28px;}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:500;}
    .badge.placed{background:#f3f0fa;color:#5c4a8a;}
    .badge.processing{background:#fff8ec;color:#7a5f2a;}
    .badge.shipped{background:#e6f1fb;color:#185fa5;}
    .badge.delivered{background:#eef6ef;color:#3f6b41;}
    .badge.cancelled{background:#fdecea;color:#b5473a;}
    .err{font-size:12px;color:#b5473a;margin-top:4px;min-height:14px;}
    @media(max-width:680px){
      .site-nav .nav-links{display:none;}
      .page-wrap{padding:20px 16px;}
    }
  </style>
`;
