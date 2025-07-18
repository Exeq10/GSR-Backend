import mongoose from "mongoose";

const reservaSchema = new mongoose.Schema({
  nombreCliente: {
    type: String,
    required: true
  },
  apellidoCliente: {
    type: String,
    required: true
  },
  celularCliente: {
    type: String,
    required: true
  },
  fechaReserva: {
    type: Date,
    required: true,
    unique: true
  },
  tipoEvento: {
    type: String,
    required: true
  },
  senia: {
    type: Number,
    required: true
  },
  metodoPago: {
    type: String,
    default: "mercadopago",
    required: true
  },
  señaPagada: {
    type: Boolean,
    default: false
  },
  creadoEn: {
    type: Date,
    default: Date.now
  },
    cantidadPersonas: {
    type: Number,
    required: true
  },
});

export const Reserva = mongoose.model("Reserva", reservaSchema);
