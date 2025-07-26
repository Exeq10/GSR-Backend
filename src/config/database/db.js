import env from "dotenv";
import mongoose from "mongoose";

env.config()


env.config();
const dbconnect = async () => {
  try {
    const URI = process.env.MONGO_URI; 

    await mongoose.connect(URI);

    console.log("Conexión a MongoDB establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
  }
};

export {dbconnect};
