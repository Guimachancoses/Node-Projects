import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
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

  const handleNotificationNavigation = (data: any) => {
    if (data?.route) {
      router.push({
        pathname: data.route,
        params: {
          fromPush: "1",
          action: data?.action ?? "",
          agendamentoId: data?.agendamentoId ?? "",
        },
      });
    }
  };

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

      // ✅ App aberto a partir de notificação (cold start)
      try {
        const lastNotificationResponse =
          await Notifications.getLastNotificationResponseAsync();

        if (lastNotificationResponse) {
          setNotification(lastNotificationResponse.notification);

          const data = lastNotificationResponse.notification.request.content
            .data as any;
          handleNotificationNavigation(data);
        }
      } catch {
        // opcional: log
      }
    };

    setupNotifications();

    // Notificação recebida com app aberto
    notificationListener.current =
      Notifications.addNotificationReceivedListener((incomingNotification) => {
        setNotification(incomingNotification);
      });

    // Clique/toque na notificação
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;
        handleNotificationNavigation(data);
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