const mongoose = require("mongoose");

const URI =
  "mongodb+srv://salaoUser:kM1k172AQODlcHa4@salonfi.be8nses.mongodb.net/salao-group?retryWrites=true&w=majority&appName=SalonFi";

mongoose
  .connect(URI)
  .then(() => console.log("Db is Up"))
  .catch((err) => console.error("Erro ao conectar no MongoDB:", err));
