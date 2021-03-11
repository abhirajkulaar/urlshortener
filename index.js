const express = require('express')
const bodyParser = require('body-parser')
const jwt = require("jsonwebtoken");
const fs = require('fs');
const bcrypt = require('bcrypt');
var cookieParser = require('cookie-parser')
const nodemailer = require("nodemailer");
var randomize = require('randomatic');
var cors = require('cors')
const sendmail = require('sendmail')();
const saltRounds = 10;
const app = express();
var MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
const aws = require('aws-sdk');
const { runInNewContext } = require('vm');
dotenv.config();
const {ObjectId} = require('mongodb')

var url = "mongodb+srv://ask:ask@cluster0.8ugoa.mongodb.net/invoiceGenerator?retryWrites=true&w=majority"
const jwtKey="testkey"






app.use('/build', express.static('build'))
.use(bodyParser.json())
app.use(cors({
  origin: true,
  credentials: true
}))
.use(cookieParser())
.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  })






.post('/login',(req,res)=>
{

    console.log(req.cookies)



    MongoClient.connect(url, function(err, db) {
      if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("rajasthan");
        dbo.collection("loginData").find({usermail:req.body.usermail}).toArray(
            (err,result)=>{
                if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
                db.close();
                if(result.length==0){{res.status(400).json({status:"fail",reason:"User does not exist pls register"});return;}}
                if(!result[0].active){{res.status(400).json({status:"fail",reason:"Please confirm your e-mail from inbox!"});return;}}
                bcrypt.compare(req.body.password, result[0].password, function(err, resultEnc) {
                    // Store hash in your password DB.
                    if(err){res.status(400).json({status:"fail",reason:"Unable to verify password!"});return;}
                    if(req.body.password!= result[0].password){res.status(400).json({status:"fail",reason:"Incorrect Password!"});return;}

                    jwt.sign({ usermail: req.body.usermail,userType:result[0].userType}, jwtKey, function(err, token) {
                        if(err){res.status(400).json({status:"fail",reason:"Unable to generate jwt token"});throw err;return;}
                        console.log(token);
                        res.cookie('jwt',token, { httpOnly: false, secure: false, maxAge: 136000,sameSite: "Lax" }).json({status:"success",userType:result[0].userType});
                        return;
                      });


                   

                   
                });

                
            }
        )
       
  
      });
 




})




.get("/logout",(req,res)=>{
  res.clearCookie('jwt');
  res.redirect('/login');
  return;
})


.use((req,res,next)=>{
  if(!req.cookies.jwt){next();return;}

  
  jwt.verify(req.cookies.jwt, jwtKey, function(err, decoded) {
    if(err||!decoded){next();}
    else{
    console.log(decoded)
    req.usermail=decoded.usermail;
    req.userType=decoded.userType;
    if(!req.usermail){{res.status(400).json({status:"fail",reason:"Unautorized!"});return;}}
    next();}
  })



})
.get("/userDetails",(req,res)=>{
  if(!req.usermail){{res.status(400).json({status:"fail",reason:"Unautorized!"});return;}}

  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("urlData").find({usermail:req.usermail}).toArray(
          (err,result)=>{
            db.close();
              if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
              //if(result.length==0){{res.status(400).json({status:"fail",reason:"User does not exist pls register"});return;}}
             
              res.json({usermail:req.usermail,data:result,domain:req.headers.host})
              return;
              
          }
      )
     

    });


})


.post("/createTicket",(req,res)=>{


  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("tickets").insertOne({...req.body,status:"Pending"},(err,resp)=>{
        db.close();
        if(err){res.status(400).json({status:"error",reason:"Unable to insert into DB"});return;}
        res.status(200).json("Successfully inserted")
        return;
      })
  })


})

.get("/tickets",(req,res)=>{


  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("tickets").find().toArray((err,resp)=>{
        db.close();
        if(err){res.status(400).json({status:"error",reason:"Unable to insert into DB"});return;}
        res.status(200).json(resp)
        return;
      })
  })


})
.post('/triggerPayment',(req,res)=>{


  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("tickets").findOneAndUpdate({_id:ObjectId(req.body._id)},{$set:{status:"Performing Payment"}},(err,resp)=>{
        db.close();
        if(err){res.status(400).json({status:"error",reason:"Unable to insert into DB"});return;}
        res.status(200).json(resp)
        return;
      })
  })


})

.post('/removeTicket',(req,res)=>{


  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("tickets").deleteOne({_id:ObjectId(req.body._id)},{$set:{status:"Performing Payment"}},(err,resp)=>{
        db.close();
        if(err){res.status(400).json({status:"error",reason:"Unable to insert into DB"});return;}
        res.status(200).json(resp)
        return;
      })
  })


})

