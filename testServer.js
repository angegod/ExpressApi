const express = require("express");
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path');
const cors=require('cors');
const fs=require('fs');
const { type } = require("os");

const app=express();

app.use(bodyParser.urlencoded({ extended: true })); //Handles normal post requests
app.use(bodyParser.json()); //Handles JSON requests
app.use(cors());

const database=()=>{

    var sql=require('mssql');
    var config = {
        user: 'ange', // Database username
        password: 'ange0909', // Database password
        server: 'localhost\\SQLEXPRESS', // Server IP address
        database: 'Cards', // Database name
        options: {
            trustServerCertificate: true
        }
    };

    const pool = new sql.ConnectionPool(config);

    const selectCard=async (res,data)=>{
        var sqlresult=[];
        //console.log(data);
        const r = pool.request();

        await pool.connect();
        
        const promise=new Promise(async(resolve,reject)=>{
            //將系列ID填入需求之中
            r.input('seriesId',sql.Int ,data);
            
            await r.query(`select * from cards_info where seriesId=@seriesId order by id asc`,async (err,recordset)=>{
                if(err) console.log(err);
                sqlresult=recordset.recordset;
                resolve('Ok');

            });
        })
        promise.then((val)=>{
            sqlresult.forEach((s)=>{
                //將資料處理成統一格式
                s.tag=s.tag.split(',');
                s.tag=s.tag.map((num)=>num=parseInt(num));

                if(s.tag===null)
                    s.tag=[];
                
                if(s.spread===null)
                    s.spread=undefined;

                s.roundEffect=s.roundEffect.split(',');
                s.comboEffect=s.comboEffect.split(',');
                s.instantEffect=s.instantEffect.split(',');
                (s.keyword!==null)?(s.keyword=s.keyword.split(',')):(s.keyword=[]);
                
                (s.spread!==null)?s.spread={image:s.spread,index:s.spread_index}:s.spread=undefined;
                if(s.spread.index===null){
                    delete s.spread;
                }
                delete s.spread_index;
                delete s.seriesId;
                s.PointEnter=s.PointMax;
            });
            let func= require('./card/funcData.js');
            res.send({card:sqlresult,func:func});
        });
          
          
        
    };

    const addCard = async (data)=>{
        const Insertkeyword = (data.card.keyword!==null&&data.card.keyword!==undefined)
            ? data.card.keyword.join(',') 
            : null;
        
        

        const params = {
            seriesId: { type: sql.Int, value: data.series },
            id: { type: sql.Int, value: data.card.id },
            name: { type: sql.VarChar, value: data.card.name },
            rarity: { type: sql.Int, value: data.card.rarity },
            image: { type: sql.VarChar, value: data.card.image },
            tag: { type: sql.NVarChar, value: data.card.tag.join(',') },
            instantEffect: { type: sql.NVarChar, value: data.card.instantEffect.join(',') },
            comboEffect: { type: sql.NVarChar, value: data.card.comboEffect.join(',') },
            roundEffect: { type: sql.NVarChar, value: data.card.roundEffect.join(',') },
            PointMax: { type: sql.Int, value: data.card.PointMax },
            PointConsume: { type: sql.Int, value:data.card.PointConsume },
            PointGet: { type: sql.Int, value: data.card.PointGet },
            fullimage: { type: sql.VarChar, value: data.card.fullimage },
            keyword:{type:sql.NVarChar , value:Insertkeyword},
            spread:{type:sql.NVarChar,value:(data.card.spread===undefined)?null:data.card.spread.image},
            spread_index:{type:sql.Int,value:(data.card.spread===undefined)?null:data.card.spread.index}
        };
        
        const r = pool.request();

        await pool.connect();

        for (const [key, { type, value }] of Object.entries(params)) {
            r.input(key, type, value);
        }
        await r.query('insert into cards_info values(@seriesId,@id,@name,@rarity,@image,@tag,@instantEffect,@comboEffect,@roundEffect,@PointMax,@PointConsume,@PointGet,@fullimage,@spread,@spread_index,@keyword)');
    }

    const editCard = async(res,data,seriesIndex)=>{
        const r = pool.request();

        await pool.connect();

        //先刪除所有資料 但不是資料表本身
        await r.query('delete from cards_info');

        //接著再將所有資料加入 可以透過前面的addCard去加入
        data.forEach(async (d)=>{
            //將資料變形
            let send={
                series:seriesIndex,
                card:d
            }

            //console.log(d);
            await addCard(send);
    
        });

        res.send('資料已儲存!!');

    }

    const refreshCard = async(data)=>{
        const r = pool.request();

        await pool.connect();

        //先刪除所有資料 但不是資料表本身
        await r.query('delete from cards_info');

        //接著再將所有資料加入 可以透過前面的addCard去加入
        data.forEach((series)=>{
            series.card.forEach(async (c)=>{
                //將資料變形
                let send={
                    series:series.seriesId,
                    card:c
                }

                //console.log(d);
                await addCard(send);
            })
    
        });
    }

    //添加標籤
    const addSkill = (res,data)=>{
        data.forEach((d)=>{
            d.data.forEach(async(f)=>{
                const params = {
                    typeId:{ type: sql.Int, value: d.typeId },
                    id:{type:sql.Int,value:f.id},
                    name:{type:sql.VarChar,value:f.name}
                };

                const r = pool.request();

                await pool.connect();

                for (const [key, { type, value }] of Object.entries(params)) {
                    r.input(key, type, value);
                }

                await r.query('insert into func_info values(@typeId,@id,@name)');
            })
        });
        if(res!==null)
            res.send('OK The Data process complete!!');
    }

    const selectSkill=async(res)=>{
        let series=[];
        let result=[];
        let p1=new Promise(async(resolve,reject)=>{
            const r = pool.request();

            await pool.connect();
            

            await r.query(`select * from func_type;`,async (err,recordset)=>{
                if(err) console.log(err);
                series=recordset.recordset;
            });
                
            await r.query(`select * from func_info order by id asc`,async (err,recordset)=>{
                if(err) console.log(err);
                result=recordset.recordset;
                resolve('OK');
            });

            
        });

        p1.then((val)=>{
            //取得所有所需資料後變德
            series.forEach((s)=>{
                let targetSkills=result.filter((f)=>f.typeId===s.typeId);
                s.data=targetSkills;
            });
            //console.log(series);
            res.send({func:series});
        })

            
        
    }

    const editSkill = async(data)=>{
        //先刪掉所有資料 再加入一次
        const r = pool.request();
        await pool.connect();
        await r.query('delete from func_info');
        await addSkill(null,data);

    }

    return {selectCard,addCard,editCard,refreshCard,addSkill,selectSkill,editSkill}
}

