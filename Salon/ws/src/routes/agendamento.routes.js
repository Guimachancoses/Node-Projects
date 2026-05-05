const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const TZ = "America/Sao_Paulo";
const util = require("../util");
const _ = require("lodash");
const { DateTime } = require("luxon");

const Servico = require("../models/servico");
const Colaborador = require("../models/colaborador");
const Agendamento = require("../models/agendamento");
const Horario = require("../models/horario");
require("dotenv").config();

// Rota para criar um agendamento
router.post("/", async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();
  try {
    //console.log("req.body:", req.body);

    const { clienteId, salaoId, servicoId, colaboradorId, status_payment } =
      req.body;

    // Validação dos campos obrigatórios
    if (
      !clienteId ||
      !salaoId ||
      !servicoId ||
      !colaboradorId ||
      !req.body.data
    ) {
      throw new Error("Campos obrigatórios faltando");
    }

    // Busca o serviço e valida
    const servico = await Servico.findById(servicoId).select(
      "preco titulo descricao comissao duracao"
    );
    if (!servico) throw new Error("Serviço não encontrado");

    // Validação e conversão da data
    const TZ = "America/Sao_Paulo";

    // Interpreta o horário recebido como São Paulo
    const inicioSP = DateTime.fromISO(req.body.data, { zone: TZ });

    if (!inicioSP.isValid) {
      throw new Error("Data de início inválida");
    }

    const agoraSP = DateTime.now().setZone(TZ);

    // tolerância de 1 minuto para evitar rejeição por segundos
    if (inicioSP < agoraSP.minus({ minutes: 1 })) {
      throw new Error("Não é possível agendar para uma data no passado");
    }

    // mantém seu fluxo com moment:
    const inicio = moment(inicioSP.toJSDate());

    // Conversão da duração do serviço
    const duracaoMinutos = util.hourToMinutes(
      moment(servico.duracao).format("HH:mm")
    );
    const fim = moment(inicio).add(duracaoMinutos, "minutes");

    // Verifica se o colaborador existe
    const colaborador = await Colaborador.findById(colaboradorId);
    if (!colaborador) {
      throw new Error("Colaborador não encontrado");
    }

    // Verifica conflitos de horário para o colaborador, excluindo agendamentos cancelados
    const agendamentosColaborador = await Agendamento.find({
      colaboradorId,
      status: { $ne: "C" },
      data: {
        $gte: moment(inicio).startOf('day').toDate(),
        $lt: moment(inicio).endOf('day').toDate(),
      },
    }).populate("servicoId", "duracao");

    const conflito = agendamentosColaborador.find(ag => {
      const inicioExistente = moment(ag.data);
      const duracao = util.hourToMinutes(moment(ag.servicoId.duracao).format("HH:mm"));
      const fimExistente = moment(inicioExistente).add(duracao, "minutes");

      return (
        inicioExistente.isBefore(fim) && fimExistente.isAfter(inicio)
      );
    });

    if (conflito) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        error: "Colaborador já possui um agendamento neste horário",
      });
    }

    // console.log("inicio:", inicio);
    // console.log("fim:", fim);

    // Verifica se o cliente já tem outro agendamento que se sobreponha ao novo horário
    const agendamentosCliente = await Agendamento.find({
      clienteId,
      status: { $ne: "C" },
      data: {
        $gte: moment(inicio).startOf('day').toDate(),
        $lt: moment(inicio).endOf('day').toDate(),
      },
    }).populate("servicoId", "duracao");

    const clienteConflito = agendamentosCliente.find(ag => {
      const inicioExistente = moment(ag.data);
      const duracao = util.hourToMinutes(moment(ag.servicoId.duracao).format("HH:mm"));
      const fimExistente = moment(inicioExistente).add(duracao, "minutes");

      return (
        inicioExistente.isBefore(fim) && fimExistente.isAfter(inicio)
      );
    });

    //console.log("clienteConflito:", clienteConflito);

    if (clienteConflito) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        error: "Você já possui um agendamento que conflita com este horário",
      });
    }

    // Cria o agendamento
    const agendamento = await new Agendamento({
      ...req.body,
      data: inicio.toDate(),
      fim: fim.toDate(),
      salaoId,
      colaboradorId,
      clienteId,
      servicoId,
      comissao: servico.comissao,
      valor: servico.preco,
      statusPagamento: status_payment,
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, agendamento });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Erro ao criar agendamento:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Rota para filtrar os agendamentos
router.post("/filter", async (req, res) => {
  try {
    const { periodo, salaoId } = req.body;

    const agendamento = await Agendamento.find({
      salaoId,
      data: {
        $gte: moment(periodo.inicio).startOf("day"),
        $lte: moment(periodo.final).endOf("day"),
      },
      status: { $ne: "C" },
    }).populate([
      { path: "servicoId", select: "titulo duracao" },
      { path: "colaboradorId", select: "nome sobrenome" },
      { path: "clienteId", select: "nome sobrenome" },
    ]);

    res.json({ error: false, agendamento });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para verificar os dias diponiveis
router.post("/dias-disponiveis", async (req, res) => {
  try {
    const { data, salaoId, servicoId } = req.body;

    const horarios = await Horario.find({ salaoId });
    const servico = await Servico.findById(servicoId).select("duracao");

    let agenda = [];
    let colaboradores = [];

    // dia base em SP
    let lastDay = moment.tz(data, "YYYY-MM-DD", TZ).startOf("day");
    const agoraSP = moment.tz(TZ);
    const hojeSP = agoraSP.format("YYYY-MM-DD");

    const servicoMinutos = util.hourToMinutes(
      moment(servico.duracao).format("HH:mm")
    );
    const servicoSlots = util.sliceMinutes(
      servico.duracao,
      moment(servico.duracao).add(servicoMinutos, "minutes"),
      util.SLOT_DURATION
    ).length;

    for (let i = 0; i <= 365 && agenda.length <= 7; i++) {
      const dataFormatada = lastDay.format("YYYY-MM-DD");

      const espacosValidos = horarios.filter((horario) => {
        const diaSemanaDisponivel = horario.dias.includes(lastDay.day());
        const servicoDisponivel = horario.especialidades.includes(servicoId);
        return diaSemanaDisponivel && servicoDisponivel;
      });

      if (espacosValidos.length > 0) {
        let todosHorariosDia = {};

        for (let espaco of espacosValidos) {
          for (let colaboradorId of espaco.colaboradores) {
            if (!todosHorariosDia[colaboradorId]) {
              todosHorariosDia[colaboradorId] = [];
            }

            // horário template salvo como Date -> extrai hora/minuto em UTC
            // (mantém a "hora de relógio" que você cadastrou)
            const inicioTpl = moment.utc(espaco.inicio);
            const fimTpl = moment.utc(espaco.fim);

            const inicio = lastDay
              .clone()
              .hour(inicioTpl.hour())
              .minute(inicioTpl.minute())
              .second(0)
              .millisecond(0);

            const fim = lastDay
              .clone()
              .hour(fimTpl.hour())
              .minute(fimTpl.minute())
              .second(0)
              .millisecond(0);

            let slots = util.sliceMinutes(inicio, fim, util.SLOT_DURATION);

            // filtro de "não mostrar passado" APENAS para hoje em SP
            if (dataFormatada === hojeSP) {
              slots = slots.filter((hora) => {
                const slotSP = moment.tz(
                  `${dataFormatada} ${hora}`,
                  "YYYY-MM-DD HH:mm",
                  TZ
                );
                return slotSP.isAfter(agoraSP); // estritamente maior que agora
              });
            }

            todosHorariosDia[colaboradorId] = [
              ...todosHorariosDia[colaboradorId],
              ...slots,
            ];
          }
        }

        // limites do dia em SP convertidos para UTC p/ query Mongo
        const inicioDiaUTC = lastDay.clone().startOf("day").utc().toDate();
        const fimDiaUTC = lastDay.clone().endOf("day").utc().toDate();

        for (let colaboradorId of Object.keys(todosHorariosDia)) {
          const agendamentos = await Agendamento.find({
            colaboradorId,
            data: { $gte: inicioDiaUTC, $lte: fimDiaUTC },
            status: { $ne: "C" },
          })
            .select("data servicoId -_id")
            .populate("servicoId", "duracao");

          let horariosOcupados = agendamentos
            .map((agendamento) =>
              util.sliceMinutes(
                moment(agendamento.data).tz(TZ), // converte agendamento para SP
                moment(agendamento.data)
                  .tz(TZ)
                  .add(
                    util.hourToMinutes(
                      moment(agendamento.servicoId.duracao).format("HH:mm")
                    ),
                    "minutes"
                  ),
                util.SLOT_DURATION
              )
            )
            .flat();

          let horariosLivres = util
            .sliptByValue(
              todosHorariosDia[colaboradorId].map((h) =>
                horariosOcupados.includes(h) ? "-" : h
              ),
              "-"
            )
            .filter((space) => space.length > 0);

          horariosLivres = horariosLivres.filter((h) => h.length >= servicoSlots);

          horariosLivres = horariosLivres
            .map((slot) =>
              slot.filter((_, index) => slot.length - index >= servicoSlots)
            )
            .flat();

          horariosLivres = horariosLivres.sort((a, b) =>
            moment(a, "HH:mm").isBefore(moment(b, "HH:mm")) ? -1 : 1
          );

          horariosLivres = _.chunk(horariosLivres, 2).filter(
            (slot) => slot.length === 2
          );

          // segurança extra: se for hoje, remove novamente qualquer horário passado
          if (dataFormatada === hojeSP) {
            horariosLivres = horariosLivres.filter((slot) => {
              const horaInicio = Array.isArray(slot) ? slot[0] : slot;
              const slotSP = moment.tz(
                `${dataFormatada} ${horaInicio}`,
                "YYYY-MM-DD HH:mm",
                TZ
              );
              return slotSP.isAfter(agoraSP);
            });
          }

          if (horariosLivres.length === 0) {
            delete todosHorariosDia[colaboradorId];
          } else {
            todosHorariosDia[colaboradorId] = horariosLivres;
          }
        }

        const total = Object.keys(todosHorariosDia).length;
        if (total > 0) {
          colaboradores.push(Object.keys(todosHorariosDia));
          agenda.push({ [dataFormatada]: todosHorariosDia });
        }
      }

      lastDay = lastDay.add(1, "day");
    }

    colaboradores = _.uniq(colaboradores.flat());
    colaboradores = await Colaborador.find({ _id: { $in: colaboradores } }).select(
      "nome sobrenome foto"
    );

    res.json({ error: false, colaboradores, agenda });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para filtrar agendamentos
router.post("/filter-agendamentos", async (req, res) => {
  try {
    const agendamentos = await Agendamento.find(req.body.filters);
    res.json({ error: false, agendamentos });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// Rota para atualizar o status do agendamento
router.put("/status/:agendamentoId", async (req, res) => {
  try {
    const { agendamentoId } = req.params;
    const updateData = req.body;

    console.log("updateData:", updateData);

    const agendamento = await Agendamento.findByIdAndUpdate(
      agendamentoId,
      { $set: updateData },
      { new: true }
    );

    res.json({ error: false, agendamento });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

module.exports = router;
