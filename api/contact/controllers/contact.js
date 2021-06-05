"use strict";
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
    const { email, message, name } = ctx.request.body;
    if (!mailRegex.test(email)) {
      return { message: "Email invalid" };
    }
    if (!message) {
      return { message: "Message field required" };
    }
    if (!name) {
      return { message: "Name field required" };
    }
    const contactApi = strapi.query("contact");
    const createEmail = await contactApi.create({ ...ctx.request.body });
    try {
      const emailText = `New message from web form:\n\nEmail: ${email}\nName: ${name}\n\n${message}`;

      const params = {
        Destination: {
          ToAddresses: ["robinkotubej@gmail.com"],
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
