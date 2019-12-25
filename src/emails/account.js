const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name) => {
    sgMail.send({
        to : email,
        from : 'saurabhkhaparey05@gmail.com',
        subject : 'Welcome to the Task Manager Application!!!!',
        text : `Hello ${name}. We are very happy to add you as a member of our TasK Manager Applcation.... `
    })
}

const sendCancellationEmail = (email,name) => {
    sgMail.send({
        to : email,
        from : 'saurabhkhaparey05@gmail.com',
        subject : 'Sorry to see you go...!!!!',
        text : `Hey ${name}. I am sorry if you are not happy with this application. Hope to see you soon.... `
    })
}


module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}