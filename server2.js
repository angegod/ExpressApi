const express = require("express");
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path');
const cors=require('cors');
const fs=require('fs');
const axios=require('axios');
const { resolve } = require("path");
const funcData = require("./card/funcData.js");

const app=express();

app.use(bodyParser.urlencoded({ extended: true })); //Handles normal post requests
app.use(bodyParser.json()); //Handles JSON requests
app.use(cors());

//添加卡牌
app.post('/card/save',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    const data = req.body;
 
    /*{
        series:系列ID
        card:
        ......
    } */

    if(data.card===undefined){
        res.send("資料不可為空");
        return;
    }

    var targetfile=`./card/Card.js`;
    //var targetfile=`./card/card.json`;

    if (!fs.existsSync(targetfile)) {
        res.send([]);//發生錯誤
    }else{
        var existdata = fs.readFileSync(targetfile);
        let result=existdata.find((seriesData)=>seriesData.seriesId===data.seriesId).card;
        
        if(result===undefined){
            res.send("No Data Found!");
            return;
        }
        result.push(data.card)  
        const sorted=result.sort((a,b)=>{return a.id-b.id});
        existdata[seriesId].card=sorted;
        console.log(existdata);

        const newData=JSON.stringify(existdata);

        fs.writeFileSync(targetfile,newData,()=>{
            console.log("New data added");
        });

        res.send("OK");

    }
});

//功能標籤添加
app.post('/func/add',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    const data = req.body;
    console.log(data);
    /*
        typeId:類別ID,
        insertPos:插入位置 如果undefined則改為push
        func:要插入的功能
    */

    let p1=()=>{
        return new Promise((resolve,reject)=>{
            var targetfile=`./card/func.json`;
            var targetfile2=`./card/Card.json`;

            if (!fs.existsSync(targetfile)) {
                res.send([]);//發生錯誤
            }else{
                var existdata = JSON.parse(fs.readFileSync(targetfile));
                var Card=JSON.parse(fs.readFileSync(targetfile2));
                let result=existdata.find((t)=>t.typeId===data.typeId).data;
                
                if(result===undefined){//如果該類別沒有資料 則不執行
                    res.send("No Data Found!");
                    return;
                }
                if(data.insertPos===undefined)
                    result.push(data.func)
                else{
                    result.splice(14,0,data.func);
                }
                existdata[existdata.findIndex((d)=>d.typeId===data.typeId)].data=result;

                const modifyNum=modifyFunc(existdata);
                const newCard=JSON.stringify(modifyCard(modifyNum,Card));

                //existdata[existdata.findIndex((d)=>d.typeId===data.typeId)].data=result;
                console.log(existdata);

                const newData=`let Card = ${existdata} ;module.exports = Card;`;
                console.log(newCard);
                console.log(newData);
                fs.writeFileSync(targetfile,newData,()=>{
                    console.log("New data added");
                    
                });

                fs.writeFileSync(targetfile2,newCard,()=>{
                    
                });

                resolve("Ok");
                //調整技能標籤
            }
        })
    }

    p1().then((msg)=>{
       res.send(msg);
    });
});

//獲取目前所有卡片跟技能
app.post('/card/get',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    const getSeriesId = req.body.get;
    
    try{

        delete require.cache[require.resolve('./card/Card.js')];
        delete require.cache[require.resolve('./card/funcData.js')];
        let existdata = require('./card/Card.js');
        let existdata2= require('./card/funcData.js');
        let result=existdata.find((t)=>t.seriesId===getSeriesId).card;
        //只回傳指定系列的卡片
        res.send({card:result,func:existdata2});     
        
    }catch{
        res.send("發生錯誤");
    }

})

