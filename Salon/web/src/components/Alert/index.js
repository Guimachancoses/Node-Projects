import React from 'react';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import AlertTitle from '@mui/material/AlertTitle';

export const CustomAlert = ({
  severity = 'info',
  message = '',
  title,
  variant = 'filled',
  onClose,
}) => {
  return (
    <Stack sx={{ width: '100%' }} spacing={2}>
      <Alert variant={variant} severity={severity} onClose={onClose}>
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Stack>
  );
};
