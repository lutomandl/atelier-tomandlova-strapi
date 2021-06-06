"use strict";
import fetch from "node-fetch";
const AWS = require("aws-sdk");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const mailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const SES_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
};

const AWS_SES = new AWS.SES(SES_CONFIG);

module.exports = {
  async create(ctx) {
    const { email, message, name, captchaResponse } = ctx.request.body;
    if (!mailRegex.test(email)) {
      return { message: "Email invalid" };
    }
    if (!message) {
      return { message: "Message field required" };
    }
    if (!name) {
      return { message: "Name field required" };
    }
    const captchaResult = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_API_KEY}&response=${captchaResponse}`,
      { method: "POST" }
    ).then((response) => response.json());
    if (!captchaResult.success) {
      return reply.code(400).send("Invalid captcha.");
    }
    const contactApi = strapi.query("contact");
    const createEmail = await contactApi.create(email, message, name);
    try {
      const emailText = `New message from web form:\n\nEmail: ${email}\nName: ${name}\n\n${message}`;

      const params = {
        Destination: {
          ToAddresses: ["lutomandl@gmail.com"],
        },
        Message: {
          Body: {
            Text: {
              Charset: "UTF-8",
              Data: emailText,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Ateliertomandlova.cz: Message from form",
          },
        },
        ReplyToAddresses: [email],
        Source: "noreply@ateliertomandlova.cz",
      };

      await AWS_SES.sendEmail(params, function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        else console.log(data); // successful response
      });
      createEmail;
      console.log(`EMAIL: ${emailText}`);
      return { message: "Email sent." };
    } catch (error) {
      console.log(error);

      return { message: "Amazon SES error." };
    }
  },
};
