const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DB = path.join(DATA_DIR, "db.json");
if (!fs.existsSync(DB)) {
  fs.writeFileSync(DB, JSON.stringify({
    products: [
      {id: 1, name:"Netflix Premium 4K", description:"รับชมความบันเทิงระดับ 4K", days:30, price:99, category:"Streaming", icon:"N"},
      {id: 2, name:"YouTube Premium", description:"ดูวิดีโอแบบไม่มีโฆษณา", days:30, price:69, category:"Streaming", icon:"▶"},
      {id: 3, name:"Disney+ Hotstar", description:"รับชมหนังและซีรีส์", days:30, price:99, category:"Streaming", icon:"D+"},
      {id: 4, name:"Viu Premium", description:"ซีรีส์และรายการยอดนิยม", days:30, price:15, category:"Streaming", icon:"viu"},
      {id: 5, name:"WeTV Premium", description:"รับชมคอนเทนต์ VIP", days:30, price:30, category:"Streaming", icon:"W"},
      {id: 6, name:"Canva Pro", description:"เครื่องมือออกแบบระดับ Pro", days:30, price:69, category:"Design", icon:"C"},
      {id: 7, name:"CapCut Pro", description:"เครื่องมือตัดต่อระดับ Pro", days:30, price:89, category:"Design", icon:"✂"},
      {id: 8, name:"ChatGPT", description:"เครื่องมือ AI สำหรับงานต่าง ๆ", days:30, price:99, category:"AI", icon:"AI"}
    ],
    settings: {
      shopName:"ณภัทร & พรีเมี่ยม",
      bankName:"ธนาคารกสิกรไทย",
      accountNumber:"000-0-00000-0",
      accountName:"ณัฐภัทร พุงเงิน"
    },
    users: [],
    orders: []
  }, null, 2));
}
function readDB(){ return JSON.parse(fs.readFileSync(DB, "utf8")); }
function writeDB(db){ fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }
function nextId(arr){ return arr.length ? Math.max(...arr.map(x=>Number(x.id)||0))+1 : 1; }

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb)=>cb(null, UPLOAD_DIR),
    filename: (_, file, cb)=>cb(null, Date.now()+"-"+file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"))
  }),
  limits:{fileSize: 8*1024*1024}
});

// Public data
app.get("/api/store", (req,res)=>{
  const db=readDB();
  res.json({products:db.products, settings:db.settings});
});

// Register / login
app.post("/api/register",(req,res)=>{
  const {username,email,password}=req.body;
  if(!username || !email || !password) return res.status(400).json({error:"กรอกข้อมูลให้ครบ"});
  const db=readDB();
  if(db.users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(409).json({error:"อีเมลนี้มีบัญชีแล้ว"});
  const user={id:nextId(db.users),username,email,password};
  db.users.push(user); writeDB(db);
  res.json({ok:true,user:{id:user.id,username:user.username,email:user.email}});
});
app.post("/api/login",(req,res)=>{
  const {email,password}=req.body;
  if(email===ADMIN_EMAIL && password===ADMIN_PASSWORD) return res.json({ok:true,admin:true,user:{username:"Admin",email}});
  const db=readDB(), u=db.users.find(x=>x.email===email && x.password===password);
  if(!u) return res.status(401).json({error:"อีเมลหรือรหัสผ่านไม่ถูกต้อง"});
  res.json({ok:true,admin:false,user:{id:u.id,username:u.username,email:u.email}});
});

// Orders
app.post("/api/orders",(req,res)=>{
  const {userId,customer,items}=req.body;
  if(!customer || !items?.length) return res.status(400).json({error:"ข้อมูลออเดอร์ไม่ครบ"});
  const db=readDB();
  const total=items.reduce((s,i)=>s+(Number(i.price)*Number(i.qty)),0);
  const order={id:"ORD"+Date.now(),userId:userId||null,customer,items,total,status:"รอชำระเงิน",slip:null,createdAt:new Date().toISOString()};
  db.orders.push(order); writeDB(db);
  res.json({ok:true,order});
});
app.post("/api/orders/:id/slip", upload.single("slip"), (req,res)=>{
  if(!req.file) return res.status(400).json({error:"กรุณาแนบสลิป"});
  const db=readDB(), order=db.orders.find(o=>o.id===req.params.id);
  if(!order) return res.status(404).json({error:"ไม่พบออเดอร์"});
  order.slip="/uploads/"+req.file.filename;
  order.status="รอตรวจสอบสลิป";
  writeDB(db);
  res.json({ok:true,order});
});

// Admin
function adminOnly(req,res,next){
  if(req.headers["x-admin-token"]!=="premium-admin") return res.status(403).json({error:"ไม่มีสิทธิ์"});
  next();
}
app.get("/api/admin/orders",adminOnly,(req,res)=>res.json(readDB().orders));
app.get("/api/admin/products",adminOnly,(req,res)=>res.json(readDB().products));
app.get("/api/admin/settings",adminOnly,(req,res)=>res.json(readDB().settings));

app.post("/api/admin/products",adminOnly,(req,res)=>{
  const db=readDB(), p={...req.body,id:nextId(db.products),days:Number(req.body.days),price:Number(req.body.price)};
  if(!p.name || !p.days || !p.price) return res.status(400).json({error:"กรอกชื่อ จำนวนวัน และราคา"});
  db.products.push(p); writeDB(db); res.json(p);
});
app.put("/api/admin/products/:id",adminOnly,(req,res)=>{
  const db=readDB(), p=db.products.find(x=>String(x.id)===req.params.id);
  if(!p) return res.status(404).json({error:"ไม่พบสินค้า"});
  Object.assign(p,req.body);
  p.days=Number(p.days); p.price=Number(p.price);
  writeDB(db); res.json(p);
});
app.delete("/api/admin/products/:id",adminOnly,(req,res)=>{
  const db=readDB(); db.products=db.products.filter(x=>String(x.id)!==req.params.id); writeDB(db); res.json({ok:true});
});
app.put("/api/admin/settings",adminOnly,(req,res)=>{
  const db=readDB(); db.settings={...db.settings,...req.body}; writeDB(db); res.json(db.settings);
});
app.put("/api/admin/orders/:id/status",adminOnly,(req,res)=>{
  const db=readDB(), o=db.orders.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"ไม่พบออเดอร์"});
  o.status=req.body.status; writeDB(db); res.json(o);
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Premium Shop running on port ${PORT}`));
