const express = require("express");
const bodyParser = require("body-parser");
const cors=require('cors');
const fs=require('fs');
const axios=require('axios');
const multer = require('multer');
const path = require('path');

const app=express();

app.use(bodyParser.urlencoded({ extended: true })); //Handles normal post requests
app.use(bodyParser.json()); //Handles JSON requests
app.use(cors());

let tempFileName='';

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'image/'); // 设置文件存储的目录
  },
  filename: function (req, file, cb) {
    //console.log(file.originalname);
    const customFileName = file.originalname.split('.')[0]; 
    const fileExtension = path.extname(file.originalname); // 获取上传文件的扩展名
    cb(null, customFileName + '.png'); // 最终文件名 = 自定义名 + 扩展名
  }
});

const upload = multer({ storage });


app.post('/upload',async(req, res,next) => {
  // 先保存自定义字段到临时变量

  let oldName='';
  let newName='';
  //tempFileName = req.body.jsondata;
  upload.single('image')(req, res, function (err) {
      console.log('Form fields:', req.body.oldName);
      oldName=req.body.oldName+'.png';
      newName=req.body.newName+'.png';

      if (err) {
        return res.status(500).json({ message: 'Upload failed', error: err.message });
      }

      const oldPath = path.join(__dirname, 'image/', oldName);
      const newPath = path.join(__dirname, 'image/', newName);

      //用fs修改檔名 抓取舊檔名跟新檔名
      fs.rename(oldPath,newPath,(err)=>{
          if (err) {
            console.error('Error renaming file:', err);
            return res.status(500).json({ message: 'Failed to rename file' });
          }
          res.json({
            message: 'File uploaded successfully'
          });
      })
  });
  
});

app.get('/func/test',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    //const data = req.body;

    const jsonData = [
        {
          id: 1,
          name: "無視拼圖盾"
        },
        {
          id: 2,
          name: "無視固定連擊盾"
        }
      ];
      
      // 將 JSON 數組轉換為 JavaScript 格式，並生成為一個數組形式的文件
      const jsContent = `const data = ${JSON.stringify(jsonData, null, 2)};`;
      
      // 將生成的內容寫入一個 .js 文件
      fs.writeFileSync('./card/data.js', jsContent,'utf-8');
      
      console.log('JS 文件已成功生成');
      res.send('Js文件已生成');

});

app.get('/get/ball',async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');/*允許來源 */
  const request = await fetch(`https://www.rebas.tw/api/seasons/CPBL-2024-xa/leaders?type=team&section=standard&pa=undefined`);
  const data = await request.json();

  res.send(JSON.stringify(data.data));
})

app.get('/get/stock',async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');/*允許來源 */
  axios.post(`https://www.esunbank.com/api/client/ExchangeRate/LastRateInfo?sc_lang=zh-TW`)
  .then((response)=>{
    const data = response.data

    res.send(JSON.stringify(data));
  });
  
})

app.listen(5000, () => {
  console.log(`Server is running on port 5000.`);
});