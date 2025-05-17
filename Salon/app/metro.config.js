// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Passo 1: Obter a configuração base do Expo
let config = getDefaultConfig(__dirname);

// Passo 3: Adicionar suporte ao Reanimated
config = wrapWithReanimatedMetroConfig(config);

// Passo 2: Adicionar suporte ao NativeWind
config = withNativeWind(config, { input: "./app/globals.css" });

module.exports = config;
