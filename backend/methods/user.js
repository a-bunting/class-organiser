const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

let invalidTokens = [];

function setInvalidToken(token) {
    let find = invalidTokens.find(a => a === token);
    if(!find) {
        invalidTokens.push(token);
    }
}

function hasTokenBeenInvalidated(token) {
    return invalidTokens.find(a => a === token) ? true : false;
}

/**
 * Gets the header info from a request and decodes the token to return the user id.
 * @param {*} req
 * @returns
 */
function getUserDataFromToken(req) {
  // decode the token to get the userid without having the user send it.
  const token = req.headers.authorization.split(" ")[1];
  const userData = jwt.decode(token);
  return userData;
}

async function sendEmail(to, subject, textMessage, htmlMessage) {
    const ret = await send(to, subject, textMessage, htmlMessage);
    return ret;
}

async function send(to, subject, textMessage, htmlMessage) {

    // nodemailer: https://nodemailer.com/message/addresses/

    return new Promise((resolve) => {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD
            }
        });
    
        let mailOptions = {
            from: `SmartSort <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: textMessage,
            html: htmlMessage
        };
    
        transporter.sendMail(mailOptions, (e, r) => {
            if(e) resolve(false);
            resolve(true);
        });
    })
}

module.exports.getUserDataFromToken = getUserDataFromToken;
module.exports.setInvalidToken = setInvalidToken;
module.exports.hasTokenBeenInvalidated = hasTokenBeenInvalidated;
module.exports.sendEmail = sendEmail;
