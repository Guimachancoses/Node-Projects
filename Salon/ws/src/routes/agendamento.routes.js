const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment");
const util = require("../util");
const _ = require("lodash");

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
    const inicio = moment(req.body.data);
    if (!inicio.isValid()) throw new Error("Data de início inválida");

    // Verifica se a data não é no passado
    if (inicio.isBefore(moment())) {
      throw new Error("Não é possível agendar para uma data no passado");
    }

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
    let lastDay = moment(data);

    // Duração do serviço
    const servicoMinutos = util.hourToMinutes(
      moment(servico.duracao).format("HH:mm")
    );

    // Quantos slots de 30 minutos existem no servicoMinutos
    const servicoSlots = util.sliceMinutes(
      servico.duracao,
      moment(servico.duracao).add(servicoMinutos, "minutes"),
      util.SLOT_DURATION
    ).length;

    /*
      Procure nos próximos 365, até a agenda conter 7 dias disponiveis
    */
    for (let i = 0; i <= 365 && agenda.length <= 7; i++) {
      const espacosValidos = horarios.filter((horario) => {
        // Verificar o dia da semana
        const diaSemanaDisponivel = horario.dias.includes(
          moment(lastDay).day()
        ); // 1-6

        // Verificar especialidade disponivel
        const servicoDisponivel = horario.especialidades.includes(servicoId);

        return diaSemanaDisponivel && servicoDisponivel;
      });

      /*
        Todos os colaboradores disponiveis em um dia e seus horarios, em um dia especifico
      */
      if (espacosValidos.length > 0) {
        let todosHorariosDia = {};

        for (let espaco of espacosValidos) {
          for (let colaboradorId of espaco.colaboradores) {
            if (!todosHorariosDia[colaboradorId]) {
              todosHorariosDia[colaboradorId] = [];
            }

            // Pegar todos os horarios do espaço e jogar no colaborador
            todosHorariosDia[colaboradorId] = [
              ...todosHorariosDia[colaboradorId],
              ...util.sliceMinutes(
                util.mergeDateTime(lastDay, espaco.inicio),
                util.mergeDateTime(lastDay, espaco.fim),
                util.SLOT_DURATION
              ),
            ];
          }
        }

        // Verificar a agenda do colaborador no dia, de acordo com cada agendamento feito
        for (let colaboradorId of Object.keys(todosHorariosDia)) {
          // Recuperar agendamentos
          const agendamentos = await Agendamento.find({
            colaboradorId,
            data: {
              $gte: moment(lastDay).startOf("day"),
              $lte: moment(lastDay).endOf("day"),
            },
            status: { $ne: "C" },
          })
            .select("data servicoId -_id")
            .populate("servicoId", "duracao");

          // Recuperar os horarios agendados
          let horariosOcupados = agendamentos.map((agendamento) => ({
            inicio: moment(agendamento.data),
            final: moment(agendamento.data).add(
              util.hourToMinutes(
                moment(agendamento.servicoId.duracao).format("HH:mm")
              ),
              "minutes"
            ),
          }));

          // Recuperar todos os slots entre os agendamentos do colaborador que estão ocupados
          horariosOcupados = horariosOcupados
            .map((horario) =>
              util.sliceMinutes(
                horario.inicio,
                horario.final,
                util.SLOT_DURATION
              )
            )
            .flat();
          // Quais horarios do colaborador estão livres, removendo os slots ocupados
          let horariosLivres = util
            .sliptByValue(
              todosHorariosDia[colaboradorId].map((horarioLivre) => {
                return horariosOcupados.includes(horarioLivre)
                  ? "-"
                  : horarioLivre;
              }),
              "-"
            )
            .filter((space) => space.length > 0);

          /*
            Verificar se nos slots disponiveis existe tempo suficiente para o total de duração do serviço que está sendo agendado
          */

          horariosLivres = horariosLivres.filter(
            (horarios) => horarios.length > servicoSlots
          );

          /*
            Verificar se nos slots disponiveis existe tempo suficiente para o total de duração 
            sem ultrapassar o horario final do expediente
          */

          horariosLivres = horariosLivres
            .map((slot) =>
              slot.filter(
                (horario, index) => slot.length - index >= servicoSlots
              )
            )
            .flat();

          // Ordenar os horários antes de dividir
          horariosLivres = horariosLivres.sort((a, b) =>
            moment(a, "HH:mm").isBefore(moment(b, "HH:mm")) ? -1 : 1
          );

          // Formatar de 2 em 2
          horariosLivres = _.chunk(horariosLivres, 2);

          // Remover colaborador caso ele não tenha nenhum horario livre
          if (horariosLivres == 0) {
            todosHorariosDia = _.omit(todosHorariosDia, colaboradorId);
          } else {
            todosHorariosDia[colaboradorId] = horariosLivres;
          }
        }

        // Verificar se no dia solicitado tem algum colaborador disponivel
        const totalEspecialistas = Object.keys(todosHorariosDia).length;

        if (totalEspecialistas > 0) {
          colaboradores.push(Object.keys(todosHorariosDia));
          agenda.push({
            [lastDay.format("YYYY-MM-DD")]: todosHorariosDia,
          });
        }
      }
      lastDay = lastDay.add(1, "day");
    }

    // Recuperando os dados dos colaboradores
    colaboradores = _.uniq(colaboradores.flat());

    colaboradores = await Colaborador.find({
      _id: { $in: colaboradores },
    }).select("nome sobrenome foto");

    colaboradores = colaboradores.map((c) => ({
      ...c._doc,
    }));

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
