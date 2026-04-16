import * as React from 'react';
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

const CustomDrawer = ({ anchor, isOpen, onClose, children }) => {
  return (
    <SwipeableDrawer
      anchor={anchor}
      open={isOpen}
      onClose={onClose}  // Certifique-se de que o onClose esteja passado corretamente
      onOpen={() => {}}
    >
      <Box
        sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 450, padding: 2 }}
        role="presentation"
        onKeyDown={(event) => {
          if (event.key === 'Esc' ) {
            onClose(); // Fechar ao pressionar Tab ou Shift
          }
        }}
      >
        {children}
      </Box>
    </SwipeableDrawer>
  );
};

export default CustomDrawer;
