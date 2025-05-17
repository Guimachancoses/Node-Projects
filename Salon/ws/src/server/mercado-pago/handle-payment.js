/**
 * @param {import("mercadopago/dist/clients/payment/commonTypes").PaymentResponse} paymentData
 */
async function handleMercadoPagoPayment(paymentData) {
  const id = paymentData.id;
  const dataUser = paymentData.payer;
  const metadata = paymentData.metadata;
  const userEmail = dataUser.email; // metadados vêm como snake_case do Mercado Pago
  const testeId = metadata.id;

  // Aqui você pode fazer qualquer ação com base no pagamento:
  // - enviar e-mail para o usuário
  // - registrar no banco
  // - liberar acesso a um serviço, etc.
  console.log("Id: ", id)
  console.log(paymentData);
  console.log("Pagamento aprovado:");
  console.log({ userEmail, testeId });

  // Exemplo:
  // await sendConfirmationEmail(userEmail);
  // await grantAccessToUser(testeId);

  return;
}

module.exports = { handleMercadoPagoPayment };