.get("/login",(req,res)=>{

  if(req.usermail){ res.redirect('/adminlanding');return;}

  res.sendFile(__dirname + '/build/index.html');
  return;
})



.get("/",(req,res)=>{

  if(req.usermail){ res.sendFile(__dirname + '/build/index.html');;return;}

  res.redirect('/login')
  return;
})
.get("/landingadmin",(req,res)=>{

  if(req.usermail){ res.sendFile(__dirname + '/build/index.html');;return;}

  res.redirect('/login');return;
})

.get("/forgotPass",(req,res)=>{
  if(req.usermail){ res.redirect("landing");return;}

  res.sendFile(__dirname + '/public/passReset.html');
  return;

})

.get("/stores",(req,res)=>{
  let filter={}

  if(req.userType=='manager'){filter={manager:req.body.usermail}}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("stores").find().toArray(
        (err,result)=>{
        res.status(200).json(result);return;
        })})
})


.get("/managerList",(req,res)=>{

  if(req.userType!='admin'){res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("loginData").find({userType:'manager'}).toArray(
        (err,result)=>{
        res.status(200).json(result);return;
        })})
})

.get("/employeeList",(req,res)=>{

  if(req.userType!='admin'){res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("loginData").find({userType:'employee'}).toArray(
        (err,result)=>{
        res.status(200).json(result);return;
        })})
})


.post('/store',(req,res)=>{
  if(req.userType!='admin'){res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("stores").insertOne({name:req.body.name,address:req.body.address,manager:null},
        (err,result)=>{
        res.status(200).json(result);return;
        })})
})

.post('/assignManager',(req,res)=>{
  if(req.userType!='admin'){
    res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
    var dbo = db.db("rajasthan");
    dbo.collection("loginData").updateOne({usermail:req.body.manager,userType:"manager"},{$set:{store:req.body.store}},(err,resp)=>
    {if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      if(res.length==0){res.status(400).json({status:"fail",reason:"Mentioned manager ID not found!"});return;}
      
      dbo.collection("stores").updateOne({name:req.body.store},{$set:{manager:req.body.manager}},
        (err,result)=>{
          if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        res.status(200).json(result);return;
    })

        })})
})



.post('/assignEmployee',(req,res)=>{
  if(req.userType!='admin'){
    res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
    var dbo = db.db("rajasthan");
    dbo.collection("loginData").updateOne({usermail:req.body.employee,userType:"employee"},{$set:{store:req.body.store}},(err,resp)=>
    {if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      if(res.length==0){res.status(400).json({status:"fail",reason:"Mentioned Employee ID not found!"});return;}
      
      dbo.collection("stores").updateOne({name:req.body.store},{$push:{employees:req.body.employee}},
        (err,result)=>{
          if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        res.status(200).json(result);return;
    })

        })})
})


.post('/removeManager',(req,res)=>{
  if(req.userType!='admin'){
    res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
    var dbo = db.db("rajasthan");
    dbo.collection("loginData").updateOne({usermail:req.body.manager,userType:"manager"},{$set:{store:null}},(err,resp)=>
    {if(err){res.status(400).json({status:"fail",reason:"Mentioned manager ID not found or Unable to connect to DB!"});return;}
      if(res.length==0){res.status(400).json({status:"fail",reason:"Mentioned manager ID not found!"});return;}
      
      dbo.collection("stores").updateOne({name:req.body.store},{$set:{manager:null}},
        (err,result)=>{
          if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        res.status(200).json(result);return;
    })

        })})
})


.post('/removeEmployee',(req,res)=>{
  if(req.userType!='admin'){
    res.status(400).json({status:"fail",reason:"Unautorized!"});return;}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
    var dbo = db.db("rajasthan");
    dbo.collection("loginData").updateOne({usermail:req.body.employee,userType:"employee"},{$set:{store:null}},(err,resp)=>
    {if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      if(res.length==0){res.status(400).json({status:"fail",reason:"Mentioned Employee ID not found!"});return;}
      
      dbo.collection("stores").updateOne({name:req.body.store},{$pull:{employees:req.body.employee}},
        (err,result)=>{
          if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        res.status(200).json(result);return;
    })

        })})
})



