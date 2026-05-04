import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GavelIcon from "@mui/icons-material/Gavel";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import SecurityIcon from "@mui/icons-material/Security";

const secoes = [
  {
    titulo: "1. Aceite dos Termos",
    texto:
      "Ao acessar ou utilizar a plataforma, você declara ter lido, compreendido e concordado com estes Termos de Serviço e com a Política de Privacidade.",
  },
  {
    titulo: "2. Objeto",
    texto:
      "A plataforma oferece funcionalidades de gestão para negócios, incluindo cadastro de clientes, agendamentos, integrações e recursos operacionais.",
  },
  {
    titulo: "3. Cadastro e Responsabilidades da Conta",
    texto:
      "O usuário deve fornecer informações verdadeiras, atualizadas e completas. É responsável por manter a confidencialidade das credenciais e por toda atividade realizada em sua conta.",
  },
  {
    titulo: "4. Uso Permitido e Condutas Vedadas",
    texto:
      "É proibido utilizar a plataforma para finalidades ilícitas, fraude, violação de direitos de terceiros, envio de conteúdo malicioso, engenharia reversa ou qualquer tentativa de comprometer a segurança do sistema.",
  },
  {
    titulo: "5. Privacidade e Proteção de Dados (LGPD)",
    texto:
      "O tratamento de dados pessoais ocorre conforme a legislação aplicável, incluindo a Lei nº 13.709/2018 (LGPD). As regras detalhadas estão na Política de Privacidade da plataforma.",
  },
  {
    titulo: "6. Integrações com Terceiros",
    texto:
      "A plataforma pode integrar serviços de terceiros (ex.: agenda, armazenamento, comunicação). O uso desses serviços também pode estar sujeito aos termos e políticas dos respectivos provedores.",
  },
  {
    titulo: "7. Propriedade Intelectual",
    texto:
      "Todo o conteúdo, marca, layout, software e funcionalidades da plataforma são protegidos por direitos de propriedade intelectual, sendo vedada reprodução, distribuição ou uso não autorizado.",
  },
  {
    titulo: "8. Disponibilidade e Manutenção",
    texto:
      "Empregamos esforços para manter a plataforma disponível, mas podem ocorrer indisponibilidades temporárias por manutenção, atualização, falhas técnicas ou eventos fora do controle razoável.",
  },
  {
    titulo: "9. Limitação de Responsabilidade",
    texto:
      "Na extensão permitida por lei, a plataforma não se responsabiliza por danos indiretos, lucros cessantes ou prejuízos decorrentes de uso inadequado, falhas de terceiros ou indisponibilidades temporárias.",
  },
  {
    titulo: "10. Suspensão e Encerramento",
    texto:
      "Contas podem ser suspensas ou encerradas em caso de violação destes Termos, uso indevido ou determinação legal. O usuário também pode solicitar encerramento conforme os canais oficiais.",
  },
  {
    titulo: "11. Alterações destes Termos",
    texto:
      "Estes Termos podem ser atualizados periodicamente. A versão vigente será publicada nesta página com data de atualização. O uso continuado da plataforma após mudanças representa aceite das novas condições.",
  },
  {
    titulo: "12. Legislação e Foro",
    texto:
      "Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do controlador/empresa, salvo disposição legal específica em contrário.",
  },
  {
    titulo: "13. Contato",
    texto:
      "Em caso de dúvidas sobre estes Termos, entre em contato: gmachancoses@gmail.com | (19) 98195-5602.",
  },
];

const TermosDeServico = () => {
  return (
    <Box sx={{
      minHeight: "100vh",
      py: 6,
      backgroundImage: 'url("/images/salon-background.jpg")', // mesmo do login/fale conosco
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
    }}>
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
            bgcolor: "rgba(255,255,255,0.95)",
            "&:hover": { bgcolor: "#fff" },
            boxShadow: 2,
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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GavelIcon />
              <Typography variant="h4" fontWeight={700}>
                Termos de Serviço
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Chip icon={<PrivacyTipIcon />} label="LGPD" size="small" sx={{ color: "#fff" }} />
              <Chip icon={<SecurityIcon />} label="Boas práticas de segurança" size="small" sx={{ color: "#fff" }} />
            </Stack>
          </Box>

          <CardContent sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Este documento é um modelo robusto para publicação. Para máxima conformidade,
              recomenda-se revisão jurídica especializada conforme seu negócio.
            </Alert>

            {secoes.map((secao, idx) => (
              <Box key={secao.titulo} sx={{ mb: idx === secoes.length - 1 ? 0 : 2.5 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {secao.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {secao.texto}
                </Typography>
                {idx !== secoes.length - 1 && <Divider sx={{ mt: 2.5 }} />}
              </Box>
            ))}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default TermosDeServico;