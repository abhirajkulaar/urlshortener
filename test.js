const nodemailer = require("nodemailer");

async function ab(){
    let testAccount = await nodemailer.createTestAccount();

          // create reusable transporter object using the default SMTP transport
          let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "abhirajkulaar@gmail.com", // generated ethereal user
              pass: "ASKRules@782", // generated ethereal password
            },
          });

          let info = await transporter.sendMail({
            from: 'abhirajkulaar@gmail.com', // sender address
            to: "abhirajkulaar@gmail.com", // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world?</b>", // html body
          });
        
          console.log("Message sent: %s", info.messageId);

}

ab()