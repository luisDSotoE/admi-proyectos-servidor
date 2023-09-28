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

  const validarCampoTarea = (valor, minLength, maxLength, mensaje) => {
    if (valor.trim().length < minLength) {
      throw new Error(`El ${mensaje} debe contener mínimo ${minLength} caracteres`);
    } else if (valor.trim().length > maxLength) {
      throw new Error(`El ${mensaje} debe contener máximo ${maxLength} caracteres`);
    }
  };
  
  const validarTarea = async (req, res, next) => {
    const { nombre } = req.body;
  
    try {
      validarCampoTarea(nombre, 3, 40, 'nombre de la tarea');
      next();
    } catch (error) {
      return res.status(403).json({ msg: error.message });
    }
  };

  export {
     validarProyecto,validarTarea
  
  }