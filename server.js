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

const database=()=>{

    var sql=require('mssql');
    var config = {
      user: 'ange', // Database username
      password: 'ange0909', // Database password
      server: 'localhost\\SQLEXPRESS', // Server IP address
      database: 'Par', // Database name
      options: {
        trustServerCertificate: true
      }
    };

    const selectPar=(res,data)=>{
        var sqlresult=[];
        //console.log(data);
        sql.connect(config, err => {
          if (err) {
              throw new Error("資料庫連線失敗!!'請稍後再試");
          }

          var request=new sql.Request();
          
          const promise=new Promise((resolve,reject)=>{
            request.query(`select parId as id,accId as author,title,FORMAT(b.createDate, 'yyyy-MM-dd') as createDate from blog as b right join Account as a on b.author=a.id  
              where title like '%${data.keyword}%' or accId like '%${data.keyword}%';`,async (err,recordset)=>{
                if(err) console.log(err);

                sqlresult=recordset.recordset;
                resolve('Ok');

            });
          })
          promise.then((val)=>{
            //console.log(val);
            const result=sqlresult.filter((item,index)=>index>=data.pagecount*(data.pagenumber-1)&&index<data.pagecount*data.pagenumber);
            console.log(result);
            res.send({count:sqlresult.length,content:JSON.stringify(result)});
          })
          
          
        });
        
        
    };

    const login=(res,data)=>{
        sql.connect(config, err => {
            if (err) {
                throw new Error("資料庫連線失敗!!'請稍後再試");
            }
    
            var request=new sql.Request();
      
            
            request.query(`select accId,accName from Account where accId='${data.account}' and Pwd='${data.password}'`,(err,recordset)=>{
                if(err) console.log(err);
                
        
                res.send(recordset.recordset[0]);
      
            });
        });
    };

    const editPar=(res,data)=>{
        //編輯的部分對於資料庫而言 只牽涉編輯日期與標題的更動，一律覆寫
        sql.connect(config,err=>{
            if (err) {
              throw new Error("資料庫連線失敗!!'請稍後再試");
            }

            var request=new sql.Request();
            let p1=new Promise((resolve,rejects)=>{
                //文章實際ID先判定，在寫入
                request.query(`update blog set title = '${data.title}' ,modifyDate = '${data.createDate}' where parId=${data.id};`,(err,result)=>{
                  if(err) console.log(err);
          
                  resolve('datasaved');
                  
                });
            });

            p1.then((msg)=>{console.log(msg);res.send("Ok200")})

        })
        
    };

    const deletePar=(res,data)=>{
        //刪除文章:直接刪紀錄
        sql.connect(config,err=>{
              if (err) {
                return false;
              }

              var request=new sql.Request();
              let p1=new Promise((resolve,rejects)=>{
                  //文章實際ID先判定，在寫入
                  request.query(`delete from blog where parId=${data.id}`,(err,result)=>{
                    if(err) console.log(err);
            
                      resolve('data deleted!!');
                    
                  });
              });

              p1.then((msg)=>{console.log(msg);return true})
          
          
            
        });
        
    };

    const addPar=(res,data)=>{
        sql.connect(config, err => {
            if (err) {
                throw new Error("資料庫連線失敗!!'請稍後再試");
            }
            
            var request=new sql.Request();
            let p1=new Promise((resolve,rejects)=>{
                //文章實際ID先判定，在寫入
                request.query(`select id from Account where accId ='${data.author}'`,(err,result)=>{
                  if(err) console.log(err);
          
                  resolve(result.recordset[0].id);
                  
                });
            });

            //文章實際ID先判定，在寫入
            p1.then((authorId)=>{
              request.query(`insert into blog (parId,author,title,createDate) values('${data.id}','${authorId}','${data.title}','${data.createDate}');`,(err,recordset)=>{
                if(err) console.log(err);
        
                res.send('Data saved');
        
              });
            })
            

      
            
            
        });
    };

    return{selectPar,editPar,deletePar,addPar,login}


}

//app.use(express.json());


app.use(bodyParser.urlencoded({ extended: true })); //Handles normal post requests
app.use(bodyParser.json()); //Handles JSON requests
app.use(cors());


app.get("/",(req, res) => {
  res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:3000');/*允許來源 */
  res.send(jsonfile);/*如果來源符合則回傳資料 */
});

app.get("/get/:uid",async (req,res)=>{
  let userId=req.params.uid;

  
  res.setHeader('Access-Control-Allow-Origin',"https://angegod.github.io");//允許來源 
  const request = await fetch(`https://api.mihomo.me/sr_info_parsed/${userId}?lang=cht`);
  const data = await request.json();

  //console.log(data.player.uid);
  res.send(JSON.stringify(data));

});


