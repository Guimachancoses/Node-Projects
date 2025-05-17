import React, { useState } from "react";
import {
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
  GoogleSignin,
} from "@react-native-google-signin/google-signin";

import ButtonInput from "./ButtonInput";

export default function ButtonGoogleLogin() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null); // para passar os dados ao modal, se quiser

  const showMessage = (message: string) => {
    setMessage(message);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleGoogleSingIn = async () => {
    try {
      setIsSubmitting(true);
      setIsLoading(true);

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;

        setUserInfo(user); // salva info do usuário
      } else {
        showMessage("Login com o Google cancelado.");
      }

      setIsSubmitting(false);
      setIsLoading(false);
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            showMessage("Login em andamento");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            showMessage("Serviços do Google não disponíveis");
            break;
          default:
            showMessage(`Erro: ${error.code}`);
        }
      } else {
        showMessage("Um erro ocorreu, tente mais tarde!");
      }
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <ButtonInput
      loading={isLoading}
      strategy="google"
      text="Entrar com o Google"
      disabled={isLoading}
      onPress={handleGoogleSingIn}
    />
  );
}
