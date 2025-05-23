import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  // Configuração específica para dispositivos Android
  // Define o canal de notificação com prioridade máxima e padrão de vibração
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Verifica se é um dispositivo físico
  if (Device.isDevice) {
    // Obtém o status atual da permissão de notificações
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Solicita permissão caso ainda não tenha sido concedida
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Verifica se a permissão foi concedida
    if (finalStatus !== "granted") {
      throw new Error(
        "Permissão não concedida para receber notificações push!"
      );
    }

    // Obtém o ID do projeto do Expo
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error("ID do Projeto não encontrado");
    }

    // Tenta obter o token de push notification
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      throw new Error(`${e}`);
    }
  } else {
    throw new Error("É necessário usar um dispositivo físico para notificações push");
  }
}