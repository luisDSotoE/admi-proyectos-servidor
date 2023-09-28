import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";

const validarCampoTarea = (valor, minLength, maxLength, mensaje) => {
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


const validarTarea = async (req, res, next) => {
  const { nombre, descripcion, fechaEntrega } = req.body;

  try {
    validarCampoTarea(nombre, 3, 40, 'nombre de la tarea');
    validarCampoTarea(descripcion, 1, 100, 'descripción');
    validarFechaEntrega(fechaEntrega);
    next();
  } catch (error) {
    return res.status(403).json({ msg: error.message });
  }
};




const agregarTarea = async (req, res) => {

  try {
    validarTarea(req, res, async () => {
      const { proyecto } = req.body;

      const existeProyecto = await Proyecto.findById(proyecto);

      if (!existeProyecto) {
        const error = new Error("El Proyecto no existe");
        return res.status(404).json({ msg: error.message });
      }

      if (existeProyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("No tienes los permisos para añadir tareas");
        return res.status(403).json({ msg: error.message });
      }


      const tareaAlmacenada = await Tarea.create(req.body);
      // Almacenar el ID en el proyecto
      existeProyecto.tareas.push(tareaAlmacenada._id);
      await existeProyecto.save();
      res.json(tareaAlmacenada);

    })
  } catch (error) {
    console.log(error);
  }

};

const obtenerTarea = async (req, res) => {
  const { id } = req.params;

  const tarea = await Tarea.findById(id).populate("proyecto");

  if (!tarea) {
    const error = new Error("Tarea no encontrada");
    return res.status(404).json({ msg: error.message });
  }

  if (tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
    const error = new Error("Acción no válida");
    return res.status(403).json({ msg: error.message });
  }

  res.json(tarea);
};

const actualizarTarea = async (req, res) => {

  try {
    validarTarea(req, res, async () => {
      const { id } = req.params;

      const tarea = await Tarea.findById(id).populate("proyecto");

      if (!tarea) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ msg: error.message });
      }

      if (tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ msg: error.message });
      }

      tarea.nombre = req.body.nombre || tarea.nombre;
      tarea.descripcion = req.body.descripcion || tarea.descripcion;
      tarea.prioridad = req.body.prioridad || tarea.prioridad;
      tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega;
      const tareaAlmacenada = await tarea.save();
      res.json(tareaAlmacenada);

    })
  } catch (error) {
    console.log(error);
  }

};

const eliminarTarea = async (req, res) => {
  const { id } = req.params;

  const tarea = await Tarea.findById(id).populate("proyecto");

  if (!tarea) {
    const error = new Error("Tarea no encontrada");
    return res.status(404).json({ msg: error.message });
  }

  if (tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
    const error = new Error("Acción no válida");
    return res.status(403).json({ msg: error.message });
  }

  try {
    const proyecto = await Proyecto.findById(tarea.proyecto);
    proyecto.tareas.pull(tarea._id);
    await Promise.allSettled([await proyecto.save(), await tarea.deleteOne()]);
    res.json({ msg: "La Tarea se eliminó" });
  } catch (error) {
    console.log(error);
  }
};

const cambiarEstado = async (req, res) => {
  const { id } = req.params;

  const tarea = await Tarea.findById(id).populate("proyecto");

  if (!tarea) {
    const error = new Error("Tarea no encontrada");
    return res.status(404).json({ msg: error.message });
  }

  if (
    tarea.proyecto.creador.toString() !== req.usuario._id.toString() &&
    !tarea.proyecto.colaboradores.some(
      (colaborador) => colaborador._id.toString() === req.usuario._id.toString()
    )
  ) {
    const error = new Error("Acción no válida");
    return res.status(403).json({ msg: error.message });
  }

  tarea.estado = !tarea.estado;
  tarea.completado = req.usuario._id;
  await tarea.save();

  const tareaAlmacenada = await Tarea.findById(id)
    .populate("proyecto")
    .populate("completado");

  res.json(tareaAlmacenada);
};

export {
  agregarTarea,
  obtenerTarea,
  actualizarTarea,
  eliminarTarea,
  cambiarEstado,
};
