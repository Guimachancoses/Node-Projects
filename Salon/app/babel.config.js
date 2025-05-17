module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-paper/babel",
      "react-native-reanimated/plugin", // sempre o último
      [
        "module:react-native-dotenv", {
          moduleName: "@env",
          path: ".env",
        }
      ]
    ],
  };
};
