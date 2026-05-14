import { useState, useCallback, useMemo } from 'react';
import { Button, CircularProgress, useMediaQuery } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
// import FacebookIcon from '@mui/icons-material/Facebook';
// import AppleIcon from '@mui/icons-material/Apple';
import { useSignIn } from '@clerk/clerk-react';

const STRATEGY_MAP = {
  facebook: 'oauth_facebook',
  google: 'oauth_google',
  apple: 'oauth_apple',
};

const BUTTON_TEXT_MAP = {
  facebook: 'Entrar com Facebook',
  google: 'Entrar com Google',
  apple: 'Entrar com Apple',
};

const SocialButton = ({ strategy, icon: Icon, color }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useSignIn();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const oauthStrategy = useMemo(
    () => STRATEGY_MAP[strategy] || 'oauth_facebook',
    [strategy]
  );

  const getButtonText = () => {
    if (isLoading) return 'Carregando...';
    return BUTTON_TEXT_MAP[strategy] || 'Entrar';
  };

  const onSocialLoginPress = useCallback(async () => {
    try {
      setIsLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: oauthStrategy,
        redirectUrl: '/sign-in',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('Error during social login:', err);
      setIsLoading(false);
    }
  }, [signIn, oauthStrategy]);

  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={
        isLoading ? (
          <CircularProgress size={20}  color={prefersDarkMode ? "#fff" : "inherit"} />
        ) : (
          <Icon sx={{ color }} />
        )
      }
      onClick={onSocialLoginPress}
      disabled={isLoading}
      sx={{ mb: 1,  color: prefersDarkMode ? "var(--primary-light)" : "var(--primary)" }}
    >
      {getButtonText()}
    </Button>
  );
};

const SocialButtons = () => {
  return (
    <>
      <SocialButton strategy="google" icon={GoogleIcon} color="#DB4437" />
      {/* <SocialButton strategy="facebook" icon={FacebookIcon} color="#1977F3" /> */}
      {/* <SocialButton strategy="apple" icon={AppleIcon} color="#000000" /> */}
    </>
  );
};

export default SocialButtons;