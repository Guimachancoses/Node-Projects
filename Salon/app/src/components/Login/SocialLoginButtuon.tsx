import { useSSO, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

import { Box, Touchable, Text } from "@/src/styles";
import theme from "@/src/styles/theme.json";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

type SocialStrategy = "facebook" | "google" | "apple";

const SocialLoginButton = ({
  strategy,
  background,
  border,
}: {
  strategy: SocialStrategy;
  background: keyof typeof theme.colors | "light";
  border: keyof typeof theme.colors | "light";
}) => {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const getStrategy = () => {
    switch (strategy) {
      case "facebook":
        return "oauth_facebook";
      case "google":
        return "oauth_google";
      case "apple":
        return "oauth_apple";
      default:
        return "oauth_facebook"; // ou undefined, ou lançar erro, dependendo do seu caso
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const getButtonText = () => {
    if (isLoading) return "Carregando...";
    switch (strategy) {
      case "facebook":
        return "Entrar com o Facebook";
      case "google":
        return "Entrar com o Google";
      case "apple":
        return "Entrar com Apple";
      default:
        return "Entrar";
    }
  };

  const getButtonIcon = () => {
    switch (strategy) {
      case "facebook":
        return (
          <Ionicons
            name="logo-facebook"
            size={30}
            style={{ marginRight: 10 }}
            color="#1977F3"
          />
        );
      case "google":
        return (
          <Ionicons
            name="logo-google"
            size={30}
            style={{ marginRight: 10 }}
            color="#DB4437"
          />
        );
      case "apple":
        return (
          <Ionicons
            name="logo-apple"
            size={30}
            style={{ marginRight: 10 }}
            color="black"
          />
        );
      default:
        return null;
    }
  };

  const onSocialLoginPress = useCallback(async () => {
    try {
      setIsLoading(true);
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: getStrategy(),
          // For web, defaults to current path
          // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
          // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
          redirectUrl: AuthSession.makeRedirectUri({
            scheme: "parrudus-app",
            path: "sign-in", // opcional
          }),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        setIsLoading(false);
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      setIsLoading(false);
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      //console.error(JSON.stringify(err, null, 2));
    }
  }, []);

  return (
    <Box

      hasPadding
      width="100%"
      align="center"
      justify="center"
      removePaddingBottom
    >
      <Touchable
        width="300px"
        height="45px"
        rounded="5px"
        background={theme.colors[background]}
        border={theme.colors[border]}
        align="center"
        justify="center"
        direction="row"
        onPress={onSocialLoginPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="black" style={{ marginRight: 15 }} />
        ) : (
          getButtonIcon()
        )}
        <Text small bold color="muted">
          {getButtonText()}
        </Text>
        <View />
      </Touchable>
    </Box>
  );
};

export default SocialLoginButton;
