import { useState } from 'react';
import { Box, TextField, Typography, Container, Paper } from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useClerk } from '@clerk/clerk-react';

export default function Account() {
  const [birthDate, setBirthDate] = useState(null);
  const { user } = useClerk();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Olá, {firstName} {lastName}
        </Typography>

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">Você está logado como:</Typography>
          <Typography variant="body2" sx={{ color: 'var(--primary)', ml: 1 }}>
            {email}
          </Typography>
        </Box>

        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="Nome"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            InputProps={{ readOnly: true }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Sobrenome"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            InputProps={{ readOnly: true }}
          />

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Data de Nascimento"
              value={birthDate}
              onChange={(newValue) => setBirthDate(newValue)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" required />
              )}
            />
          </LocalizationProvider>
        </Box>
      </Paper>
    </Container>
  );
}