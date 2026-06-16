const { Router } = require("express");
const controller = require("../controllers/avaliacao.controller");

const routes = Router();

routes.post("/", controller.criarAvaliacao);
routes.get("/", controller.listarAvaliacoes);

module.exports = routes;
