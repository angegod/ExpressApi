const express = require("express");
const bodyParser = require("body-parser");
const jsonfile=require('./json/product1.json');
const cors=require('cors');
const fs=require('fs');
const axios=require('axios');

const app = express();

const corsOptions={
  origin:[
    'https://angegod.github.io/'
  ],
  methods:'GET,POST,PUT,DELETE',
  allowHeaders:['Access-Control-Allow-Origin','Content-Type'],
  optionsSuccessStatus: 200 
};


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

app.listen(5000, () => {
    console.log(`Server is running on port 5000.`);
});