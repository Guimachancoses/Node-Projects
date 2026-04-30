const express = require("express");
const router = express.Router();

const {
  registerPushToken,
  deletePushToken,
  sendPushNotification,
  sendPushToCliente

} = require("../controllers/push-token.controller");

router.post("/", registerPushToken);           // POST /push-token
router.delete("/:token", deletePushToken);     // DELETE /push-token/:token
router.post("/send", sendPushNotification);    // POST /push-token/send
router.post("/send/cliente", sendPushToCliente);

module.exports = router;