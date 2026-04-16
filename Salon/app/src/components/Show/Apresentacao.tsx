import React from "react";
<<<<<<< HEAD
import { Cover, Box } from "@/src/styles";
=======
import { Cover } from "@/src/styles";
>>>>>>> parent of 10c19fd (Delete Salon/app directory)
import Gradient from "../Agendamento/Gradient";
import { useSelector } from "react-redux";
import consts from "@/src/constants/consts";

export default function Apresentacao() {
  const { salao } = useSelector((state: any) => state.salao);

  //console.log(`${consts?.bucketUrl}/${salao?.arquivos?.[0]?.caminho}`);

  return (
    <Cover
      image={{ uri: `${consts?.bucketUrl}/${salao?.arquivos?.[0]?.caminho}` }}
      customWidth="100%"
      customHeight="520px"
      resizeMode="cover"
    >
      <Gradient></Gradient>
    </Cover>
  );
}
