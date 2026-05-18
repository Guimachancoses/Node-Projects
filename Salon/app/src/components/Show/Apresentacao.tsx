import React from "react";
import { Cover } from "@/src/styles";
import Gradient from "../Agendamento/Gradient";
import { useSelector } from "react-redux";
import consts from "@/src/constants/consts";

export default function Apresentacao() {
  const { salao } = useSelector((state: any) => state.salao);

  const arquivoApresentacao = salao?.arquivos?.find((arquivo: any) =>
    arquivo?.caminho?.includes("apresentacao")
  );

  return (
    <Cover
      image={{
        uri: `${consts?.bucketUrl}/${arquivoApresentacao?.caminho}`,
      }}
      customWidth="100%"
      customHeight="585px"
      resizeMode="cover"
    >
      <Gradient />
    </Cover>
  );
}