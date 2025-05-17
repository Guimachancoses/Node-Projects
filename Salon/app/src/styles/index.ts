import styled from "styled-components/native";
import theme from "./theme.json";
import {
  ImageProps as RNImageProps,
  ImageSourcePropType,
  ImageBackground,
  ImageResizeMode,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import util from "@/src/constants/util";

import {
  Text as TextPaper,
  Title as TitlePaper,
  Badge as BadgePaper,
  Button as ButtonPaper,
  TextInput as TextInputPaper,
} from "react-native-paper";

interface CoverProps extends RNImageProps {
  customWidth?: number | string;
  customHeight?: number | string;
  spacing?: string;
  border?: string;
  circle?: boolean;
  image?: ImageSourcePropType; // <-- Corrigido aqui
  backgroundColor?: string;
  resizeMode?: ImageResizeMode;
}

export const Cover = styled(ImageBackground).attrs<CoverProps>((props) => ({
  source:
    typeof props.image === "string"
      ? { uri: props.image }
      : props.image || undefined,
  resizeMode: props.resizeMode || "contain", // <-- AQUI
}))<CoverProps>`
  width: ${(props) =>
    typeof props.customWidth === "number"
      ? `${props.customWidth}px`
      : props.customWidth || "60px"};
  height: ${(props) =>
    typeof props.customHeight === "number"
      ? `${props.customHeight}px`
      : props.customHeight || "60px"};
  border-radius: ${(props) => {
    const width =
      typeof props.customWidth === "number"
        ? props.customWidth
        : parseInt(props.customWidth || "60", 10);
    return props.circle ? `${width / 2}px` : "3px";
  }};
  margin: ${(props) => props.spacing || "0 0 0 0"};
  border: ${(props) => props.border || "none"};
  background-color: ${(props) => props.backgroundColor || ""};
  overflow: hidden;
  align-self: center;
`;

interface BadgeProps {
  color?: keyof typeof theme.colors;
}

export const Badge = styled(BadgePaper)<BadgeProps>`
  align-self: flex-start;
  font-size: 16px;
  width: auto;
  height: auto;
  padding: 5px 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  background: ${(props) => theme.colors[props.color || "danger"]};
`;

interface TitleProps {
  color?: keyof typeof theme.colors | string;
  small?: string | number | boolean;
  hasPadding?: string;
  align?: string;
}

export const Title = styled(TitlePaper)<TitleProps>`
  color: ${(props) =>
    theme.colors[props.color as keyof typeof theme.colors] || props.color || theme.colors.dark};
  font-size: ${(props) => (props.small ? "22px" : "30px")};
  padding: ${(props) => (props.hasPadding ? "20px" : "0px")};
  letter-spacing: -0.8px;
  line-height: ${(props) => (props.small ? "22px" : "30px")};
  text-align: ${(props) => props.align || "left"};
`;

interface TextProps {
  color?: keyof typeof theme.colors | string;
  small?: boolean;
  hasPadding?: boolean;
  align?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  spacing?: string;
  composed?: boolean;
  underline?: boolean;
  removePaddingBottom?: boolean;
}

export const Text = styled(TextPaper).attrs({})<TextProps>`
  color: ${(props) =>
    theme.colors[props.color as keyof typeof theme.colors] ||
    props.color ||
    theme.colors.muted};
  font-size: ${(props) => (props.small ? "13px" : "17px")};
  font-family: ${(props) => (props.bold ? "Ubuntu-Bold" : "Ubuntu-Light")};
  margin: ${(props) => props.spacing || 0};
  padding: ${(props) => (props.hasPadding ? "20px" : "0px")};
  line-height: ${(props) =>
    props.composed ? "30px" : props.small ? "13px" : "15px"};
  text-decoration: ${(props) => (props.underline ? "underline" : "none")};
  opacity: 0.7;
  text-align: ${(props) => props.align || "left"};
  padding-bottom: ${(props) =>
    props.removePaddingBottom ? "0px" : props.hasPadding ? "20px" : "0px"};
`;

interface BoxProps {
  wrap?: string;
  align?: string;
  hasPadding?: boolean;
  spacing?: string | number | boolean;
  direction?: string;
  justify?: string;
  width?: string | number | boolean;
  height?: string;
  removePaddingBottom?: boolean;
  removePaddingTop?: boolean;
  radius?: number;
  border?: string;
  background?: keyof typeof theme.colors | string;
  position?: "absolute" | "relative";
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
}

export const Box = styled.View<BoxProps>`
  flex-wrap: ${(props) => props.wrap || "nowrap"};
  flex-direction: ${(props) => props.direction || "row"};
  justify-content: ${(props) => props.justify || "flex-start"};
  align-items: ${(props) => props.align || "flex-start"};
  width: ${(props) => {
    if (typeof props.width === "number") return `${props.width}px`;
    if (typeof props.width === "boolean") return props.width ? "100%" : "auto";
    return props.width || "100%";
  }};
  height: ${(props) => props.height || "auto"};
  max-height: ${(props) => props.height || "auto"};
  padding: ${(props) => (props.hasPadding ? "20px" : "0px")};
  padding-bottom: ${(props) =>
    props.removePaddingBottom ? "0px" : props.hasPadding ? "20px" : "0px"};
  padding-top: ${(props) =>
    props.removePaddingTop ? "0px" : props.hasPadding ? "20px" : "0px"};
  margin: ${(props) => (props.spacing ? `${props.spacing}px` : "0")};
  border-radius: ${(props) => (props.radius ? `${props.radius}px` : "0")};
  border: ${(props) => props.border || "none"};
  background: ${(props) =>
    theme.colors[props.background as keyof typeof theme.colors] ||
    props.background ||
    "transparent"};
  position: ${(props) => props.position || "relative"};
  top: ${(props) => props.top || "auto"};
  right: ${(props) => props.right || "auto"};
  bottom: ${(props) => props.bottom || "auto"};
  left: ${(props) => props.left || "auto"};
  z-index: ${(props) => props.zIndex || 0};
`;

interface TouchableProps {
  direction?: string;
  justify?: string;
  align?: string;
  width?: string;
  height?: string;
  hasPadding?: boolean;
  spacing?: string;
  background?: keyof typeof theme.colors | string;
  rounded?: number | string;
  border?: string | number | boolean;
  removePaddingBottom?: boolean;
}

export const Touchable = styled(TouchableOpacity)<TouchableProps>`
  flex-direction: ${(props) => props.direction || "row"};
  justify-content: ${(props) => props.justify || "flex-start"};
  align-items: ${(props) => props.align || "flex-start"};
  width: ${(props) => props.width || "100%"};
  height: ${(props) => props.height || "auto"};
  padding: ${(props) => (props.hasPadding ? "20px" : "0px")};
  margin: ${(props) => props.spacing || 0};
  background: ${(props) =>
    theme.colors[props.background as keyof typeof theme.colors] ||
    props.background ||
    "transparent"};
  border-radius: ${(props) => props.rounded || 0};
  padding-bottom: ${(props) =>
    props.removePaddingBottom ? "0px" : props.hasPadding ? "20px" : "0px"};
  border: ${(props) => {
    if (typeof props.border === "string") {
      // substitui nomes de cores por valores do tema se possível
      return props.border.replace(/primary|muted/g, (match) => {
        return theme.colors[match as keyof typeof theme.colors] || match;
      });
    }
    if (typeof props.border === "number") {
      return `${props.border}px solid ${theme.colors.primary}`;
    }
    if (props.border === true) {
      return `1px solid ${theme.colors.primary}`;
    }
    return "none";
  }};
`;

function isThemeColorKey(color: string): color is keyof typeof theme.colors {
  return color in theme.colors;
}

interface CustomButtonProps {
  background?: keyof typeof theme.colors | string;
  textColor?: keyof typeof theme.colors;
  block?: boolean;
}

// NÃO deixar textColor ser repassado para ButtonPaper
export const Button = styled(ButtonPaper)
  .withConfig({
    shouldForwardProp: (prop) =>
      !["textColor", "background", "block"].includes(prop),
  })
  .attrs<CustomButtonProps>((props) => {
    const buttonColor =
      props.background && isThemeColorKey(props.background)
        ? theme.colors[props.background]
        : props.background;

    const resolvedTextColor =
      props.textColor && isThemeColorKey(props.textColor)
        ? theme.colors[props.textColor]
        : theme.colors.light;

    return {
      mode: "contained",
      buttonColor,
      style: {
        width: props.block ? "100%" : "auto",
      },
      labelStyle: {
        color: resolvedTextColor,
        letterSpacing: 0,
      },
    };
  })<CustomButtonProps>`
  border-radius: 6px;
  overflow: hidden;
  width: "100%"
`;

export const TextInput = styled(TextInputPaper).attrs({
  mode: "outlined",
  theme: {
    colors: {
      placeholder: util.toAlpha(theme.colors.muted, 30),
    },
  },
})`
  height: 45px;
  width: 100%;
  font-size: 15px;
  background: ${theme.colors.light};
`;

interface SpacerProps {
  size: string;
}

export const Spacer = styled.View<SpacerProps>`
  width: 100%;
  height: ${(props) => props.size || "10px"};
`;
