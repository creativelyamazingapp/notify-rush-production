import { ActionFunction, json } from "@remix-run/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Configure the SES client
const sesClient = new SESClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export default sesClient;

