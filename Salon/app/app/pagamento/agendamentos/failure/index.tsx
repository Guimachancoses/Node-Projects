import { resetAgendamento, updateStatusAgendamento } from "@/src/store/modules/salao/actions";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useDispatch } from "react-redux";

export default function PagamentoSucesso({ visible = true }) {
  const dispatch = useDispatch();
  const handleLogin = () => {
    // chama a tela de home
    router.push("/home" as any);
  };

  useEffect(() => {
    dispatch(updateStatusAgendamento({status_payment: "E"}));
    dispatch(resetAgendamento());
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Image
            source={{
              uri: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif", // GIF direto
            }}
            style={styles.gif}
            resizeMode="contain"
          />
          <Text style={styles.title}>Pagamento realizado com sucesso!</Text>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  gif: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0a84ff",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
