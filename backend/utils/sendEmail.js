const nodemailer = require("nodemailer")

const sendEmail = async (subject, message, sent_to, sent_from, reply_to) => {
    // Create Email Transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        post: 587,
        auth: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,

        },
        tls:{
            rejectUnauthorized: false
        }
    })

    // Options for sending email
    const options = {
        from: sent_from,
        to: sent_to,
        replyTo: reply_to,
        subject: subject,
        html: message,
    }

    // Send Email
    transporter.sendMail(options, function(err, info){
        if(err){
            console.log(err);
        }else{
            console.log(info);
        }

    })
};



module.exports =sendEmail