// 配置 multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const absolutePath='C:/project/vue/vuepage/public/images/card/icon';
        
        cb(null, absolutePath); // 设置文件存储的目录
    },
    filename: function (req, file, cb) {
        const customFileName = file.originalname.split('.')[0]; 
        const baseDir = path.join('C:/project/htdocs/vue/vuepage/public/images/card/icon');
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
        const absolutePath='C:/project/vue/vuepage/public/images/card/icon'
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
        const absolutePath='C:/project/vue/vuepage/public/images/card/image';
        
        cb(null, absolutePath); // 设置文件存储的目录
    },
    filename: function (req, file, cb) {
        const customFileName = file.originalname.split('.')[0]; 
        const baseDir = path.join('C:/project/vue/vuepage/public/images/card/image');
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
        const absolutePath='C:/project/vue/vuepage/public/images/card/image'
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
        const absolutePath='C:/project/vue/vuepage/public/images/card/spread';
        
        cb(null, absolutePath); // 设置文件存储的目录
    },
    filename: function (req, file, cb) {
        const customFileName = file.originalname.split('.')[0]; 
        const baseDir = path.join('C:/project/vue/vuepage/public/images/card/spread');
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
        const absolutePath='C:/project/vue/vuepage/public/images/card/spread'
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


//獲得所有時光牌資訊 需指定系列
app.post('/card/get',async (req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    await database().selectCard(res,req.body.get);

});


//添加時光牌
app.post('/card/add',async(req,res)=>{
    let data=req.body;
    await database().addCard(data);

    res.send("OK");
});

app.post('/card/edit',async(req,res)=>{
    //res.header("Access-Control-Allow-Origin", "*");
    const getSeriesId = req.body.getId;
    let targetfile='./card/Card.js'

    
    let existdata = require(targetfile);
    existdata.find((t)=>t.seriesId===getSeriesId).card=req.body.newData;
    console.log(existdata);

    const newData=`let Card = ${JSON.stringify(existdata, null, 2)} ;\nmodule.exports = Card;`;

    fs.writeFileSync(targetfile,newData,()=>{
        console.log("New data added");
        
    });       
    console.log('New Data added');


    //接下來會將這些更動移動到資料表中，因為系統不知道實際更動了甚麼細節，所以會將所有資料全刪再全加回去
    await database().editCard(res,req.body.newData,getSeriesId);

    
})

app.get('/func/add',async(req,res)=>{
    let targetfile='./card/funcData.js'
    let existdata = require(targetfile);

    await database().addSkill(res,existdata);

});

app.post('/func/get',async(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    
    try{        
        await database().selectSkill(res);
        
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

    let insertFunc=`let funcData = ${newFunc} ;\nmodule.exports = funcData;`;
    let insertCard=`let Card = ${newCard} ;\nmodule.exports = Card;`;
    
    let result={};

    //將資料更新到資料庫
    await database().editSkill(JSON.parse(newFunc));

    await database().refreshCard(JSON.parse(newCard));

    await fs.writeFile(targetfile,insertFunc,'utf-8',()=>{
        console.log("New data added");
        
    }); 

    await fs.writeFile(targetfile2,insertCard,'utf-8',()=>{
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