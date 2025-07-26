import { Reserva } from "../models/Reserva.js";
import axios from "axios";
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
/**
 * @swagger
 * /reservas/fechas-disponibles:
 *   get:
 *     summary: Obtener las fechas que ya están reservadas
 *     tags: [Reservas]
 *     responses:
 *       200:
 *         description: Fechas reservadas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fechasReservadas:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Error al obtener fechas
 */
export const getFechasDisponibles = async (req, res) => {
  try {
    const reservas = await Reserva.find({}, "fechaReserva");
    const fechasReservadas = reservas.map((r) =>
      new Date(r.fechaReserva).toISOString().split("T")[0]
    );
    res.status(200).json({ fechasReservadas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener fechas" });
  }
};

/**
 * @swagger
 * /reservas:
 *   post:
 *     summary: Crear una preferencia de pago para una nueva reserva
 *     tags: [Reservas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombreCliente
 *               - apellidoCliente
 *               - celularCliente
 *               - fechaReserva
 *               - tipoEvento
 *               - senia
 *               - cantidadPersonas
 *             properties:
 *               nombreCliente:
 *                 type: string
 *               apellidoCliente:
 *                 type: string
 *               celularCliente:
 *                 type: string
 *               fechaReserva:
 *                 type: string
 *                 example: "2025-08-15"
 *               tipoEvento:
 *                 type: string
 *               senia:
 *                 type: number
 *               cantidadPersonas:
 *                 type: number
 *     responses:
 *       200:
 *         description: Preferencia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 preferenceId:
 *                   type: string
 *                 initPoint:
 *                   type: string
 *       400:
 *         description: Faltan datos requeridos o fecha ya reservada
 *       500:
 *         description: Error al crear preferencia de pago
 */
export const crearReserva = async (req, res) => {
  try {
    const {
      nombreCliente,
      apellidoCliente,
      celularCliente,
      fechaReserva,
      tipoEvento,
      senia,
      cantidadPersonas,
    } = req.body;

    if (
      !nombreCliente ||
      !apellidoCliente ||
      !celularCliente ||
      !fechaReserva ||
      !tipoEvento ||
      senia == null ||
      cantidadPersonas == null
    ) {
      return res.status(400).json({ mensaje: "Faltan datos requeridos" });
    }

    const fecha = new Date(`${fechaReserva}T00:00:00Z`);
    const yaReservada = await Reserva.findOne({ fechaReserva: fecha });

    if (yaReservada) {
      return res.status(400).json({ mensaje: "Fecha ya reservada" });
    }

    const preferenceData = {
      items: [
        {
          title: `Seña para evento: ${tipoEvento}`,
          quantity: 1,
          currency_id: "UYU",
          unit_price: Number(senia),
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/reserva-exitosa`,
        failure: `${process.env.FRONTEND_URL}/reserva-fallida`,
        pending: `${process.env.FRONTEND_URL}/reserva-pendiente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.BACKEND_URL}/webhook/mp`,
      metadata: {
        nombreCliente,
        apellidoCliente,
        celularCliente,
        fechaReserva,
        tipoEvento,
        senia,
        cantidadPersonas,
      },
    };

    const preferenceInstance = new Preference(client);
    const preferenceResponse = await preferenceInstance.create({ body: preferenceData });

    res.status(200).json({
      mensaje: "Preferencia creada",
      preferenceId: preferenceResponse.id,
      initPoint: preferenceResponse.init_point,
    });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ mensaje: "Error al crear preferencia de pago" });
  }
};
/**
 * @swagger
 * /webhook/mp:
 *   post:
 *     summary: Webhook para procesar notificaciones de MercadoPago
 *     tags: [Reservas]
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: data.id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Reserva confirmada y guardada
 *       200:
 *         description: Evento ignorado o fecha ya reservada
 *       500:
 *         description: Error al procesar el webhook
 */
export const webhookMP = async (req, res) => {
  try {
    const { type, "data.id": paymentId } = req.query;

    if (type !== "payment") return res.status(200).send("Evento ignorado");

    const { data } = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    if (data.status !== "approved") return res.status(200).send("Pago no aprobado");

    const {
      metadata: {
        nombreCliente,
        apellidoCliente,
        celularCliente,
        fechaReserva,
        tipoEvento,
        senia,
        cantidadPersonas,
      },
    } = data;

    const fecha = new Date(`${fechaReserva}T00:00:00Z`);
    const yaReservada = await Reserva.findOne({ fechaReserva: fecha });
    if (yaReservada) return res.status(200).send("Fecha ya reservada");

    const nuevaReserva = new Reserva({
      nombreCliente,
      apellidoCliente,
      celularCliente,
      fechaReserva: fecha,
      metodoPago: "mercadopago",
      tipoEvento,
      senia,
      señaPagada: true, // <-- Corregido aquí
      cantidadPersonas, // <-- Ya estaba bien
    });

    await nuevaReserva.save();
    res.status(201).send("Reserva confirmada y guardada");
  } catch (error) {
    console.error("Error en webhook:", error);
    res.status(500).send("Error al procesar el webhook");
  }
};

/**
 * @swagger
 * /reservas:
 *   get:
 *     summary: Obtener todas las reservas
 *     tags: [Reservas]
 *     responses:
 *       200:
 *         description: Lista de reservas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 reservas:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error al obtener las reservas
 */
export const getTodasLasReservas = async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ fechaReserva: -1 });

    res.status(200).json({
      mensaje: "Reservas obtenidas correctamente",
      reservas,
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ mensaje: "Error al obtener las reservas" });
  }
};