//目前統一用這個方法
app.post('/card/edit',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    const getSeriesId = req.body.getId;
    let targetfile='./card/Card.js'

    let existdata = require(targetfile);
    console.log(req.body);
    existdata.find((t)=>t.seriesId===getSeriesId).card=req.body.newData;
    
    //existdata[existdata.findIndex((d)=>d.typeId===data.typeId)].data=result;
    console.log(existdata);

    const newData=`let Card = ${JSON.stringify(existdata, null, 2)} ;\nmodule.exports = Card;`;

    fs.writeFileSync(targetfile,newData,()=>{
        console.log("New data added");
        
    });       
    console.log('New Data added');
    res.send('資料已儲存!!');
    

});

app.post('/func/get',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    
    
    try{
        delete require.cache[require.resolve('./card/funcData.js')];
        let func=require('./card/funcData.js');
        
        //回傳目前技能標籤
        res.send({func:func});     
        
    }catch{
        res.send("發生錯誤");
    }


})

app.post('/func/save',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    let newFunc = req.body.func;
    let targetfile='./card/funcData.js';
    let targetfile2='./card/Card.js';
    let card=require(targetfile2);

    //抓舊資料

    //先針對新資料作序位排定 並儲存更動
    let modifyNum=modifyFunc(newFunc);

    //再依據更動來變更現有卡片資訊
    let newCard=JSON.stringify(modifyCard(modifyNum,card), null, 2);
    newFunc=JSON.stringify(newFunc, null, 2);

    newFunc=`let funcData = ${newFunc} ;\nmodule.exports = funcData;`;
    newCard=`let Card = ${newCard} ;\nmodule.exports = Card;`;
    
    let result={};

    await fs.writeFile(targetfile,newFunc,'utf-8',()=>{
        console.log("New data added");
        
    }); 

    await fs.writeFile(targetfile2,newCard,'utf-8',()=>{
        console.log("New card added");

        delete require.cache[require.resolve(targetfile)];
        delete require.cache[require.resolve(targetfile2)];
        result={
            msg:'Ok',
            card:require(targetfile2),
            func:require(targetfile)
        }
        console.log(result);
        res.send(result);
    });
});


app.post('/card/add',async(req,res)=>{
    console.log('卡片增加開始!!');
    res.header("Access-Control-Allow-Origin", "*");
    let targetSeries=req.body.series;
    let newCard = req.body.card;
   
    let targetfile='./card/Card.js';
    let card=require(targetfile);
    
    //將新增卡片加入
    let t=card.find((s)=>s.seriesId===targetSeries).card;
    t.push(newCard);
    card.find((s)=>s.seriesId===targetSeries).card=t;

    //console.log(card);
    
    const newData=`let Card = ${JSON.stringify(card, null, 2)} ;\nmodule.exports = Card;`;

    fs.writeFileSync(targetfile,newData,()=>{
        console.log("New data added");
    });  

    res.send({message:'New Card Saved',card:card});
})

// 配置 multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const absolutePath='C:/xampp/htdocs/vue/vuepage/public/images/card/icon';
        
        cb(null, absolutePath); // 设置文件存储的目录
    },
    filename: function (req, file, cb) {
        const customFileName = file.originalname.split('.')[0]; 
        const baseDir = path.join('C:/xampp/htdocs/vue/vuepage/public/images/card/icon');
        const finalPath = path.join(baseDir, customFileName + '.png');
        const normalizedPath = path.normalize(finalPath);

        // 驗證 finalPath 是否在 baseDir 中
        if (!normalizedPath.startsWith(baseDir)) {
            throw new Error('Invalid file path');
        }else{
            console.log('File save:'+finalPath);
            cb(null, customFileName + '.png'); // 最终文件名 = 自定义名 + 扩展名
        }



        
       
       
    }
  });
  
const upload = multer({ storage:storage });
  