//https://tos-card-api.pascaltheelf.workers.dev/?id=3001
app.get("/warp",(req,res)=>{
  let uid="904008225";
  let authkey='k6Rc9lHh%2fe4DZrR0j2ByjN2Me8iwxbluWcVUBSB%2f5jK8tD%2bUWCJwcXxNfgFd%2fJranh3S7B%2bOc7jv81cIUS33pfbducqK%2faNmI8x7343K32xakpoWE%2fE%2bRQ9UcsSh50CJ1WpFpKuqza1oVbY4lXBr5v9eRvEXnR9qQEx45QQrY9IEB4qpomBtIFjulaO9cUYg%2bBEX5Jfzgzpcu%2f0jDsGINkw2wQ7cqd17A1VYudA5BwJNvWh%2fBw790sSfDRehp%2ft2iJLQh8zqm0Mm3RDTv%2fZZsygsc55CVgwms3%2bMAlOARXuSq9U5R%2bH2vuPYxM0Xw4OcF9VCxP0JMHcdREm92X9Jzi%2fPWtz1XUs6xFjw9%2fnTl96a%2fdBFel4mEOADoQm%2fR%2b1ZX0t4QcUJU0Gqfpy1nk6%2b%2bDdSDFvpYf8PHrwFFEcHM2uDJVUSMIMtOwSf5uj7eMFtF3kAULRAjCp0HzaxpQrAfx9%2b%2fgICJO9S4HxuLpa%2f%2fSs%2fP8IJVXfoIAqah9xQy5X5MeWf%2fJhsOGGqnYVtDJLMHwcVBQhCtlYAxMbhoQMgLkU%2ft0GOw0PcPJaYOttNXbeV2zX6oqWpge60rckK7UuKhNP6k81vwnkZZAbaeV2wQE%2f%2fyG5%2f4f7mHN4s3wkGb1LHsGNklwAYpJDNI84XnsQjBdoh40Qe57bYbGsV4D8jqDM%3d';
  let url=`https://api-takumi.mihoyo.com/event/gacha_info/api/getGachaLog?uid=${uid}&authkey=${authkey}&gacha_type=301&page=1&size=20&lang=zh-cn`;

  axios.get(url).then((response)=>{
    console.log(response.data);
    res.send(response.data);
  });

  

});


//新增文章用
app.post("/par/add",(req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    //res.setHeader('Content-Type','application/json');
    let data = req.body;
   
    
    var targetfile=`./json/${data.author}_par.json`;

    if (!fs.existsSync(targetfile)) {
      const initData={
        nextId:2,
        content:[data],
          
      };
      fs.writeFile(targetfile,JSON.stringify(initData) , function (err) {
        if (err) throw err;
          console.log('Saved!');
      });
      //res.send("Data saved");
      
    }else{
        var existdata = fs.readFileSync(targetfile);
        var myObject= JSON.parse(existdata);
        //console.log(myObject);
        data.id=myObject.nextId;
        myObject.content.push(data);
        myObject.nextId+=1;

        var newdata= JSON.stringify(myObject);
        fs.writeFileSync(targetfile,newdata,()=>{
          console.log("New data added");
        });
        
        //res.send("Data saved");
    } 
    
    database().addPar(res,data);

});

//獲得指定作者之文章
app.post("/par/get",(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    const data = req.body;
    /*
    {
      author:作者
      pagecount:一頁顯示幾筆資料
      pagenumber:顯示頁數
    }
    */

    database().selectPar(res,data);
    /*var targetfile=`./json/${data.author}_par.json`;

    if (!fs.existsSync(targetfile)) {
      res.send([]);//目前沒有該作者的相關文章
    }else{
      var existdata = fs.readFileSync(targetfile);


      const result=JSON.parse(existdata).content.filter((item,index)=>index>=data.pagecount*(data.pagenumber-1)&&index<data.pagecount*data.pagenumber);
      res.send({count:JSON.parse(existdata).nextId,content:JSON.stringify(result)});
    }*/


})

app.post('/par/search',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  const data = req.body;
 
  /*{
    id:文章之Id,
    author:留言作者,
    commentNum:留言數量，這樣避免流量使用過多//預設留言數量為3，但還是可以視情況做調整
  } */

    var targetfile=`./json/${data.author}_par.json`;

    if (!fs.existsSync(targetfile)) {
      res.send([]);//目前沒有該作者的相關文章
    }else{
      var existdata = fs.readFileSync(targetfile);
      let result=JSON.parse(existdata).content.find((item,index)=>item.id===data.id);
      
      if(result===undefined){
        res.send("No Data Found!");
        return;
      }
          
  
      if(result.comment.length!==0)
        result.comment=result.comment.filter((c,index)=>(index+1)<=data.commentNum);
      res.send(JSON.stringify(result));
    }
   
  
});

