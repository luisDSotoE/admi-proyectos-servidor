import nodemailer from "nodemailer";
export function createTransport(service, user, pass) {
  return nodemailer.createTransport({
    service,
    auth: {
      user,
      pass,
    },
  });
}
