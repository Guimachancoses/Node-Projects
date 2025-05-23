import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
  } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";

// Interface que define o tipo de dados do contexto de notificações
interface NotificationContextType {
  expoPushToken: string | null; // Token para envio de notificações push
  notification: Notifications.Notification | null; // Notificação atual
  error: Error | null; // Possível erro durante o processo
}

// Criação do contexto com valor inicial undefined
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Hook personalizado para acessar o contexto de notificações
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "O useNotification deve ser usado dentro de um NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  // Estados para gerenciar token, notificações e erros
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Referências para os listeners de notificações
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Registra o dispositivo para receber notificações push
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao registrar notificações'));
      }
    };

    setupNotifications();

    // Configura listener para recebimento de notificações
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("📱 Notificação Recebida: ", notification);
      setNotification(notification);
    });

    // Configura listener para resposta às notificações
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(
        "📱 Resposta da Notificação: ",
        JSON.stringify(response, null, 2),
        JSON.stringify(response.notification.request.content.data, null, 2)
      );
      // Aqui você pode adicionar lógica para lidar com a resposta da notificação
    });

    // Limpeza dos listeners quando o componente é desmontado
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Provedor do contexto que disponibiliza os dados para componentes filhos
  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};