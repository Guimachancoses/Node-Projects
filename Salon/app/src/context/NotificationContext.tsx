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
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  clearNotification: () => void;
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
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Referências para os listeners de notificações
  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);
  const responseListener =
    useRef<Notifications.EventSubscription | null>(null);

  const clearNotification = () => setNotification(null);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token ?? null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao registrar notificações")
        );
      }

      // ✅ Check se o app foi aberto por uma notificação
      try {
        const lastNotificationResponse =
          await Notifications.getLastNotificationResponseAsync();

        if (lastNotificationResponse) {
          setNotification(lastNotificationResponse.notification);
        }
      } catch (err) {
        // opcional: log
      }
    };

    setupNotifications();

    // Configura listener para recebimento de notificações
    notificationListener.current =
      Notifications.addNotificationReceivedListener((incomingNotification) => {
        setNotification(incomingNotification);
      });

    // Configura listener para resposta às notificações
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((_response) => {
        // lógica opcional
      });

    // Limpeza dos listeners quando o componente é desmontado
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Provedor do contexto que disponibiliza os dados para componentes filhos
  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error, clearNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};