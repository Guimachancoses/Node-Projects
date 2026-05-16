import React from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import SecurityIcon from "@mui/icons-material/Security";
import GavelIcon from "@mui/icons-material/Gavel";

import capaFundo from "../../assets/capa_fundo.png";

const empresa = {
  razaoSocial: "GUIMAC TECH SOLUTIONS LTDA",
  cnpj: "66.472.231/0001-06",
  endereco:
    "R Laurentina de Sampaio Sar, 310, Apt 127, Chácaras Antonieta, Limeira/SP, CEP 13.484-501",
  emailContato: "guilherme.machancoses@gmail.com",
  telefone: "(19) 8195-5602",
  situacao: "Ativa",
};

const secoes = [
  {
    titulo: "1. Controlador dos Dados",
    texto: `O controlador dos dados pessoais é ${empresa.razaoSocial}, CNPJ ${empresa.cnpj}, com sede em ${empresa.endereco}.`,
  },
  {
    titulo: "2. Dados Coletados",
    texto:
      "Podemos coletar dados de identificação e contato (nome, e-mail, telefone), dados de uso da plataforma, dados de autenticação e informações necessárias para prestação dos serviços contratados.",
  },
  {
    titulo: "3. Finalidades do Tratamento",
    texto:
      "Tratamos dados para: (i) operar a plataforma; (ii) autenticar usuários; (iii) fornecer suporte técnico; (iv) cumprir obrigações legais/regulatórias; (v) prevenir fraudes e incidentes de segurança; (vi) melhorar a experiência do usuário.",
  },
  {
    titulo: "4. Bases Legais (LGPD)",
    texto:
      "O tratamento ocorre com base em hipóteses legais da LGPD, incluindo: execução de contrato, cumprimento de obrigação legal/regulatória, legítimo interesse e, quando aplicável, consentimento.",
  },
  {
    titulo: "5. Compartilhamento com Terceiros",
    texto:
      "Os dados podem ser compartilhados com operadores e parceiros estritamente necessários para a operação da plataforma (ex.: hospedagem, autenticação, integrações), sempre observando padrões de segurança e confidencialidade.",
  },
  {
    titulo: "6. Cookies e Tecnologias Semelhantes",
    texto:
      "Podemos utilizar cookies necessários para funcionamento, segurança e desempenho. Cookies analíticos/marketing, quando aplicáveis, devem respeitar preferências do usuário e transparência nas finalidades.",
  },
  {
    titulo: "7. Retenção e Eliminação",
    texto:
      "Os dados são mantidos pelo período necessário às finalidades informadas, cumprimento de obrigações legais e exercício regular de direitos. Após esse período, os dados são eliminados ou anonimizados, quando possível.",
  },
  {
    titulo: "8. Direitos do Titular",
    texto:
      "Nos termos da LGPD, o titular pode solicitar: confirmação de tratamento, acesso, correção, anonimização/bloqueio/eliminação, portabilidade, informação sobre compartilhamento, revogação de consentimento e oposição, quando cabível.",
  },
  {
    titulo: "9. Canal do Titular",
    texto: `Solicitações sobre dados pessoais devem ser enviadas para ${empresa.emailContato}. Para agilizar, informe nome completo, e-mail cadastrado e descrição da solicitação.`,
  },
  {
    titulo: "10. Segurança da Informação",
    texto:
      "Adotamos medidas técnicas e administrativas razoáveis para proteger dados pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida.",
  },
  {
    titulo: "11. Transferência Internacional",
    texto:
      "Caso haja transferência internacional de dados, adotaremos medidas compatíveis com a LGPD e mecanismos adequados de proteção.",
  },
  {
    titulo: "12. Alterações desta Política",
    texto:
      "Esta Política pode ser atualizada periodicamente. A versão vigente será publicada nesta página com data de atualização.",
  },
  {
    titulo: "13. Legislação Aplicável",
    texto:
      "Esta Política é regida pela legislação brasileira, em especial a Lei nº 13.709/2018 (LGPD), o Marco Civil da Internet e normas correlatas.",
  },
];

const PoliticaDePrivacidade = () => {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundImage: `url(${capaFundo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: { xs: "scroll", md: "fixed" },
        padding: 5
      }}
    >
      {/* Botão no extremo superior esquerdo */}
      <Tooltip title="Voltar para início">
        <IconButton
          component={RouterLink}
          to="/"
          sx={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 9999,
            bgcolor: "#fff",
            color: "#000",
            boxShadow: 2,
            "&:hover": {
              bgcolor: "#fff",
              color: "var(--primary)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      <Container maxWidth="md">
        <Card elevation={6} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box
            sx={{
              p: 3,
              color: "#fff",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <PrivacyTipIcon />
              <Typography variant="h4" fontWeight={700}>
                Política de Privacidade
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Chip icon={<GavelIcon />} label="LGPD" size="small" sx={{ color: "#fff" }} />
              <Chip icon={<SecurityIcon />} label="Proteção de dados" size="small" sx={{ color: "#fff" }} />
            </Stack>
          </Box>

          <CardContent sx={{ p: 3, background: "#000", color: "#fff" }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Esta política foi estruturada para boas práticas de conformidade. Recomendamos revisão jurídica antes da publicação final.
            </Alert>

            {secoes.map((s, i) => (
              <Box key={s.titulo} sx={{ mb: i === secoes.length - 1 ? 0 : 2.5 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {s.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, color: "#CBD5E1" }}>
                  {s.texto}
                </Typography>
                {i !== secoes.length - 1 && <Divider sx={{ mt: 2.5 }} />}
              </Box>
            ))}

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" color="text.secondary" display="block" sx={{ color: "#CBD5E1" }}>
              <strong>{empresa.razaoSocial}</strong> — CNPJ {empresa.cnpj}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ color: "#CBD5E1" }}>
              Endereço: {empresa.endereco}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ color: "#CBD5E1" }}>
              Contato: {empresa.emailContato} | {empresa.telefone}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ color: "#CBD5E1" }}>
              Situação cadastral: {empresa.situacao}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default PoliticaDePrivacidade;