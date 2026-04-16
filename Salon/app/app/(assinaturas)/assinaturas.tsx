<<<<<<< HEAD
import { Text } from "@/src/styles";

export default function Assinaturas() {
  return <Text>Assinaturas</Text>;
=======
import React from 'react';
import { SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-big-calendar';

export default function App() {
  const events = [
    {
      title: 'Reunião com equipe',
      start: new Date(2025, 4, 29, 10, 0), // ano, mês (0-11), dia, hora, minuto
      end: new Date(2025, 4, 29, 11, 0),
    },
    {
      title: 'Almoço com cliente',
      start: new Date(2025, 4, 29, 13, 0),
      end: new Date(2025, 4, 29, 14, 0),
    },
    {
      title: 'Revisão de projeto',
      start: new Date(2025, 4, 30, 9, 0),
      end: new Date(2025, 4, 30, 10, 30),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Calendar
        events={events}
        height={600}
        mode="week"  // opções: 'day', 'week', 'month'
        locale="pt-BR"
        swipeEnabled
        eventCellStyle={{ backgroundColor: '#6200ee' }}
        headerContainerStyle={{ backgroundColor: '#f8f9fa' }}
      />
    </SafeAreaView>
  );
>>>>>>> parent of 10c19fd (Delete Salon/app directory)
}
