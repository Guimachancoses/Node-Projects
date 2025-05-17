// apiCep.js
export async function buscarEndereco(cep: string) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      //console.error("CEP não encontrado");
      return null;
    }

    return data;
  } catch (error) {
    //console.error("Erro na requisição:", error);
    return null;
  }
}
