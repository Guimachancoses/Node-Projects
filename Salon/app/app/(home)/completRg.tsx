import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
} from "react-native";
import { Text, Avatar, Button, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@clerk/clerk-expo";
import { Box } from "@/src/styles";
import { buscarEndereco } from "@/src/services/apiCep";
import { isValidCPF } from "@/src/services/validateCpf";
import { isValidPhoneNumber, AsYouType } from "libphonenumber-js";
import themeX from "@/src/styles/theme.json";
import {
  addCliente,
  updateCadastro,
  updateCliente,
} from "@/src/store/modules/cliente/action";
import { useDispatch, useSelector } from "react-redux";
import { Portal } from "react-native-paper";
import MenuComponent from "@/src/components/Menu/MenuComponet";

const MENU_WIDTH = 250;

export default function ConpletRg() {
  const dispatch = useDispatch();
  const { cliente, forms } = useSelector((state: any) => state.cliente);
  const [selectedGender, setSelectedGender] = useState("");
  const [enderecoPreenchido, setEnderecoPreenchido] = useState(false);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [imagemEscolhida, setImagemEscolhida] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);
  const [foneError, setFoneError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;

  const { user } = useUser();

  //console.log(cliente)

  const [avatar, setAvatar] = useState(user?.imageUrl || "");
  const [form, setForm] = useState({
    nome: user?.firstName || "",
    sobrenome: user?.lastName || "",
    telefone: "",
    dataNascimento: "",
    sexo: "",
    cep: "",
    numero: "",
    street: "",
    city: "",
    neighborhood: "",
    cpf: "",
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      setImagemEscolhida(true);
      setCliente("foto", result.assets[0].uri); // atualiza no Redux também
    }
  };

  useEffect(() => {
    if (user?.imageUrl && !imagemEscolhida) {
      setAvatar(user.imageUrl);
      setCliente("foto", user?.imageUrl);
    }
  }, [user?.imageUrl, imagemEscolhida]);

  const isValidBirthDate = (dateStr: string): boolean => {
    const [day, month, year] = dateStr.split("/").map(Number);
    if (!day || !month || !year) return false;

    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);

    return (
      inputDate <= today &&
      inputDate >= hundredYearsAgo &&
      inputDate.getDate() === day &&
      inputDate.getMonth() === month - 1 &&
      inputDate.getFullYear() === year
    );
  };

  const setCliente = (key: any, value: any) => {
    dispatch(
      updateCliente({
        ...cliente,
        [key]: value,
      })
    );
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const formatCPF = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  const formatCEP = (value: string) =>
    value
      .replace(/\D/g, "") // remove tudo que não for dígito
      .replace(/^(\d{5})(\d{1,3})?/, (_, p1, p2) => (p2 ? `${p1}-${p2}` : p1)) // adiciona o hífen após 5 dígitos
      .slice(0, 9); // limita a 9 caracteres totais (5+1+3)

  const formatDate = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2");

  function formatDateToISO(date: string): string {
    const day = date.slice(0, 2); // Pega o dia (DD)
    const month = date.slice(2, 4); // Pega o mês (MM)
    const year = date.slice(4, 8); // Pega o ano (YYYY)

    // Retorna no formato YYYY-MM-DD
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const carregarDados = async () => {
      if (
        forms.behavior === "update" &&
        cliente?.telefone?.numero &&
        cliente?.identificacao?.numero &&
        cliente?.dataNascimento &&
        cliente?.endereco?.cep &&
        cliente?.endereco?.numero &&
        cliente?.endereco?.cidade?.nome &&
        cliente?.endereco?.bairro &&
        cliente?.sexo
      ) {
        const numeroBr = cliente.telefone.numero;
        const numeroCpf = cliente.identificacao.numero;
        const dataNasc = cliente.dataNascimento;
        const numCep = cliente.endereco.cep;
        const endNum = String(cliente.endereco.numero);
        const endCity = cliente.endereco.cidade.nome;
        const endNeighborhood = cliente.endereco.bairro;
        const gender = cliente.sexo;
        try {
          const endereco = await buscarEndereco(numCep);
          const formatCod = formatCEP(numCep);
          const formatDoc = formatCPF(numeroCpf);
          const formatPhone = new AsYouType("BR").input(numeroBr);
          const [ano, mes, dia] = dataNasc.split("-");
          const Dataformat = `${dia}${mes}${ano}`;

          if (endereco) {
            handleChange("cep", formatCod);
            handleChange("street", endereco?.logradouro);
            handleChange("numero", endNum);
            handleChange("city", endCity);
            handleChange("neighborhood", endNeighborhood);
            setEnderecoPreenchido(true);
          }

          if (gender === "M") {
            setSelectedGender("male");
          } else if (gender === "F") {
            setSelectedGender("female");
          } else {
            setSelectedGender("other");
          }

          if (Dataformat) {
            const formatDt = formatDate(Dataformat);
            handleChange("dataNascimento", formatDt);
          }

          handleChange("telefone", formatPhone);
          handleChange("cpf", formatDoc);
        } catch (err) {
          console.error("Erro ao buscar endereço:", err);
        }
      }
    };

    carregarDados();
  }, [
    forms.behavior,
    cliente?.telefone?.numero,
    cliente?.identificacao?.numero,
    cliente?.dataNascimento,
    cliente?.endereco?.cep,
    cliente?.endereco?.numero,
    cliente?.endereco?.cidade?.nome,
    cliente?.endereco?.bairro,
    cliente?.sexo,
  ]);

  // PanResponder para swipe lateral
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dx > 15 && gesture.moveX < 40,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0 && gesture.dx < MENU_WIDTH) {
          slideAnim.setValue(-MENU_WIDTH + gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 80) {
          setMenuVisible(true);
        } else {
          Animated.timing(slideAnim, {
            toValue: -MENU_WIDTH,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <ImageBackground
      source={require("@/src/assets/images/background_parrudus.jpg")} // substitua por sua imagem
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.gradientOverlay} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Menu lateral com fundo opaco */}
        {menuVisible && forms.behavior === "update" && (
          <Portal>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "100%",
                backgroundColor: "rgba(0,0,0,0.4)",
                flexDirection: "row",
                zIndex: 9999,
              }}
            >
              <Animated.View
                style={{
                  width: MENU_WIDTH,
                  transform: [{ translateX: slideAnim }],
                }}
              >
                <MenuComponent />
              </Animated.View>

              <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                <View style={{ flex: 1 }} />
              </TouchableWithoutFeedback>
            </View>
          </Portal>
        )}
        {/* Área invisível para detectar swipe da borda */}
        {!menuVisible && forms.behavior === "update" && (
          <View
            {...panResponder.panHandlers}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 20,
              height: "100%",
              zIndex: 9998,
            }}
          />
        )}
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {avatar ? (
            <Avatar.Image
              size={80}
              source={{ uri: avatar }}
              style={{
                borderColor: "1px solid #fff",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            />
          ) : (
            <Avatar.Icon size={80} icon="account-edit" />
          )}
        </TouchableOpacity>

        <Text style={styles.welcomeText}>
          {forms.behavior === "update"
            ? `Olá, ${form?.nome} ${form?.sobrenome}`
            : "Seja bem-vindo!"}
        </Text>
        {forms.behavior !== "update" ? (
          <Text style={{ ...styles.welcomeText, fontSize: 16 }}>
            {form?.nome
              ? `${form?.nome} ${form?.sobrenome}, complete seu cadastro:`
              : "Complete seu cadastro:"}
          </Text>
        ) : (
          <Text style={{ ...styles.welcomeText, fontSize: 16 }}>
            Vereifique seus dados antes de alterá-los:
          </Text>
        )}
        <View style={styles.form}>
          {!user?.firstName && (
            <TextInput
              label="Nome"
              value={form?.nome}
              onChangeText={(text) => {
                setCliente("nome", text);
                handleChange("nome", text);
              }}
              style={styles.input}
            />
          )}
          {!user?.lastName && (
            <TextInput
              label="Sobrenome"
              value={form?.sobrenome}
              onChangeText={(text) => {
                setCliente("sobrenome", text), handleChange("sobrenome", text);
              }}
              style={styles.input}
            />
          )}
          <TextInput
            label="Telefone"
            value={form.telefone}
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="(19) 98195-5602"
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 11);
              const formatted = new AsYouType("BR").input(text);

              setCliente("telefone", {
                ...cliente.telefone,
                numero: digits,
              });

              handleChange("telefone", formatted);
              setFoneError(null); // limpa erro enquanto digita
            }}
            onBlur={() => {
              const raw = form.telefone.replace(/\D/g, ""); // só números
              const valid = isValidPhoneNumber("+55" + raw, "BR");

              if (!valid) {
                setFoneError("Telefone inválido");
              } else {
                setFoneError(null);
              }
            }}
            error={!!foneError}
          />
          {foneError && (
            <Text
              style={{
                color: themeX.colors.alert,
                marginTop: -10,
                marginBottom: 10,
              }}
            >
              {foneError}
            </Text>
          )}
          <TextInput
            label="CPF"
            value={form.cpf}
            style={styles.input}
            keyboardType="numeric"
            placeholder="000.000.000-00"
            disabled={forms?.behavior === "update"}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 11);
              const formatted = formatCPF(digits);
              setCliente("identificacao", {
                ...cliente.identificacao,
                numero: digits,
              });
              handleChange("cpf", formatted);
              setCpfError(null); // limpa erro enquanto digita
            }}
            onBlur={() => {
              if (!isValidCPF(form.cpf)) {
                setCpfError("CPF inválido");
              } else {
                setCpfError(null);
              }
            }}
            error={!!cpfError}
          />
          {cpfError && (
            <Text
              style={{
                color: themeX.colors.alert,
                marginTop: -10,
                marginBottom: 10,
              }}
            >
              {cpfError}
            </Text>
          )}
          <TextInput
            label="Data de nascimento"
            value={form?.dataNascimento}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 8);
              const dataIso = formatDateToISO(digits);
              const formatted = formatDate(digits);
              setCliente("dataNascimento", dataIso);
              handleChange("dataNascimento", formatted);
              setBirthDateError(null);
            }}
            onBlur={() => {
              if (!isValidBirthDate(form?.dataNascimento)) {
                setBirthDateError("Data de nascimento inválida");
              } else {
                setBirthDateError(null);
              }
            }}
            placeholder="DD/MM/AAAA"
            style={styles.input}
            keyboardType="numeric"
            error={!!birthDateError}
          />
          {birthDateError && (
            <Text
              style={{
                color: themeX.colors.alert,
                marginTop: -10,
                marginBottom: 10,
              }}
            >
              {birthDateError}
            </Text>
          )}
          <TextInput
            label="CEP"
            value={form.cep}
            placeholder="13484-299"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 8);
              const formatted = formatCEP(digits);
              setCliente("endereco", {
                ...cliente.endereco,
                cep: digits,
              });
              handleChange("cep", formatted);
              setCepError(null); // limpa erro enquanto digita
            }}
            onBlur={async () => {
              const unmasked = form.cep.replace(/\D/g, "");

              if (unmasked.length === 8) {
                const endereco = await buscarEndereco(unmasked);

                if (endereco && !endereco.erro) {
                  setForm((prev) => ({
                    ...prev,
                    street: endereco.logradouro || "",
                    city: endereco.localidade || "",
                    neighborhood: endereco.bairro || "",
                  }));
                  setCliente("endereco", {
                    ...cliente.endereco,
                    cep: unmasked,
                    logradouro: endereco.logradouro || "",
                    bairro: endereco.bairro || "",
                    cidade: {
                      nome: endereco.localidade || "",
                    },
                  });
                  setEnderecoPreenchido(true);
                  setCepError(null);
                } else {
                  setEnderecoPreenchido(false);
                  setCepError("CEP não encontrado.");
                }
              } else {
                setEnderecoPreenchido(false);
                setCepError("CEP incompleto.");
              }
            }}
            error={!!cepError}
          />
          {cepError && (
            <Text
              style={{
                color: themeX.colors.alert,
                marginTop: -10,
                marginBottom: 10,
              }}
            >
              {cepError}
            </Text>
          )}
          <TextInput
            label="Número"
            value={form.numero}
            placeholder="139"
            keyboardType="numeric"
            onChangeText={(text) => {
              setCliente("endereco", {
                ...cliente.endereco,
                numero: text,
              });
              handleChange("numero", text);
            }}
            style={styles.input}
          />
          <TextInput
            label="Logradouro"
            placeholder="Rua Armindo Tank"
            value={form.street}
            onChangeText={(text) => {
              setCliente("endereco", {
                ...cliente.endereco,
                logradouro: text,
              });
              handleChange("street", text);
            }}
            style={styles.input}
            disabled={enderecoPreenchido}
          />
          <TextInput
            label="Cidade"
            placeholder="Limeira"
            value={form.city}
            onChangeText={(text) => {
              setCliente("endereco", {
                ...cliente.endereco,
                cidade: {
                  ...cliente.endereco.cidade,
                  nome: text,
                },
              });
              handleChange("city", text);
            }}
            style={styles.input}
            disabled={enderecoPreenchido}
          />
          <TextInput
            label="Bairro"
            placeholder="Vila Anita"
            value={form.neighborhood}
            onChangeText={(text) => {
              setCliente("endereco", {
                ...cliente.endereco,
                bairro: text,
              });
              handleChange("neighborhood", text);
            }}
            style={styles.input}
            disabled={enderecoPreenchido}
          />
          <Box
            justify="space-between"
            align="center"
            hasPadding
            removePaddingBottom
          >
            <Button
              icon="gender-male"
              mode={selectedGender === "male" ? "contained" : "outlined"}
              onPress={() => {
                setSelectedGender("male");
                setCliente("sexo", "M");
              }}
            >
              Homem
            </Button>
            <Button
              icon="gender-female"
              mode={selectedGender === "female" ? "contained" : "outlined"}
              onPress={() => {
                setSelectedGender("female"), setCliente("sexo", "F");
              }}
            >
              Mulher
            </Button>
            <Button
              icon="gender-non-binary"
              mode={selectedGender === "other" ? "contained" : "outlined"}
              onPress={() => {
                setSelectedGender("other"), setCliente("sexo", "O");
              }}
            >
              Outro
            </Button>
          </Box>
        </View>

        <Button
          mode="contained"
          onPress={() => {
            forms.behavior === "create"
              ? dispatch(addCliente())
              : dispatch(updateCadastro());
          }}
          style={styles.button}
        >
          {forms.behavior === "update" ? "Salvar Alterações" : "Cadastrar"}
        </Button>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 20 : 120,
  },
  avatarContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginBottom: 5,
    marginTop: 10,
  },
  form: {
    gap: 10,
  },
  input: {
    backgroundColor: "white",
  },
  button: {
    marginTop: 20,
  },
});
