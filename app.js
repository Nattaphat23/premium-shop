const defaultProducts=[
{id:1,name:"Netflix Premium 4K",description:"รับชมความบันเทิงระดับ 4K",price:99,duration:"30 วัน"},
{id:2,name:"YouTube Premium",description:"ดูวิดีโอแบบไม่มีโฆษณา",price:59,duration:"30 วัน"},
{id:3,name:"Disney+",description:"รับชมหนังและซีรีส์",price:69,duration:"30 วัน"},
{id:4,name:"Viu Premium",description:"ซีรีส์และรายการยอดนิยม",price:39,duration:"30 วัน"},
{id:5,name:"WeTV VIP",description:"รับชมคอนเทนต์ VIP",price:49,duration:"30 วัน"},
{id:6,name:"CapCut Pro",description:"เครื่องมือตัดต่อระดับ Pro",price:79,duration:"30 วัน"}
];

const KEY={products:"ps_products_v2",cart:"ps_cart_v2",orders:"ps_orders_v2",users:"ps_users_v2",user:"ps_user_v2"};
let products=load(KEY.products,defaultProducts),cart=load(KEY.cart,[]),orders=load(KEY.orders,[]);
let authMode="login", pendingOrder=null, slipData="";

function load(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(n){return Number(n).toLocaleString("th-TH")+"฿"}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function go(id){document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});renderAll()}
function currentUser(){return load(KEY.user,null)}
function updateAuth(){const u=currentUser();document.getElementById("authBtn").textContent=u?`👤 ${u.name}`:"เข้าสู่ระบบ"}
function renderProducts(){
 const q=(document.getElementById("search")?.value||"").toLowerCase();
 const list=products.filter(p=>(p.name+" "+p.description).toLowerCase().includes(q));
 document.getElementById("productGrid").innerHTML=list.map(p=>`
 <article class="product-card">
  <div class="product-icon">✦</div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>
  <div class="muted">${esc(p.duration)}</div><div class="price">${money(p.price)}</div>
  <button class="primary" onclick="addCart(${p.id})">เพิ่มลงตะกร้า</button>
 </article>`).join("")||`<div class="empty">ไม่พบสินค้าที่ค้นหา</div>`;
}
function addCart(id){const x=cart.find(i=>i.id===id);x?x.qty++:cart.push({id,qty:1});save(KEY.cart,cart);renderAll();toast("เพิ่มสินค้าลงตะกร้าแล้ว")}
function changeQty(id,d){const x=cart.find(i=>i.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);save(KEY.cart,cart);renderAll()}
function renderCart(){
 const box=document.getElementById("cartList"),count=cart.reduce((a,b)=>a+b.qty,0);document.getElementById("cartCount").textContent=count;
 if(!cart.length){box.innerHTML='<div class="empty">ยังไม่มีสินค้าในตะกร้า</div>';document.getElementById("cartTotal").textContent="0฿";return}
 let total=0;
 box.innerHTML=cart.map(i=>{const p=products.find(x=>x.id===i.id);if(!p)return"";total+=p.price*i.qty;return `<div class="cart-item"><div><b>${esc(p.name)}</b><div class="muted">${money(p.price)} × ${i.qty}</div></div><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${p.id},1)">+</button></div></div>`}).join("");
 document.getElementById("cartTotal").textContent=money(total)
}
function checkout(){
 if(!cart.length)return toast("กรุณาเลือกสินค้าก่อน");
 if(!currentUser()){openAuth();toast("กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อนสั่งซื้อ");return}
 const items=cart.map(i=>{const p=products.find(x=>x.id===i.id);return{name:p.name,qty:i.qty,price:p.price,duration:p.duration}});
 const total=items.reduce((s,i)=>s+i.price*i.qty,0);
 const o={id:"ORD-"+Date.now().toString().slice(-8),user:currentUser().email,items,total,status:"รอตรวจสอบ",slip:null,created:new Date().toLocaleString("th-TH")};
 orders.unshift(o);save(KEY.orders,orders);cart=[];save(KEY.cart,cart);pendingOrder=o.id;renderAll();openPayment();toast("สร้างออเดอร์แล้ว")}
