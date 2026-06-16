import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { PrimaryButton } from "../../components/primary-button";
import { RatingOption } from "../../components/rating-option";
import { getResponsiveLayout } from "../../constants/layout";
import { theme } from "../../constants/theme";
import {
  createAvaliacaoRequest,
  resetAvaliacaoStatus,
} from "../../store/modules/avaliacao/action";
import { RatingOption as RatingValue } from "../../store/modules/avaliacao/types";
import { RootState } from "../../store/modules/rootReducer";

const options = [
  {
    id: "excelente",
    icon: "😍",
    title: "Excelente",
    description: "Sabor, temperatura e apresentação estavam ótimos.",
  },
  {
    id: "boa",
    icon: "🙂",
    title: "Boa",
    description: "A refeição estava agradável e bem servida.",
  },
  {
    id: "regular",
    icon: "😐",
    title: "Regular",
    description: "Atendeu, mas poderia melhorar em alguns pontos.",
  },
  {
    id: "ruim",
    icon: "🙁",
    title: "Ruim",
    description: "A experiência não foi satisfatória hoje.",
  },
];

const negativeReasons = [
  "Comida estava fria",
  "Pouca variedade",
  "Tempero fraco",
  "Muito salgado",
  "Pouca quantidade",
  "Fila demorada",
  "Bebida ruim",
  "Sobremesa insuficiente",
  "Apresentação da comida",
  "Opções repetidas",
];

export default function AvaliarScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.avaliacao);

  const [selected, setSelected] = useState<RatingValue | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const isLandscape = width > 900;
  const showReasons = selected === "regular" || selected === "ruim";

  useEffect(() => {
    dispatch(resetAvaliacaoStatus());
  }, [dispatch]);

  function toggleReason(reason: string) {
    setSelectedReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason]
    );
  }

  function handleSubmit() {
    if (!selected) return;

    dispatch(createAvaliacaoRequest({
      rating: selected,
      reasons: selectedReasons,
      comment: comment.trim(),
    }));
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: layout.pagePadding,
        paddingTop: isLandscape ? 18 : 24,
        paddingBottom: isLandscape ? 18 : 24,
        gap: isLandscape ? 16 : 18,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ gap: 14 }}>
        <View style={{ alignItems: "flex-start", justifyContent: "center" }}>
        <Image
          source={require("../../../assets/images/garbofood.png")}
          style={{ width: layout.isLandscape ? 180 : 180, height: layout.isLandscape ? 180 : 180, marginBottom: layout.isLandscape ? -70 : -50, marginLeft: -10, marginTop: -50 }}
          contentFit="contain"
        />
        </View>

        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: isLandscape ? 36 : 34,
              fontWeight: "900",
              color: theme.colors.text,
              lineHeight: isLandscape ? 40 : 38,
            }}
          >
            Escolha sua avaliação
          </Text>

          <Text style={{ fontSize: 18, color: theme.colors.muted, lineHeight: 25 }}>
            Toque na opção que melhor representa sua experiência.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: isLandscape ? "row" : "column", gap: 14 }}>
        {options.map((option) => (
          <RatingOption
            key={option.id}
            {...option}
            selected={selected === option.id}
            onPress={() => {
              setSelected(option.id as RatingValue);

              if (option.id !== "regular" && option.id !== "ruim") {
                setSelectedReasons([]);
              }
            }}
          />
        ))}
      </View>

      {showReasons && (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: theme.colors.text }}>
            O que poderia melhorar?
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {negativeReasons.map((reason) => {
              const checked = selectedReasons.includes(reason);

              return (
                <Pressable
                  key={reason}
                  onPress={() => toggleReason(reason)}
                  style={({ pressed }) => ({
                    paddingVertical: 9,
                    paddingHorizontal: 13,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: checked ? theme.colors.primary : theme.colors.border,
                    backgroundColor: checked ? "#E7F0EA" : "#FFFFFF",
                    opacity: pressed ? 0.86 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: checked ? theme.colors.primary : theme.colors.muted,
                    }}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Deseja deixar algum comentário? Opcional"
        placeholderTextColor={theme.colors.muted}
        multiline
        style={{
          minHeight: isLandscape ? 88 : 110,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: 20,
          fontSize: 17,
          borderWidth: 1,
          borderColor: theme.colors.border,
          color: theme.colors.text,
          textAlignVertical: "top",
        }}
      />

      {error && (
        <Text
          style={{
            color: "#B42318",
            fontSize: 15,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      )}

      <PrimaryButton
        title={loading ? "Enviando..." : "Enviar avaliação"}
        onPress={handleSubmit}
        disabled={!selected || loading}
      />
    </ScrollView>
  );
}
