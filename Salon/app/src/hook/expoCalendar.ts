// calendarService.ts

import * as Calendar from "expo-calendar";
import { Platform, Alert } from "react-native";

// Solicitar permissão de acesso ao calendário
async function ensureCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  //console.log("status: ", status);

  if (status !== "granted") {
    const { status: newStatus } = await Calendar.requestCalendarPermissionsAsync();
    if (newStatus !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos da sua permissão para adicionar eventos ao calendário."
      );
      return false;
    }
  }

  return true;
}

// Criar ou obter um calendário para o app
async function getOrCreateCalendar(): Promise<string> {
  let defaultSource: Calendar.Source | undefined;

  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    defaultSource = defaultCalendar.source;
  } else {
    const availableCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const localCalendar = availableCalendars.find(
      (cal) => cal.source && cal.source.isLocalAccount
    );

    defaultSource = localCalendar ? localCalendar.source : undefined;
  }

  if (!defaultSource) {
    throw new Error("Não foi possível obter uma fonte de calendário padrão.");
  }

  const newCalendarID = await Calendar.createCalendarAsync({
    title: "Agendamentos do Salão",
    color: "blue",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultSource.id,
    source: defaultSource,
    name: "salao_agendamentos",
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalendarID;
}

// Criar evento no calendário
export async function createEvent({
  title,
  description,
  startDate,
  endDate,
  useAppCalendar = false, // opção para usar sempre o calendário do app
}: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  useAppCalendar?: boolean;
}): Promise<string | void> {

  const hasPermission = await ensureCalendarPermission();
  if (!hasPermission) {
    //console.warn('Permissão de calendário não concedida');
    return;
  }

  let calendarId: string;

  if (useAppCalendar) {
    try {
      calendarId = await getOrCreateCalendar();
    } catch (err) {
      //console.error('Erro ao obter ou criar calendário do app: ', err);
      return;
    }
  } else {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const editableCalendars = calendars.filter(cal => cal.allowsModifications);

    if (editableCalendars.length === 0) {
      //console.warn('Nenhum calendário editável encontrado');
      return;
    }

    calendarId = editableCalendars[0].id;
  }

  try {
    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
      notes: description,
      startDate,
      endDate,
      timeZone: 'America/Sao_Paulo',
    });
    //console.log('Evento criado com sucesso: ', eventId);
    return eventId;
  } catch (err) {
    //console.error('Erro ao criar evento: ', err);
  }
}
