const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs').promises;
const moment = require('moment-timezone');

const sendEmail = async (payload) => {
  try {
    const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', payload, {
      headers: {
        'content-type': 'application/json',
        'api-key': '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',
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response?.data);
  }
};

exports.scheduleMail = async (req, res) => {
  try {
    const {
      admin,
      recipient,
      subject,
      dueDateTime,
      hourstoDelivery,
      interval,
      taskName,
      startDate,
      endDate,
      timeZone,
    } = req.body;

    const adminEmailTemplate = await fs.readFile('emailTemplate/adminEmail.html', 'utf-8');
    const recipientEmailTemplate = await fs.readFile('emailTemplate/recipientEmail.html', 'utf-8');

    const job = cron.schedule(`0 */${interval} * * *`, async () => {
      const sendEmailsToRole = async (emails, subject, taskName, emailTemplate) => {
        const payloadPromises = emails.map(async (email) => {
          const recipient = recipientData.find((data) => data.email === email);
          if (!recipient) return;

          const emailContent = emailTemplate
            .replace('{{ recipientName }}', recipient.recipientName)
            .replace('{{ taskName }}', taskName)
            .replace('{{ dueDateTime }}', dueDateTime)
            .replace('{{ hoursOrDaysToDelivery }}', hourstoDelivery);

          const payload = {
            sender: {
              name: 'Prolificme Support',
              email: 'reminder@prolificme.com',
            },
            to: [{ email }],
            subject,
            htmlContent: emailContent,
          };

          await sendEmail(payload);
        });

        await Promise.all(payloadPromises);
      };

      await Promise.all([
        sendEmailsToRole(admin, subject, taskName, adminEmailTemplate),
        sendEmailsToRole(recipient, subject, taskName, recipientEmailTemplate),
      ]);
    });

    job.start();

    const startMoment = moment.tz(startDate, timeZone);
    const endMoment = moment.tz(endDate, timeZone);

    setTimeout(() => {
      job.stop();
      console.log('Job stopped');
    }, endMoment.diff(startMoment));

    res.json({ message: 'Email scheduled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while scheduling the email.' });
  }
};
