import { createTransport } from "../config/nodemailer.js";

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const transporter = createTransport(
    process.env.MAILER_SERVICE,
    process.env.MAILER_EMAIL,
    process.env.MAILER_SECRET_KEY
  );

  const info = await transporter.sendMail({
    from: '"UpTask - Administrador de Proyectos" <admiProyectos@uptask.com>',
    to: email,
    subject: "Administrador de Proyectos - Comprueba tu cuenta",
    text: "Comprueba tu cuenta",
    html: `<p>Hola: ${nombre} Comprueba tu cuenta</p>
    <p>Tu cuenta ya esta casi lista, solo debes comprobarla en el siguiente enlace: 

    <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Comprobar Cuenta</a>
    
    <p>Si tu no creaste esta cuenta, puedes ignorar el mensaje</p>
    `,
  });
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token } = datos;

  const transporter = createTransport(
    process.env.MAILER_SERVICE,
    process.env.MAILER_EMAIL,
    process.env.MAILER_SECRET_KEY
  );

  const info = await transporter.sendMail({
    from: '"UpTask - Administrador de Proyectos" <admiProyectos@uptask.com>',
    to: email,
    subject: "UpTask - Reestablece tu Password",
    text: "Reestablece tu Password",
    html: `<p>Hola: ${nombre} has solicitado reestablecer tu password</p>

    <p>Sigue el siguiente enlace para generar un nuevo password: 

    <a href="${process.env.FRONTEND_URL}/olvide-password/${token}">Reestablecer Password</a>
    
    <p>Si tu no solicitaste este email, puedes ignorar el mensaje</p>
    
    
    `,
  });
};
