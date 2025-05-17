import React from "react";
import { Cover, Box } from "@/src/styles";
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