//上傳縮圖  
app.post('/card/icon',async(req, res,next) => {
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
        const absolutePath='C:/xampp/htdocs/vue/vuepage/public/images/card/icon'
        const oldPath = absolutePath +'/'+oldName;
        const newPath = absolutePath +'/'+newName;
  
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



  const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        const absolutePath='C:/xampp/htdocs/vue/vuepage/public/images/card/image';
        
        cb(null, absolutePath); // 设置文件存储的目录
    },
    filename: function (req, file, cb) {
        const customFileName = file.originalname.split('.')[0]; 
        const baseDir = path.join('C:/xampp/htdocs/vue/vuepage/public/images/card/image');
        const finalPath = path.join(baseDir, customFileName + '.png');
        const normalizedPath = path.normalize(finalPath);

        // 驗證 finalPath 是否在 baseDir 中
        if (!normalizedPath.startsWith(baseDir)) {
            throw new Error('Invalid file path');
        }else{
            console.log('File save:'+finalPath);
            cb(null, customFileName + '.png'); // 最终文件名 = 自定义名 + 扩展名
        }
    }
  });
  
const upload2 = multer({ storage:storage2 });
  
//上傳縮圖  
app.post('/card/image',async(req, res,next) => {
    // 先保存自定义字段到临时变量
  
    let oldName='';
    let newName='';
    //tempFileName = req.body.jsondata;
    upload2.single('image')(req, res, function (err) {
        console.log('Form fields:', req.body.oldName);
        oldName=req.body.oldName+'.png';
        newName=req.body.newName+'.png';
  
        if (err) {
          return res.status(500).json({ message: 'Upload failed', error: err.message });
        }
        const absolutePath='C:/xampp/htdocs/vue/vuepage/public/images/card/image'
        const oldPath = absolutePath +'/'+oldName;
        const newPath = absolutePath +'/'+newName;
  
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

const storage3 = multer.diskStorage({
    destination: function (req, file, cb) {
        const absolutePath='C:/xampp/htdocs/vue/vuepage/public/images/card/spread';
        
        cb(null, absolutePath); // 设置文件存储的目录
    },
    filename: function (req, file, cb) {
        const customFileName = file.originalname.split('.')[0]; 
        const baseDir = path.join('C:/xampp/htdocs/vue/vuepage/public/images/card/spread');
        const finalPath = path.join(baseDir, customFileName + '.png');
        const normalizedPath = path.normalize(finalPath);

        // 驗證 finalPath 是否在 baseDir 中
        if (!normalizedPath.startsWith(baseDir)) {
            throw new Error('Invalid file path');
        }else{
            console.log('File save:'+finalPath);
            cb(null, customFileName + '.png'); // 最终文件名 = 自定义名 + 扩展名
        }
    }
  });
  
const upload3 = multer({ storage:storage3 });
  
//上傳盤面圖  
app.post('/card/spread',async(req, res,next) => {
    // 先保存自定义字段到临时变量
  
    let oldName='';
    let newName='';
    //tempFileName = req.body.jsondata;
    upload3.single('image')(req, res, function (err) {
        console.log('Form fields:', req.body.oldName);
        oldName=req.body.oldName+'.png';
        newName=req.body.newName+'.png';
  
        if (err) {
          return res.status(500).json({ message: 'Upload failed', error: err.message });
        }
        const absolutePath='C:/xampp/htdocs/vue/vuepage/public/images/card/spread'
        const oldPath = absolutePath +'/'+oldName;
        const newPath = absolutePath +'/'+newName;
  
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


//調整序位
function modifyFunc(funcData){

    let array = [];
    let count = 0;

    funcData.forEach((typeData)=>{
        typeData.data.forEach((d)=>{
            count++;
            if(d.id!==count){
                array.push([d.id,count]);
                d.id=count;
            }
        })
    });

    return array;
}

//調整卡片技能標籤 避免跑掉
function modifyCard(array,Card){
    Card.forEach(series => {
        series.card.forEach((c)=>{
            let modfiedNum=[];//避免二度修改
            array.forEach((m)=>{
                //如果卡片標籤有自更動過編號 且先前沒有更動紀錄
                if(c.tag.includes(m[0])&&!modfiedNum.includes(m[0])){
                    c.tag[c.tag.findIndex((t)=>t===m[0])]=m[1];
                    modfiedNum.push(m[1]);//告訴系統說這個數字已經更改過了
                }
            })
        })
    });

    return Card;
}

app.listen(5000, () => {
    console.log(`Server is running on port 5000.`);
});