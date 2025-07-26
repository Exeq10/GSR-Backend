// routes/reservas.js
import express from "express";
import {
  crearReserva,
  getFechasDisponibles,
  webhookMP,
  getTodasLasReservas
} from "../controllers/reservasController.js";

const router = express.Router();

router.get("/disponibles", getFechasDisponibles);
router.post("/", crearReserva);
router.post("/webhook/mp", webhookMP);
router.get("/", getTodasLasReservas);

export default router;
