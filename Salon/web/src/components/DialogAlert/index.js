import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function CustomDialog({
  open = false,
  title = 'Título do Diálogo',
  content = 'Conteúdo do diálogo aqui.',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onClose = () => {},
  onConfirm = () => {},
  isDelete = false,  // Adiciona esta prop para identificar se é uma ação de excluir
}) {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-describedby="dialog-slide-description"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="dialog-slide-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="default" // Botão de cancelar com cor padrão
        >
          {cancelLabel}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={isDelete ? 'error' : 'error'} // Se for delete, usa 'error' (vermelho), senão 'primary'
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
