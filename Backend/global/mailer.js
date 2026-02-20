import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

console.log('--- CHECK ENV VALUES ---')
console.log('USER:', process.env.MAIL_USER) 
console.log('PASS:', process.env.MAIL_PASS ? 'OK (Has Password)' : 'MISSING!') 
console.log('------------------------')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

export const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"Migration Plan" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,   
    text   
  })
}