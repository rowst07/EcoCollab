import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ------------------ Tipos --------------------
type Estado = 'Análise' | 'Resolvido' | 'Irrelevante';
type TipoMsg = 'reporte' | 'ponto';

type DadosPonto = {
  tipo: 'ponto';
  id?: string;
  autor: string;
  data: string;
  titulo: string;
  descricao: string;
  morada: string;
  tipos: string[];
  lat: number;
  lng: number;
  imagem: string;
  estado: Estado;
};

type DadosReporte = {
  tipo: 'reporte';
  id?: string;
  autor: string;
  data: string;
  titulo: string;
  descricao: string;
  morada: string;
  imagem: string;
  estado: Estado;
};

type Dados = DadosPonto | DadosReporte;

// ------------------ Componente --------------------
export default function MensagemDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Simulação de lookup de dados
  const dados: Dados = useMemo(() => {
    if (id?.startsWith('p')) {
      const obj: DadosPonto = {
        tipo: 'ponto',
        id,
        autor: 'Pedro Silva',
        data: '15/08/2025',
        titulo: 'Proposta: Novo Ecoponto na Praça Velha',
        descricao: 'Foi colado há 3 dias e ainda não aparece na aplicação',
        morada: 'Praça Velha, Bragança',
        tipos: ['vidro','papel','plastico'],
        lat: 41.806, lng: -6.757,
        imagem: 'https://picsum.photos/800/480?2',
        estado: 'Análise',
      };
      return obj;
    }
    const obj: DadosReporte = {
      tipo: 'reporte',
      id,
      autor: 'João Monteiro',
      data: '14/08/2025',
      titulo: 'Contentores cheios',
      descricao: 'Contentores cheios há alguns dias. Cheiro intenso e lixo fora dos baldes.',
      morada: 'Rua Camilo Castelo Branco, Bragança',
      imagem: 'https://picsum.photos/800/480?1',
      estado: 'Análise',
    };
    return obj;
  }, [id]);

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: dados.imagem }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{dados.titulo}</Text>
        <Text style={styles.meta}>Enviado por {dados.autor} em {dados.data}</Text>

        <Text style={styles.section}>Descrição</Text>
        <Text style={styles.text}>{dados.descricao}</Text>

        <Text style={styles.section}>Localização</Text>
        <Text style={styles.text}>{dados.morada}</Text>

        {/* Se for ponto, mostra extras */}
        {dados.tipo === 'ponto' && (
          <>
            <Text style={styles.section}>Detalhes do novo ponto</Text>
            <View style={styles.boxRow}>
              <Text style={{ fontWeight:'700', marginBottom:6 }}>Tipos sugeridos:</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
                {dados.tipos.map((t, i) => <TipoCirculo t={t} key={`${t}-${i}`} />)}
              </View>
              <Text style={{ marginTop:10, color:'#555' }}>
                Coordenadas sugeridas: {dados.lat.toFixed(3)}, {dados.lng.toFixed(3)}
              </Text>
            </View>
          </>
        )}

        {/* Botões de ação */}
        <View style={styles.actionsRow}>
          {dados.tipo === 'ponto' ? (
            <>
              <ActionBtn color="#2E7D32" label="Aprovar" />
              <ActionBtn color="#D32F2F" label="Reprovar" />
              <ActionBtn color="#FFA000" label="Análise" />
            </>
          ) : (
            <>
              <ActionBtn color="#D32F2F" label="Irrelevante" />
              <ActionBtn color="#FFA000" label="Análise" />
              <ActionBtn color="#2E7D32" label="Resolvido" />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ------------------ Subcomponentes --------------------
function ActionBtn({ color, label }: { color:string, label:string }) {
  return (
    <TouchableOpacity style={[styles.actionBtn,{backgroundColor:color}]}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TipoCirculo({ t }: {t:string}) {
  const cor = t==='vidro' ? '#4CAF50' : t==='papel' ? '#2196F3' : t==='plastico' ? '#FF9800' : '#9E9E9E';
  return (
    <View style={{backgroundColor:cor, paddingVertical:6, paddingHorizontal:10, borderRadius:20, marginRight:6, marginBottom:6}}>
      <Text style={{color:'#fff', fontWeight:'700'}}>{t}</Text>
    </View>
  );
}

// ------------------ Styles --------------------
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  image:{ width:'100%', height:200 },
  content:{ padding:16 },
  title:{ fontSize:22, fontWeight:'800', marginBottom:4, color:'#111' },
  meta:{ color:'#666', marginBottom:16 },
  section:{ fontSize:16, fontWeight:'700', marginTop:16, marginBottom:6, color:'#333' },
  text:{ fontSize:15, lineHeight:20, color:'#444' },
  boxRow:{ backgroundColor:'#F5F5F5', padding:12, borderRadius:12, marginTop:6 },
  actionsRow:{ flexDirection:'row', justifyContent:'space-around', marginTop:20 },
  actionBtn:{ flex:1, paddingVertical:12, borderRadius:10, marginHorizontal:4, alignItems:'center' },
  actionText:{ color:'#fff', fontWeight:'700' },
});
