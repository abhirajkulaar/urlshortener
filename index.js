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
dotenv.config();


var url = process.env.url
const jwtKey=process.env.jwtKey
const gmailPass= process.env.gmailPass


app
app.use('/public', express.static('public'))
.use(bodyParser.json())
// app.use(cors({
//   origin: true,
//   credentials: true
// }))
.use(cookieParser())
.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  })



.post('/register', (req,res)=>
{

  if(typeof req.body.usermail !="string"||typeof req.body.firstName !="string"||typeof req.body.lastName !="string"||typeof req.body.password !="string")
    {res.status(400).json({status:"fail",reason:"request body invalid"});return;}



    MongoClient.connect(url, function(err, db) {
        if (err) {res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("urlShortener");
        dbo.collection("loginData").find({usermail:req.body.usermail}).toArray(
            (err,result)=>{
                if(err){db.close();res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
                if(result.length!=0){{db.close();res.status(400).json({status:"fail",reason:"E-Mail already registered pls login"});return;}}

                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                  if(err){db.close();res.status(400).json({status:"fail",reason:"Unable to encrypt password"});return;}

                    dbo.collection("loginData").insertOne({usermail:req.body.usermail,password:hash,firstName:req.body.firstName,lastName:req.body.lastName,active:false}, (err,result)=>{

                      console.log("inserted")
                      {if(err){db.close();res.status(400).json({status:"fail",reason:"Unable to register data with DB"});return;}}
                      db.close();
                      jwt.sign({ usermail: req.body.usermail}, jwtKey,async function(err, token) {
                        if(err){res.status(400).json({status:"fail",reason:"Unable to generate jwt token"});throw err;return;}
                        console.log(token);
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
                          subject: "URL Shortener - Activation link", // Subject line
                          text: "Pls Click here to active your account : "+req.headers.host+"/verifyMail/"+ token, // plain text body
                         // html: "<b>Hello world?</b>", // html body
                        });
  
                        res.json({status:"success"});return;
                      })
      
                    })
                   
                });

                
            }
        )
       
      
 



})})


.post('/login',(req,res)=>
{

    console.log(req.cookies)



    MongoClient.connect(url, function(err, db) {
      if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("urlShortener");
        dbo.collection("loginData").find({usermail:req.body.usermail}).toArray(
            (err,result)=>{
                if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
                if(result.length==0){{res.status(400).json({status:"fail",reason:"User does not exist pls register"});return;}}
                if(!result[0].active){{res.status(400).json({status:"fail",reason:"Please confirm your e-mail from inbox!"});return;}}
                bcrypt.compare(req.body.password, result[0].password, function(err, result) {
                    // Store hash in your password DB.
                    if(err){res.status(400).json({status:"fail",reason:"Unable to verify password!"});return;}
                    if(!result){res.status(400).json({status:"fail",reason:"Incorrect Password!"});return;}

                    jwt.sign({ usermail: req.body.usermail}, jwtKey, function(err, token) {
                        if(err){res.status(400).json({status:"fail",reason:"Unable to generate jwt token"});throw err;return;}
                        console.log(token);
                        res.cookie('jwt',token, { httpOnly: true, secure: true, maxAge: 136000,sameSite: "Lax" }).json({status:"success"});return;
                      });


                   

                   
                });

                
            }
        )
       
  
      });
 




})
.get('/verifyMail/:token',async (req,res)=>{


  
  jwt.verify(req.params.token, jwtKey, function(err, decoded) {
    if(err||!decoded){res.status(400).json({status:"fail",reason:"invalid token"});return}
    else{
    
    req.usermail=decoded.usermail;
    MongoClient.connect(url, function(err, db) {
      if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("urlShortener");
        console.log(decoded.usermail)
        dbo.collection("loginData").updateOne({usermail:decoded.usermail},{$set:{active:true}},(err,result)=>{

          if(err){res.status(400).json({status:"fail",reason:"Unable to set status in DB"});return}

          res.cookie('jwt',req.params.token, { httpOnly: true, secure: true, maxAge: 136000,sameSite: "Lax" }).redirect("/landing")
        })



    })
  }


})})



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
    next();}
  })



})
.get("/userDetails",(req,res)=>{
  if(!req.usermail){{res.status(400).json({status:"fail",reason:"Unautorized!"});return;}}

  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("urlShortener");
      dbo.collection("urlData").find({usermail:req.usermail}).toArray(
          (err,result)=>{
              if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
              //if(result.length==0){{res.status(400).json({status:"fail",reason:"User does not exist pls register"});return;}}
              res.json({usermail:req.usermail,data:result,domain:req.headers.host})
              return;
              
          }
      )
     

    });


})


.get("/login",(req,res)=>{

  if(req.usermail){ res.redirect('/landing');return;}

  res.sendFile(__dirname + '/public/index.html');
  return;
})

.get("/register",(req,res)=>{

  if(req.usermail){ res.redirect('/landing');return;}

  res.sendFile(__dirname + '/public/register.html');
  return;
})

.get("/",(req,res)=>{

  if(req.usermail){ res.sendFile(__dirname + '/public/landing.html');;return;}

  res.redirect('/login')
  return;
})
.get("/landing",(req,res)=>{

  if(req.usermail){ res.sendFile(__dirname + '/public/landing.html');;return;}

  res.redirect('/login');return;
})

.get("/forgotPass",(req,res)=>{
  if(req.usermail){ res.redirect("landing");return;}

  res.sendFile(__dirname + '/public/passReset.html');
  return;

})



.post("/forgotPasswordRequest", (req,res)=>{

  if(!req.body.usermail){{res.status(400).json({status:"fail",reason:"Unautorized!"});return;}}
  else{

    MongoClient.connect(url, function(err, db) {
      if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
        var dbo = db.db("urlShortener");
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
        var dbo = db.db("urlShortener");
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
      var dbo = db.db("urlShortener");
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

.use((req,res)=>{

  


  MongoClient.connect(url, function(err, db) {
    if(err){res.status(400).json({status:"fail",reason:"Unable to connect to DB"});return;}
      var dbo = db.db("urlShortener");
      dbo.collection("urlData").find({shortURL:req.originalUrl.substr(1)}).toArray( (err,result)=>{
        if(err){{res.status(400).json({status:"fail",reason:"Unable to query DB"});return;}}

        if(result.length==0){{res.status(400).json({status:"fail",reason:"URL not found!"});return;}}

        res.redirect(result[0].longURL)

        dbo.collection("urlData").updateOne({shortURL:req.originalUrl.substr(1)},{$inc:{hits:1}},()=>{})
      })})

  
})

app.listen(process.env.PORT || 5000)