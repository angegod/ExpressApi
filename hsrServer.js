const express = require("express");
const bodyParser = require("body-parser");
const cors=require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Define the CORS options
var corsOptions = {
  origin: 'https://angegod.github.io',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 限制每個 IP 在 15 分鐘內最多請求 50 次
    standardHeaders: true, // 在 response header 顯示 RateLimit 限制
    legacyHeaders: false, // 不使用 `X-RateLimit-*` headers
    handler: (req, res) => {
      // **在429回應時加入 CORS headers**
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
      res.status(429).json({
        success: false,
        error: '請求過於頻繁，請稍後再試。',
      });
    },
  });
  
// 套用到所有路由
app.use(bodyParser.urlencoded({ extended: true })); //Handles normal post requests
app.use(bodyParser.json()); //Handles JSON requests

//如果是預檢請求，則跳過頻率檢測
app.use(function (req, res, next) {

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      return res.sendStatus(200);
    }
    return limiter(req, res, next);
});


app.get("/get/:uid",async (req,res)=>{
    const origin = req.headers.origin;
    const allowedOrigins = ['https://angegod.github.io', 'http://localhost:3000'];
    let userId=req.params.uid;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin); // 允許該來源
    } else {
      res.setHeader('Access-Control-Allow-Origin', ''); // 拒絕該來源
      return res.status(403).send({ error: "Forbidden" }); // 提前返回
    }
  
    //修正目錄變歷的問題
    if (!/^\d+$/.test(userId)) { // 僅允許數字
      return res.status(400).send({ error: "Invalid user ID" });
    }
  
    const request = await fetch(`https://api.mihomo.me/sr_info_parsed/${userId}?lang=cht`);
    const data = await request.json();
  
    //console.log(data.player.uid);
    res.send(JSON.stringify(data));
  
});

app.post("/relic/get",cors(corsOptions),async(req,res)=>{
    
    const origin = req.headers.origin;
    const allowedOrigins = ['https://angegod.github.io', 'http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let senddata = req.body;
    let userId=senddata.uid;
    let partsIndex=senddata.partsIndex;
    let charID=senddata.charID;
    //console.log(senddata);

    if (!/^\d+$/.test(userId)) { // 僅允許數字
        return res.status(400).send({ error: "Invalid user ID" });
    }

    //先撈資料
    const request = await fetch(`https://api.mihomo.me/sr_info_parsed/${userId}?lang=cht`);
    const data = await request.json();

    if(data.characters===undefined){
        res.send("900");
        return;
    }
        

    let targetChar=data.characters.find((c)=>Number(c.id)===charID);
    
    //如果找不到該腳色 則回傳
    if(targetChar===undefined)
        res.send('800');
    else if(targetChar.relics===undefined)
        res.send('801');
    else{
        //如果找不到指定遺器 也回傳
        //let targetRelic=taregtChar.relics.find((r)=>r.type===Number(partsIndex));
        let targetRelic=targetChar.relics;
        if(targetRelic===undefined)//如果該腳色沒有任何遺器
            res.send('801');
        else{
            targetRelic = targetRelic.filter((r)=>r.rarity ===5 && r.level ===15);
            if(targetRelic.length === 0){
                res.send("804")
            }else{
                res.send(targetRelic);
            }
            
        }
    }
});


app.post("/artifact/get",cors(corsOptions),async(req,res)=>{
    
    const origin = req.headers.origin;
    const allowedOrigins = ['https://angegod.github.io', 'http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let senddata = req.body;
    let userId=senddata.uid;
    let charID=senddata.charID;

    if (!/^\d+$/.test(userId)) { // 僅允許數字
        return res.status(400).send({ error: "Invalid user ID" });
    }

    let data;
    try {
        //提供標頭 避免被判定成bot
        const request = await fetch(`https://enka.network/api/uid/${userId}`,{
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            }
        });
        data = await request.json();
    } catch (err) {
        console.error("Fetch failed:", err);
        return res.status(500).send("Fetch Error");
    }

    //如果該UID沒有任何資訊
    if(data.playerInfo===undefined){
        res.send("900");
        return;
    }

    //找不到腳色
    if(!data.avatarInfoList)
        res.send('800');

    let targetChar=data.avatarInfoList.find((c)=>Number(c.avatarId)===Number(charID));
    //如果找不到該腳色 則回傳
    if(targetChar===undefined)
        res.send('800');
    else if(targetChar.equipList===undefined)
        res.send('801');
    else{
        //如果找不到指定遺器 也回傳
        let targetRelic=targetChar.equipList;
        //過濾掉武器
        targetRelic = targetRelic.filter((r)=>r.weapon === undefined);
        if(targetRelic===undefined)//如果該腳色沒有任何聖遺物
            res.send('801');
        else{
            targetRelic = targetRelic.filter((r)=>r.flat.rankLevel === 5 && r.reliquary.level === 21);
            if(targetRelic.length === 0){
                res.send("804")
            }else{
                res.send(targetRelic);
            }
            
        }
    }
});


app.listen(5000, () => {
    console.log(`Server is running on port 5000.`);
});