export const handleIntegrationMP = async () => {
  const preferencia = {
    items: [
      {
        id: "Sound system",
        title: "Dummy Title",
        description: "Dummy description",
        picture_url: "https://www.myapp.com/myimage.jpg",
        category_id: "car_electronics",
        quantity: 1,
        currency_id: "BRL",
        unit_price: 10,
      },
    ],
  };

  try {
    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer TEST-3739031587526424-041113-3cd4a2ecd50d71778628e14aed177cb8-392346799`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferencia)
      }
    );

    const data = await response.json()

    console.log(data)

    return data.init_point

  } catch (err) {
    console.log(err)
  }
};
