import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import theme from "@/src/styles/theme.json";
import Gradient from "@/Agendamento/Gradient";
import { Touchable, Text, Spacer, Box } from "@/src/styles";


const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    height: 70,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden", // necessário para fazer o arredondamento funcionar
  },
});

export default function DetalheHeader() {
  return (
    <View style={styles.headerContainer}>
      <Gradient
        colors={[theme.colors.dark, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Touchable>
          <Box>
            <Icon name="chevron-left" color={theme.colors.light} size={30} />
            <View style={{ marginLeft: 20 }}>
              <Text color="light">Detalhes do Agendamento</Text>
              <Spacer size="3px" />
              <Text small color="light">
                Informações sobre horário, pagamento e profissional.
              </Text>
            </View>
          </Box>
        </Touchable>
      </Gradient>
    </View>
  );
}
