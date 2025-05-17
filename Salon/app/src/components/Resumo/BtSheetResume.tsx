import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet,} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetHandleProps,
} from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";
import { toRad } from "react-native-redash";
import { useSelector, useDispatch } from "react-redux";


import {
  updateForm,
} from "../../store/modules/salao/actions";
import DetalheHeader from "./DetalheHeader";
import Details from "./DatalheAg/details";
import { resetAgendamento } from "@/src/store/modules/cliente/action";
import { useTheme } from "react-native-paper";

// Função para manipular a origem da transformação
export const transformOrigin = (
  { x, y }: { x: number; y: number },
  ...transformations: Animated.AnimateStyle<any>[]
) => {
  "worklet";
  return [
    { translateX: x },
    { translateY: y },
    ...transformations,
    { translateX: x * -1 },
    { translateY: y * -1 },
  ];
};

// Handle customizado
const Handle: React.FC<BottomSheetHandleProps> = ({ animatedIndex }) => {
  const indicatorTransformOriginY = useDerivedValue(() =>
    interpolate(animatedIndex.value, [0, 1, 2], [-1, 0, 1], Extrapolate.CLAMP)
  );

  const leftIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const leftIndicatorRotate = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [toRad(-30), 0, toRad(30)],
      Extrapolate.CLAMP
    );
    return {
      transform: transformOrigin(
        { x: 0, y: indicatorTransformOriginY.value },
        { rotate: `${leftIndicatorRotate}rad` },
        { translateX: -5 }
      ),
    };
  });

  const rightIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const rightIndicatorRotate = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [toRad(30), 0, toRad(-30)],
      Extrapolate.CLAMP
    );
    return {
      transform: transformOrigin(
        { x: 0, y: indicatorTransformOriginY.value },
        { rotate: `${rightIndicatorRotate}rad` },
        { translateX: 5 }
      ),
    };
  });

  return (
    <Animated.View style={[styles.header]}>
      <Animated.View
        style={[
          styles.indicator,
          styles.leftIndicator,
          leftIndicatorAnimatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.indicator,
          styles.rightIndicator,
          rightIndicatorAnimatedStyle,
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent", // Mantendo o fundo transparente
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "transparent", // Mantendo o border-bottom transparente
    margin: 0,
  },
  indicator: {
    position: "absolute",
    width: 10,
    height: 4,
    backgroundColor: "#999",
  },
  leftIndicator: {
    borderTopStartRadius: 2,
    borderBottomStartRadius: 2,
  },
  rightIndicator: {
    borderTopEndRadius: 2,
    borderBottomEndRadius: 2,
  },
  headerContainer: {
    padding: 20,
    width: "100%",
    height: "auto",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

export default function BtSheetResume() {
  const dispatch = useDispatch();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const { form } = useSelector(
    (state: any) => state.salao
  );
  const { colors } = useTheme();

  // SnapPoints dinâmicos: menores se for buttonCard
  const snapPoints = useMemo(() => {
    if (form.buttonCard) {
      return [495]; // Apenas um snap menor para ComoPagar
    }
    return [94, Dimensions.get("window").height - 110]; // Tamanho padrão
  }, [form.buttonCard]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      dispatch(updateForm({ buttomSheetDt: 0, buttonCard: false }));
      dispatch(resetAgendamento());
    }
  }, []);

  useEffect(() => {
    if (form?.buttomSheetDt) {
      bottomSheetRef.current?.snapToIndex(0); // ou 1 dependendo do snap desejado
    } else {
      bottomSheetRef.current?.close();
    }
  }, [form?.buttomSheetDt]);


  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Começa fechado
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "transparent" }}
        handleComponent={Handle} // Passando o handle customizado
      >
        <DetalheHeader />
        <BottomSheetView style={{flex: 1 ,backgroundColor: colors.background }}>
          <ScrollView>
            <Details />
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
