const express = require("express");
const bodyParser = require("body-parser");
const cors=require('cors');

const app = express();

const corsOptions={
  origin:[
    'https://angegod.github.io/'
  ],
  methods:'GET,POST,PUT,DELETE',
  allowHeaders:['Access-Control-Allow-Origin','Content-Type'],
  optionsSuccessStatus: 200 
};

app.use(bodyParser.urlencoded({ extended: true })); //Handles normal post requests
app.use(bodyParser.json()); //Handles JSON requests
app.use(cors(corsOptions));



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

app.post("/relic/get",async(req,res)=>{
    const origin = req.headers.origin;
    const allowedOrigins = ['https://angegod.github.io', 'http://localhost:3000'];
    
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin); // 允許該來源
    }else {
        res.setHeader('Access-Control-Allow-Origin', ''); // 拒絕該來源
        return res.status(403).send({ error: "Forbidden" }); // 提前返回
    }
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

    //console.log(data);
    
    let taregtChar=data.characters.find((c)=>Number(c.id)===charID);
    //如果找不到該腳色 則回傳
    if(taregtChar===undefined)
        res.send('800');
    else if(taregtChar.relics===undefined)
        res.send('800');
    else{
        //如果找不到指定遺器 也回傳
        let targetRelic=taregtChar.relics.find((r)=>r.type===Number(partsIndex));
        if(targetRelic===undefined)
            res.send('801');
        else
            res.send(targetRelic);
    }

    

});

app.listen(5000, () => {
    console.log(`Server is running on port 5000.`);
});