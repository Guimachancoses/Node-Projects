import React, { useState, useCallback } from 'react';
import { Button, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
//import AppleIcon from '@mui/icons-material/Apple';
import { useSignIn } from '@clerk/clerk-react';

const SocialButton = ({ strategy, icon: Icon, color }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useSignIn();

  const getStrategy = () => {
    switch (strategy) {
      case 'facebook':
        return 'oauth_facebook';
      case 'google':
        return 'oauth_google';  
      case 'apple':
        return 'oauth_apple';
      default:
        return 'oauth_facebook';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Carregando...';
    switch (strategy) {
      case 'facebook':
        return 'Entrar com Facebook';
      case 'google':
        return 'Entrar com Google';
      case 'apple':
        return 'Entrar com Apple';
      default:
        return 'Entrar';
    }
  };

  const onSocialLoginPress = useCallback(async () => {
    try {
      setIsLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: getStrategy(),
        redirectUrl: '/sign-in',
        redirectUrlComplete: '/'
      });
    } catch (err) {
      console.error('Error during social login:', err);
      setIsLoading(false);
    }
  }, [signIn, strategy]);

  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={
        isLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <Icon sx={{ color: color }} />
        )
      }
      onClick={onSocialLoginPress}
      disabled={isLoading}
      sx={{ mb: 1 }}
    >
      {getButtonText()}
    </Button>
  );
};

const SocialButtons = () => {
  return (
    <>
      <SocialButton 
        strategy="google"
        icon={GoogleIcon}
        color="#DB4437"
      />
      <SocialButton
        strategy="facebook" 
        icon={FacebookIcon}
        color="#1977F3"
      />
      {/* <SocialButton
        strategy="apple"
        icon={AppleIcon} 
        color="#000000"
      /> */}
    </>
  );
};

export default SocialButtons;