.post("/forgotPasswordRequest", (req,res)=>{

  if(!req.body.usermail){{res.status(400).json({status:"fail",reason:"Unautorized!"});return;}}
  else{

    MongoClient.connect(url, function(err, db) {
      if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("rajasthan");
        dbo.collection("loginData").find({usermail:req.body.usermail}).toArray(async (err,result)=>{
          if(err){{res.status(400).json({status:"fail",reason:"Unable to query DB"});return;}}
          if(result.length==0){{res.status(400).json({status:"fail",reason:"User not found"});return;}}
          const resetCode=randomize('0', 6);
       

          // create reusable transporter object using the default SMTP transport
          let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "abhirajkulaar@gmail.com", // generated ethereal user
              pass: gmailPass, // generated ethereal password
            },
          });

          let info = await transporter.sendMail({
            from: 'abhirajkulaar@gmail.com', // sender address
            to: req.body.usermail, // list of receivers
            subject: "Password Reset Code", // Subject line
            text: "Your Password Reset Code is: "+ resetCode, // plain text body
           // html: "<b>Hello world?</b>", // html body
          });
          
          const expAt =new Date() 
          expAt.setHours(expAt.getHours()+1)
          dbo.collection("loginData").updateOne({usermail:req.body.usermail}, {$set:{resetCode:resetCode,expAt:expAt}}, function(err, result) {
            if(err){res.status(400).json({status:"fail",reason:"Unable to update code to DB"});return;}
            res.json({status:"success"})
            return;
          })
          

        })
    }


)}})


.post("/forgotPasswordReset", (req,res)=>{

  if(!req.body.usermail||!req.body.resetCode){{res.status(400).json({status:"fail",reason:"Unautorized!"});return;}}
  else{

    MongoClient.connect(url, function(err, db) {
      if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("rajasthan");
        dbo.collection("loginData").find({usermail:req.body.usermail}).toArray(async (err,result)=>{
          if(err){{res.status(400).json({status:"fail",reason:"Unable to query DB"});return;}}
          if(result.length==0||!result[0].resetCode){{res.status(400).json({status:"fail",reason:"User not found/No reset code sent"});return;}}
          if(result[0].resetCode!=req.body.resetCode){{res.status(400).json({status:"fail",reason:"Wrong reset code!"});return;}}
          let nowDate=new Date()
          let expDate= new Date(result[0].expAt)
          if(nowDate.getTime()>expDate.getTime()){{res.status(400).json({status:"fail",reason:"Code expired! Please generate again"});return;}}
       

          // create reusable transporter object using the default SMTP transport
          bcrypt.hash(req.body.password, saltRounds, function(err, hash)
          {
          
          dbo.collection("loginData").updateOne({usermail:req.body.usermail}, {$set:{password:hash}}, function(err, result) {
            if(err){res.status(400).json({status:"fail",reason:"Unable to update password to DB"});return;}
            res.json({status:"success"})
            return;

          })
          
        })
        })
    }


)}})

.post("/addNewURL",(req,res)=>{

  if(!req.usermail){res.json({status:"fail",reason:"Unauthorized!"});return;}

  if(req.body.shortURL.substr(0,11)=='verifyMail/'||req.body.shortURL=="login"||req.body.shortURL=="logout"||req.body.shortURL=="landing"||req.body.shortURL=="register"||req.body.shortURL=="passReset")
  {{res.status(400).json({status:"fail",reason:"ShortURL already taken up!"});return;}}
  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("loginData").find({usermail:req.usermail}).toArray( (err,result)=>{

        if(err){{res.status(400).json({status:"fail",reason:"Unable to query DB"});return;}}
        if(result.length==0){{res.status(400).json({status:"fail",reason:"User not found/No reset code sent"});return;}}

        
        dbo.collection("urlData").find({shortURL:req.body.shortURL}).toArray(

          (err,result)=>{
            if(err){{res.status(400).json({status:"fail",reason:"Unable to query DB"});return;}}
        if(result.length!=0){{res.status(400).json({status:"fail",reason:"ShortURL already taken up!"});return;}}

        dbo.collection("urlData").insertOne({usermail:req.usermail,shortURL:req.body.shortURL,longURL:req.body.longURL,hits:0},(err,result)=>{
          if(err){{res.status(400).json({status:"fail",reason:"Unable to update DB"});return;}}

          
res.json({status:"success"})
return;


        })



          }

         )





      })})



})

.get('/sign-s3', (req, res) => {
  aws.config.region = 'us-east-2';
  const s3 = new aws.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
   
});
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
})
.post('/fileUploadComplete',(req,res)=>{

  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("filesList").insertOne({usermail:req.usermail,fileName:req.body.fileName,downloads:0},(err,result)=>{
        if(err){{res.status(400).json({status:"fail",reason:"Unable to update DB"});return;}}

        
res.json({status:"success"})

  })

})})

.use((req,res)=>{

  


  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("rajasthan");
      dbo.collection("urlData").find({shortURL:req.originalUrl.substr(1)}).toArray( (err,result)=>{
        if(err){{res.status(400).json({status:"fail",reason:"Unable to query DB"});return;}}

        if(result.length==0){{res.status(400).json({status:"fail",reason:"URL not found!"});return;}}

        res.redirect(result[0].longURL)

        dbo.collection("urlData").updateOne({shortURL:req.originalUrl.substr(1)},{$inc:{hits:1}},()=>{})
      })})

  
})

app.listen(process.env.PORT || 5000)