//針對指定文章新增留言
app.post('/par/pushComment',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  const data = req.body;

  /*{
    id:文章之Id,
    author:留言作者,
    comment:留言內容,
    createDate:留言日期,
    commentNum:回傳留言數量
  } */
  var targetfile=`./json/${data.parAuthor}_par.json`;


  if (!fs.existsSync(targetfile)) {
    res.send([]);//目前沒有該作者的相關文章
  }else{
    var existdata = fs.readFileSync(targetfile);
    var oldData=JSON.parse(existdata);
    
    const targetPar=oldData.content.filter((par)=>par.id===data.id);
    //console.log(targetPar);
    const newComment={
      id:targetPar[0].nextCommentId,
      author:data.author,
      comment:data.comment,
      createDate:data.createDate
    };

    targetPar[0].nextCommentId+=1;
    targetPar[0].comment.push(newComment);

    var newdata= JSON.stringify(oldData);
    fs.writeFileSync(targetfile,newdata,()=>{
      console.log("New Comment added");
    });
    targetPar[0].comment=targetPar[0].comment.filter((c,index)=>(index+1)<=data.commentNum);

    res.send(JSON.stringify(targetPar[0].comment));
  }

});


app.post('/par/getComment',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  const data = req.body;

  /*{
    id:文章之Id,
    author:文章之作者
    commentNum:所顯示之留言數量(從新到舊)
  } */
  var targetfile=`./json/${data.author}_par.json`;

  if (!fs.existsSync(targetfile)) {
    res.send([]);//目前沒有該作者的相關文章
  }else{
    var existdata = fs.readFileSync(targetfile);
    const targetPar=JSON.parse(existdata).content.filter((item,index)=>item.id===data.id);
    //console.log(targetPar[0].comment);
    const returnCommentArr=targetPar[0].comment.filter((comment,index)=>(index+1)<=data.commentNum);
    const isAllGet=(returnCommentArr.length===targetPar[0].comment.length)?true:false;
    res.send({comment:returnCommentArr,isAllGet:isAllGet});
  }

});

app.post('/par/delete',(req,res)=>{
    res.header("Access-Control-Allow-Origin", "*");
    const data = req.body;

    //檢查操作是否順利
    const operate=database().deletePar(res,data);

    if(operate){
        /*{
          id:文章ID
          author:作者
        }*/

        var targetfile=`./json/${data.author}_par.json`;

    
        if (!fs.existsSync(targetfile)) {
        
            res.send("Fail");//目前沒有該作者的相關文章
        }else{
            var existdata = fs.readFileSync(targetfile);
            var object=JSON.parse(existdata);
            
            
            object.content=object.content.filter((item,index)=>data.id!==item.id);
            
            var newdata=JSON.stringify(object);
            fs.writeFileSync(targetfile,newdata,()=>{
                
            
            });
        }

    }else{
      console.log("資料庫服務發生問題，請稍後再試");
      res.send("資料庫服務發生問題 請稍後再試");
    }

  

});

app.post('/par/deleteComment',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  const data = req.body;

  /*{
    id:留言之Id,
  } */
  var targetfile=`./json/${data.parAuthor}_par.json`;

  if (!fs.existsSync(targetfile)) {
    res.send([]);//目前沒有該作者的相關文章
  }else{
    var existdata = fs.readFileSync(targetfile);

    var myObject=JSON.parse(existdata);
    const targetPar=myObject.content.filter((item,index)=>item.id===data.parId);
    //console.log(targetPar[0]);
    targetPar[0].comment=targetPar[0].comment.filter((item,index)=>item.id!==data.id);

    var newdata=JSON.stringify(myObject);

    fs.writeFileSync(targetfile,newdata,()=>{
      //console.log("ParDeleted");
     
    });

    res.send("Ok200");


  }
})

//編輯文章
app.post('/par/Edit',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  const data = req.body;
  var targetfile=`./json/${data.author}_par.json`;

  /* 
    {
      id:文章ID 
      author:文章之作者
      createDate:文章之日期 
      title:編輯後的文章標題
      content:編輯後文章之內容
    }
  */
  if (!fs.existsSync(targetfile)) {
    res.send([]);//目前沒有該作者的相關文章
  }else{
    var existdata = fs.readFileSync(targetfile);
    var object=JSON.parse(existdata);
    
    //先找尋該文章之資料索引
    var Index=object.content.findIndex((item,index)=>data.id===item.id);

    //利用索引更改文章內容與標題
    //將更新後的文章內容與標題替換掉
    console.log(object.content[Index]);
    object.content[Index].content=data.content;
    object.content[Index].title=data.title;

    //接著在儲存
    var newdata=JSON.stringify(object);

    fs.writeFileSync(targetfile,newdata,()=>{
        console.log("ParEditted");
       
    });

    database().editPar(res,data);
    
  }

})

//測試資料庫連線

app.post('/sql/login',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  const data = req.body;

  database().login(res,data);

});


app.listen(5000, () => {
  console.log(`Server is running on port 5000.`);
});