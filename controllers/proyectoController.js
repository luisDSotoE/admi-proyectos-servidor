import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";

// Funciones validacion
const validarCampo = (valor, minLength, maxLength, mensaje) => {
  if (valor.trim().length < minLength) {
    throw new Error(`El ${mensaje} debe contener mínimo ${minLength} caracteres`);
  } else if (valor.trim().length > maxLength) {
    throw new Error(`El ${mensaje} debe contener máximo ${maxLength} caracteres`);
  }
};

const validarFechaEntrega = (fechaEntrega) => {
  const fechaEntregaDate = new Date(fechaEntrega);
  const fechaActual = new Date();
  if (fechaEntregaDate < fechaActual) {
    throw new Error('La fecha de entrega no puede ser menor a la fecha actual');
  }
};

const validarProyecto = async (req, res, next) => {
  const { nombre, descripcion, fechaEntrega, cliente } = req.body;

  try {
    validarCampo(nombre, 1, 60, 'nombre');
    validarCampo(descripcion, 1, 100, 'descripción');
    validarFechaEntrega(fechaEntrega);
    validarCampo(cliente, 1, 50, 'nombre del cliente');
    next();
  } catch (error) {
    return res.status(403).json({ msg: error.message });
  }
};


const obtenerProyectos = async (req, res) => {
  const proyectos = await Proyecto.find({
    $or: [
      { colaboradores: { $in: req.usuario } },
      { creador: { $in: req.usuario } },
    ],
  }).select("-tareas");
  res.json(proyectos);
};

const nuevoProyecto = async (req, res) => {
  
    try {
    await validarProyecto(req, res, async () => {
      const proyecto = new Proyecto(req.body);
      proyecto.creador = req.usuario._id;
      const proyectoAlmacenado = await proyecto.save();
      res.json(proyectoAlmacenado);
    });
  } catch (error) {
    console.log(error);
  }

};

const obtenerProyecto = async (req, res) => {
  const { id } = req.params;

  const proyecto = await Proyecto.findById(id)
    .populate({
      path: "tareas",
      populate: { path: "completado", select: "nombre" },
    })
    .populate("colaboradores", "nombre email");

  if (!proyecto) {
    const error = new Error("No Encontrado");
    return res.status(404).json({ msg: error.message });
  }

  if (
    proyecto.creador.toString() !== req.usuario._id.toString() &&
    !proyecto.colaboradores.some(
      (colaborador) => colaborador._id.toString() === req.usuario._id.toString()
    )
  ) {
    const error = new Error("Acción No Válida");
    return res.status(401).json({ msg: error.message });
  }

  res.json(proyecto);
};

const editarProyecto = async (req, res) => {
  try {
    await validarProyecto(req, res, async () => {
      const { id } = req.params;

      const proyecto = await Proyecto.findById(id);
    
      if (!proyecto) {
        const error = new Error("No Encontrado");
        return res.status(404).json({ msg: error.message });
      }
    
      if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción No Válida");
        return res.status(401).json({ msg: error.message });
      }
    
      proyecto.nombre = req.body.nombre || proyecto.nombre;
      proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
      proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
      proyecto.cliente = req.body.cliente || proyecto.cliente;

      const proyectoAlmacenado = await proyecto.save();
      res.json(proyectoAlmacenado);
    })
  } catch (error) {
    console.log(error);
  }

};

const eliminarProyecto = async (req, res) => {
  const { id } = req.params;

  const proyecto = await Proyecto.findById(id);

  if (!proyecto) {
    const error = new Error("No Encontrado");
    return res.status(404).json({ msg: error.message });
  }

  if (proyecto.creador.toString() !== req.usuario._id.toString()) {
    const error = new Error("Acción No Válida");
    return res.status(401).json({ msg: error.message });
  }

  try {
    await proyecto.deleteOne();
    res.json({ msg: "Proyecto Eliminado" });
  } catch (error) {
    console.log(error);
  }
};

const buscarColaborador = async (req, res) => {
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
  const usuario = await Usuario.findOne({ email }).select(
    "-confirmado -createdAt -password -token -updatedAt -__v "
  );

  if (!usuario) {
    const error = new Error("Usuario no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  res.json(usuario);
};




const agregarColaborador = async (req, res) => {
  const proyecto = await Proyecto.findById(req.params.id);

  if (!proyecto) {
    const error = new Error("Proyecto No Encontrado");
    return res.status(404).json({ msg: error.message });
  }

  if (proyecto.creador.toString() !== req.usuario._id.toString()) {
    const error = new Error("Acción no válida");
    return res.status(404).json({ msg: error.message });
  }

  const { email } = req.body;
  const usuario = await Usuario.findOne({ email }).select(
    "-confirmado -createdAt -password -token -updatedAt -__v "
  );

  if (!usuario) {
    const error = new Error("Usuario no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  // El colaborador no es el admin del proyecto
  if (proyecto.creador.toString() === usuario._id.toString()) {
    const error = new Error("El Creador del Proyecto no puede ser colaborador");
    return res.status(404).json({ msg: error.message });
  }

  // Revisar que no este ya agregado al proyecto
  if (proyecto.colaboradores.includes(usuario._id)) {
    const error = new Error("El Usuario ya pertenece al Proyecto");
    return res.status(404).json({ msg: error.message });
  }

  // Esta bien, se puede agregar
  proyecto.colaboradores.push(usuario._id);
  await proyecto.save();
  res.json({ msg: "Colaborador Agregado Correctamente" });
};

const eliminarColaborador = async (req, res) => {
  const proyecto = await Proyecto.findById(req.params.id);

  if (!proyecto) {
    const error = new Error("Proyecto No Encontrado");
    return res.status(404).json({ msg: error.message });
  }

  if (proyecto.creador.toString() !== req.usuario._id.toString()) {
    const error = new Error("Acción no válida");
    return res.status(404).json({ msg: error.message });
  }

  // Esta bien, se puede eliminar
  proyecto.colaboradores.pull(req.body.id);
  await proyecto.save();
  res.json({ msg: "Colaborador Eliminado Correctamente" });
};

export {
  obtenerProyectos,
  nuevoProyecto,
  obtenerProyecto,
  editarProyecto,
  eliminarProyecto,
  buscarColaborador,
  agregarColaborador,
  eliminarColaborador,
};



