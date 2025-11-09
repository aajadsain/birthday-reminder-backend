import sgMail from "@sendgrid/mail";
import * as dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const msg = {
    to,
    from: process.env.SENDGRID_SENDER_EMAIL!,
    subject,
    html,
  };

  return sgMail.send(msg);
};
