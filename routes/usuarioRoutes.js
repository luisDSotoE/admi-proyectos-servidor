import express from "express";
import multer from "multer";
const router = express.Router();
import {
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
} from "../controllers/usuarioController.js";
import path from "path";

import checkAuth from "../middleware/checkAuth.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/perfil/");
  },
  filename: (req, file, cb) => {
    cb(null, "avatar-" + Date.now() + "-" + file.originalname);
  },
});
const uploads = multer({ storage });

// Autenticación, Registro y Confirmación de Usuarios
router.post("/", registrar); // Crea un nuevo usuario
router.post("/login", autenticar);
router.get("/confirmar/:token", confirmar);
router.post("/olvide-password", olvidePassword);
router.route("/olvide-password/:token").get(comprobarToken).post(nuevoPassword);
router.get("/perfil", checkAuth, perfil);
router.post("/upload", [checkAuth, uploads.single("file0")], uploadFoto);
router.get("/perfil/:file", getImage);
router.put("/perfil/:id", checkAuth, actualizarPerfil);

export default router;
