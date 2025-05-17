import React, { useEffect } from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { resetAgendamento, updateStatusAgendamento } from "@/src/store/modules/salao/actions";

export default function PagamentoPendente({ visible = true }) {
  const dispatch = useDispatch();
  const handleOk = () => {
    router.push("/home" as any);
  };

  useEffect(() => {
    dispatch(updateStatusAgendamento({status_payment: "P"}));
    dispatch(resetAgendamento());
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Image
            source={{
              uri: "https://media.giphy.com/media/xT9IgpPbfD9uFnVjAs/giphy.gif", // GIF de pendente
            }}
            style={styles.gif}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            Seu pagamento está pendente de aprovação!
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleOk}>
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
