import { ConfigContext, ExpoConfig } from "expo/config";
import { version } from "./package.json";

const EAS_PROJECT_ID = "2ad1ba95-2e53-40a6-b983-a4de97f7fe3a";
const PROJECT_SLUG = "app";
const OWNER = "gui_mac";

const APP_NAME = "Parrudus";
const BUNDLE_IDENTIFIER = "com.parrudus.app";
const PACKAGE_NAME = "com.parrudus.app";
const ICON = "./src/assets/images/Logo.png";
const SPLASH = "./src/assets/images/splash.png";
const FAVICON = "./src/assets/images/Logo.png";
const NOTIFICATION_ICON = "./src/assets/images/ic_notification.png";
const SCHEME = "parrudus-app";
const DEFAULT_COLOR = "#02555d";

export default ({ config }: ConfigContext): ExpoConfig => {
  console.log("⚙️ Building app for environment:", process.env.APP_ENV);

  const { name, bundleIdentifier, packageName, icon, adaptiveIcon, scheme } =
    getDynamicAppConfig(
      (process.env.APP_ENV as "development" | "preview" | "production") ||
        "development"
    );

  return {
    ...config,
    name,
    slug: PROJECT_SLUG,
    version,
    orientation: "portrait",
    icon,
    scheme,
    platforms: ["ios", "android", "web"],
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: SPLASH,
      resizeMode: "cover",
      backgroundColor: DEFAULT_COLOR,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor: DEFAULT_COLOR,
      },
      package: packageName,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme, host: "pagamento", pathPrefix: "/agendamentos" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [{ scheme, host: "sign-in" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: FAVICON,
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-notifications",
        {
          icon: NOTIFICATION_ICON,
          color: DEFAULT_COLOR,
          defaultChannel: "default",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: { origin: false },
      eas: { projectId: EAS_PROJECT_ID },
      ANDROID_CLIENT_ID: process.env.ANDROID_CLIENT_ID,
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      EXPO_SALAO_ID: process.env.EXPO_SALAO_ID,
      IOS_CLIENT_ID: process.env.IOS_CLIENT_ID,
      PUBLIC_MERCADO_PAGO_PUBLIC_KEY:
        process.env.PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
    },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    owner: OWNER,
  };
};

export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production"
) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      icon: ICON,
      adaptiveIcon: ICON,
      scheme: SCHEME,
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.preview`,
      packageName: `${PACKAGE_NAME}.preview`,
      icon: "./src/assets/images/Logo.png",
      adaptiveIcon: "./src/assets/images/Logo.png",
      scheme: `${SCHEME}-prev`,
    };
  }

  return {
    name: `${APP_NAME}`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}`,
    packageName: `${PACKAGE_NAME}`,
    icon: ICON,
    adaptiveIcon: ICON,
    scheme: `${SCHEME}`,
  };
};