function renderOrders(){
 const u=currentUser(),list=u?orders.filter(o=>o.user===u.email):[];
 document.getElementById("ordersList").innerHTML=!u?'<div class="empty">เข้าสู่ระบบเพื่อดูประวัติออเดอร์</div>':!list.length?'<div class="empty">ยังไม่มีออเดอร์</div>':list.map(o=>`<div class="order"><div style="display:flex;justify-content:space-between;gap:10px"><b>${o.id}</b><span class="status ${o.status==="ชำระแล้ว"?"paid":"pending"}">${o.status}</span></div><div class="muted">${o.created}</div><p>${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join("<br>")}</p><b>ยอดรวม ${money(o.total)}</b>${o.slip?'<div class="muted">✓ แนบสลิปแล้ว รอตรวจสอบ</div>':''}</div>`).join("")
}
function openModal(id){document.getElementById(id).classList.remove("hidden")}
function closeModal(id){document.getElementById(id).classList.add("hidden")}
function openAuth(){authMode="login";setAuthUI();openModal("authModal")}
function switchAuth(){authMode=authMode==="login"?"register":"login";setAuthUI()}
function setAuthUI(){document.getElementById("authTitle").textContent=authMode==="login"?"เข้าสู่ระบบ":"สมัครสมาชิก";document.getElementById("authName").classList.toggle("hidden",authMode==="login");document.getElementById("switchAuth").textContent=authMode==="login"?"ยังไม่มีบัญชี? สมัครสมาชิก":"มีบัญชีแล้ว? เข้าสู่ระบบ"}
function submitAuth(){
 const email=document.getElementById("authEmail").value.trim(),pass=document.getElementById("authPass").value,name=document.getElementById("authName").value.trim();
 if(!email||!pass)return toast("กรุณากรอกข้อมูลให้ครบ");
 let users=load(KEY.users,[]);
 if(authMode==="register"){if(users.some(u=>u.email===email))return toast("อีเมลนี้มีบัญชีแล้ว");const u={email,pass,name:name||email.split("@")[0]};users.push(u);save(KEY.users,users);save(KEY.user,u);closeModal("authModal");updateAuth();renderOrders();toast("สมัครสมาชิกสำเร็จ")}
 else{const u=users.find(u=>u.email===email&&u.pass===pass);if(!u)return toast("อีเมลหรือรหัสผ่านไม่ถูกต้อง");save(KEY.user,u);closeModal("authModal");updateAuth();renderOrders();toast("เข้าสู่ระบบสำเร็จ")}}
function openPayment(){if(!currentUser()){openAuth();return}openModal("paymentModal")}
function previewSlip(){const f=document.getElementById("slipInput").files[0];if(!f)return;const r=new FileReader();r.onload=e=>{slipData=e.target.result;const img=document.getElementById("slipPreview");img.src=slipData;img.classList.remove("hidden")};r.readAsDataURL(f)}
function submitSlip(){
 if(!pendingOrder)return toast("ยังไม่มีออเดอร์ที่รอชำระ");
 if(!slipData)return toast("กรุณาแนบสลิปก่อน");
 const o=orders.find(x=>x.id===pendingOrder);if(!o)return;
 o.slip=slipData;o.status="รอตรวจสอบ";save(KEY.orders,orders);pendingOrder=null;closeModal("paymentModal");renderOrders();toast("ส่งสลิปแล้ว รอแอดมินตรวจสอบ")}
function openAdmin(){
 const pass=prompt("รหัส Admin (ตัวอย่างระบบนี้):");if(pass!=="1234")return toast("รหัส Admin ไม่ถูกต้อง");
 document.getElementById("statProducts").textContent=products.length;document.getElementById("statOrders").textContent=orders.length;document.getElementById("statPaid").textContent=orders.filter(o=>o.slip&&o.status==="รอตรวจสอบ").length;
 document.getElementById("adminOrders").innerHTML=orders.length?orders.map(o=>`<div class="admin-order"><b>${o.id}</b> — ${money(o.total)} — ${o.status}<br><span class="muted">${esc(o.user)}</span>${o.slip?`<br><button class="ghost" onclick="viewSlip('${o.id}')">ดูสลิป</button><button class="primary" onclick="approve('${o.id}')">อนุมัติ</button>`:""}</div>`).join(""):"<div class='empty'>ยังไม่มีออเดอร์</div>";
 openModal("adminModal")
}
function viewSlip(id){const o=orders.find(x=>x.id===id);if(o?.slip){const w=window.open();w.document.write(`<img src="${o.slip}" style="max-width:100%">`)}}
function approve(id){const o=orders.find(x=>x.id===id);if(!o)return;o.status="ชำระแล้ว";save(KEY.orders,orders);openAdmin();renderOrders();toast("อนุมัติออเดอร์แล้ว")}
function addProduct(){const name=document.getElementById("newName").value.trim(),price=Number(document.getElementById("newPrice").value),duration=document.getElementById("newDuration").value.trim()||"30 วัน";if(!name||!price)return toast("กรอกชื่อและราคา");products.push({id:Date.now(),name,description:"สินค้าใหม่",price,duration});save(KEY.products,products);document.getElementById("newName").value="";document.getElementById("newPrice").value="";document.getElementById("newDuration").value="";renderProducts();openAdmin();toast("เพิ่มสินค้าแล้ว")}
function renderAll(){renderProducts();renderCart();renderOrders();updateAuth()}
renderAll();
