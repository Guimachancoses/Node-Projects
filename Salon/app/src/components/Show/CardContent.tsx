import React, { useState } from 'react';
import { Card, Avatar, IconButton, Title, Paragraph, useTheme } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import consts from '@/src/constants/consts';

interface CardContentProps {
  servico: any;
}

const CardContent = ({ servico }: CardContentProps) => {
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { salao } = useSelector((state: any) => state.salao);
  const { colors } = useTheme();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      <Card style={styles.card}>
        <Card.Title
          title={salao.nome}
          subtitle="Cuidando da sua beleza"
          left={(props) => (
            <Avatar.Image {...props} source={require('@/src/assets/images/Logo.png')} style={styles.avatar} />
          )}
        //   right={(props) => (
        //     <IconButton {...props} icon="dots-vertical" onPress={() => {}} />
        //   )}
        />
        
        {/* TouchableOpacity para ativar modal ao tocar na imagem */}
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Card.Cover style={styles.cover} source={{ uri: `${consts?.bucketUrl}/${servico?.arquivos?.[0]?.caminho}` }} />
        </TouchableOpacity>

        <Card.Content>
          <Paragraph style={styles.paragraph}>
            {servico?.descricao}
          </Paragraph>
        </Card.Content>

        <Card.Actions>
          <IconButton icon="heart" onPress={() => {}} />
          <IconButton icon="share" onPress={() => {}} />
          {/* <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            onPress={handleExpandClick}
            style={styles.expandButton}
          /> */}
        </Card.Actions>

        {expanded && (
          <Card.Content>
            <Title style={styles.methodTitle}>Method:</Title>
            <Paragraph style={styles.methodText}>
              Heat 1/2 cup of the broth in a pot until simmering...
            </Paragraph>
          </Card.Content>
        )}
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    maxWidth: 345,
    margin: 16,
  },
  avatar: {
    backgroundColor: '#f44336',
  },
  paragraph: {
    marginVertical: 8,
  },
  expandButton: {
    marginLeft: 'auto',
  },
  methodTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  methodText: {
    marginBottom: 8,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  cover: {
    height: 300,
    width: 'auto',
  },
});

export default CardContent;
