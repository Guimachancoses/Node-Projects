const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Db is Up"))
  .catch((err) => console.error("Erro ao conectar no MongoDB:", err));