import * as React from 'react';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

// Import images from assets
import corte1 from '../../assets/images/corte1.jpg';
import corte2 from '../../assets/images/corte2.jpg';
import corte3 from '../../assets/images/corte3.jpg';
import corte4 from '../../assets/images/corte4.jpg';
import corte5 from '../../assets/images/corte5.jpg';
import corte6 from '../../assets/images/corte6.jpg';

function srcset(image, size, rows = 1, cols = 1) {
  return {
    src: `${image}?w=${size * cols}&h=${size * rows}&fit=crop&auto=format`,
    srcSet: `${image}?w=${size * cols}&h=${
      size * rows
    }&fit=crop&auto=format&dpr=2 2x`,
  };
}

export default function ListImage() {
  return (
    <ImageList
      sx={{ width: 600, height: 498 }}
      variant="quilted"
      cols={4}
      rowHeight={121}
    >
      {itemData.map((item) => (
        <ImageListItem key={item.img} cols={item.cols || 1} rows={item.rows || 1}>
          <img
            {...srcset(item.img, 121, item.rows, item.cols)}
            alt={item.title}
            loading="lazy"
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

const itemData = [
  {
    img: corte1,
    title: 'Corte Moderno',
    rows: 2,
    cols: 2,
  },
  {
    img: corte2,
    title: 'Barba',
  },
  {
    img: corte3,
    title: 'Degradê',
  },
  {
    img: corte4,
    title: 'Corte Social',
    cols: 2,
  },
  {
    img: corte5,
    title: 'Barba Tradicional',
    cols: 2,
  },
  {
    img: corte6,
    title: 'Corte Clássico',
    rows: 2,
    cols: 2,
  }
];