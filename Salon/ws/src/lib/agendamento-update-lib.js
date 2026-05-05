const { DateTime } = require("luxon");
const Agendamento = require("../models/agendamento");

let isRunning = false;

async function atualizarAgendamentos() {
  if (isRunning) return; // evita execução sobreposta
  isRunning = true;

  try {
    const agoraSP = DateTime.now().setZone("America/Sao_Paulo").toJSDate();

    const resultado = await Agendamento.updateMany(
      {
        status: { $in: ["A", "P"] }, // ajuste conforme sua regra de negócio
        data: { $lte: agoraSP },      // já passou do horário
      },
      {
        $set: { status: "F" },        // finalizado
      }
    );

    // console.log(
    //   `[Scheduler] Agendamentos finalizados: ${resultado.modifiedCount} (matched: ${resultado.matchedCount})`
    // );
  } catch (error) {
    console.error("[Scheduler] Erro ao atualizar agendamentos:", error);
  } finally {
    isRunning = false;
  }
}

function iniciarAgendamentoScheduler() {
  atualizarAgendamentos(); // executa ao iniciar

  // 1 minuto
  setInterval(atualizarAgendamentos, 60 * 1000);
}

module.exports = iniciarAgendamentoScheduler;