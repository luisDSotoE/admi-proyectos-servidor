import Usuario from "../models/Usuario.js";
import generarId from "../helpers/generarId.js";
import generarJWT from "../helpers/generarJWT.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";
import path from "path";
import fs from "fs";

const registrar = async (req, res) => {
  // Evitar registros duplicados
  const { nombre, email, password } = req.body;
  const existeUsuario = await Usuario.findOne({ email });

  if (existeUsuario) {
    const error = new Error("Usuario ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  const MIN_NOMBRE_LENGHT = 1;
  const MAX_NOMBRE_LENGHT = 50;
  if (nombre.trim().length < MIN_NOMBRE_LENGHT) {
    const error = new Error(
      `El nombre debe contener minimo ${MIN_NOMBRE_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  } else if (nombre.trim().length > MAX_NOMBRE_LENGHT) {
    const error = new Error(
      `El nombre debe contener maximo ${MAX_NOMBRE_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  }

  const MIN_EMAIL_LENGHT = 1;
  const MAX_EMAIL_LENGHT = 50;
  if (email.trim().length < MIN_EMAIL_LENGHT) {
    const error = new Error(
      `El email debe contener minimo ${MIN_EMAIL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  } else if (email.trim().length > MAX_EMAIL_LENGHT) {
    const error = new Error(
      `El email debe contener maximo ${MAX_EMAIL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  }

  const MIN_PASSWORDL_LENGHT = 8;
  const MAX_PASSWORDL_LENGHT = 60;
  if (password.trim().length < MIN_PASSWORDL_LENGHT) {
    const error = new Error(
      `El password debe contener minimo ${MIN_PASSWORDL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  } else if (password.trim().length > MAX_PASSWORDL_LENGHT) {
    const error = new Error(
      `El password debe contener maximo ${MAX_PASSWORDL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  }

  try {
    const usuario = new Usuario(req.body);
    usuario.token = generarId();
    await usuario.save();

    emailRegistro({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token,
    });

    res.json({
      msg: "Usuario Creado Correctamente, Revisa tu Email para confirmar tu cuenta",
    });
  } catch (error) {
    console.log(error);
  }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;

  // Comprobar si el usuario existe
  const usuario = await Usuario.findOne({ email });
  if (!usuario) {
    const error = new Error("El Usuario no existe");
    return res.status(404).json({ msg: error.message });
  }
  const MIN_EMAIL_LENGHT = 1;
  const MAX_EMAIL_LENGHT = 50;
  if (email.trim().length < MIN_EMAIL_LENGHT) {
    const error = new Error(
      `El email debe contener minimo ${MIN_EMAIL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  } else if (email.trim().length > MAX_EMAIL_LENGHT) {
    const error = new Error(
      `El email debe contener maximo ${MAX_EMAIL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  }

  const MIN_PASSWORDL_LENGHT = 8;
  const MAX_PASSWORDL_LENGHT = 60;
  if (password.trim().length < MIN_PASSWORDL_LENGHT) {
    const error = new Error(
      `El password debe contener minimo ${MIN_PASSWORDL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  } else if (password.trim().length > MAX_PASSWORDL_LENGHT) {
    const error = new Error(
      `El password debe contener maximo ${MAX_PASSWORDL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  }

  // Comprobar si el usuario esta confirmado
  if (!usuario.confirmado) {
    const error = new Error("Tu Cuenta no ha sido confirmada");
    return res.status(403).json({ msg: error.message });
  }

  // Comprobar su password
  if (await usuario.comprobarPassword(password)) {
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarJWT(usuario._id),
    });
  } else {
    const error = new Error("El Password es Incorrecto");
    return res.status(403).json({ msg: error.message });
  }
};

const confirmar = async (req, res) => {
  const { token } = req.params;
  const usuarioConfirmar = await Usuario.findOne({ token });
  if (!usuarioConfirmar) {
    const error = new Error("Token no válido");
    return res.status(403).json({ msg: error.message });
  }

  try {
    usuarioConfirmar.confirmado = true;
    usuarioConfirmar.token = "";
    await usuarioConfirmar.save();
    res.json({ msg: "Usuario Confirmado Correctamente" });
  } catch (error) {
    console.log(error);
  }
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;

  const MIN_EMAIL_LENGHT = 1;
  const MAX_EMAIL_LENGHT = 50;
  if (email.trim().length < MIN_EMAIL_LENGHT) {
    const error = new Error(
      `El email debe contener minimo ${MIN_EMAIL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  } else if (email.trim().length > MAX_EMAIL_LENGHT) {
    const error = new Error(
      `El email debe contener maximo ${MAX_EMAIL_LENGHT} caracteres`
    );
    return res.status(403).json({ msg: error.message });
  }

  const usuario = await Usuario.findOne({ email });
  if (!usuario) {
    const error = new Error("El Usuario no existe");
    return res.status(404).json({ msg: error.message });
  }

  try {
    usuario.token = generarId();
    await usuario.save();

    // Enviar el email
    emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token,
    });

    res.json({ msg: "Hemos enviado un email con las instrucciones" });
  } catch (error) {
    console.log(error);
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const tokenValido = await Usuario.findOne({ token });

  if (tokenValido) {
    res.json({ msg: "Token válido y el Usuario existe" });
  } else {
    const error = new Error("Token no válido");
    return res.status(404).json({ msg: error.message });
  }
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const usuario = await Usuario.findOne({ token });

  if (usuario) {
    usuario.password = password;
    usuario.token = "";
    try {
      await usuario.save();
      res.json({ msg: "Password Modificado Correctamente" });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error("Token no válido");
    return res.status(404).json({ msg: error.message });
  }
};

const perfil = async (req, res) => {
  const { usuario } = req;

  res.json(usuario);
};

const uploadFoto = async (req, res) => {
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      msg: "Petición no tiene imagen",
    });
  }

  let image = req.file.originalname;
  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpg" &&
    extension != "gif"
  ) {
    const filePath = req.file.path;
    const fileDelete = fs.unlinkSync(filePath);
    return res.status(400).send({
      status: "error",
      msg: "La extension del fichero invalida",
    });
  }
  try {
    const user = await Usuario.findById(req.usuario.id);
    if (!user) {
      return res.status(404).send({
        status: "error",
        msg: "Usuario no encontrado",
      });
    }
    user.image = req.file.filename;
    const userUpdate = await user.save();

    return res.status(200).send({
      status: "success",
      user: userUpdate,
      file: req.file,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      msg: "Error en la subida de archivos",
    });
  }
};

const getImage = (req, res) => {
  const file = req.params.file;
  const filePath = "./uploads/perfil/" + file;

  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).json({
        status: "error",
        msg: "No existe la imagen",
      });
    }
    return res.status(500).sendFile(path.resolve(filePath));
  });
};

const actualizarPerfil = async (req, res) => {
  const user = await Usuario.findById(req.params.id);
  if (!user) {
    const error = new Error("Hubo un error");
    return res.status(400).json({ msg: error.message });
  }

  const { email } = req.body;
  if (user.email !== req.body.email) {
    const existeEmail = await Usuario.findOne({ email });

    if (existeEmail) {
      const error = new Error("Ese email ya esta en uso");
      return res.status(400).json({ msg: error.message });
    }
  }

  try {
    user.nombre = req.body.nombre;
    user.email = req.body.email;
    const usuarioActualizado = await user.save();
    res.json(usuarioActualizado);
  } catch (error) {
    console.log(error);
  }
};

export {
  registrar,
  autenticar,
  confirmar,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  perfil,
  uploadFoto,
  getImage,
  actualizarPerfil,
};
