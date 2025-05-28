const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Agendamento = require("../models/agendamento"); // ajuste o caminho conforme sua estrutura

async function atualizarAgendamentos() {
  try {
    const db = mongoose.connection;
    const session = await db.startSession();
    session.startTransaction();
    const agoraSP = DateTime.now().setZone("America/Sao_Paulo").toJSDate();

    const resultado = await Agendamento.updateMany(
      {
        status: "A", // status pendente
        data: { $lte: agoraSP }, // data do agendamento já passou
      },
      {
        $set: { status: "F" }, // status finalizado
      }
    );
    await session.commitTransaction();
    session.endSession();
    console.log(`Agendamentos atualizados: ${resultado.modifiedCount}`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Erro ao atualizar agendamentos:", error);
  }
}

// Executa a cada minuto
function iniciarAgendamentoScheduler() {
  // Executa imediatamente ao iniciar
  atualizarAgendamentos();

  // Executa a cada 1 minuto
  setInterval(atualizarAgendamentos, 10 * 60 * 1000);
}

module.exports = iniciarAgendamentoScheduler;
