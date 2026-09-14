import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { pickRandomPest } from '../data/pests';
import { RootStackParamList } from '../navigation/types';
import { SECTORS } from '../data/sectors';
import { DetectionResult } from '../types';

export function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addDetection } = useApp();

  const runAnalysis = (uri: string | null) => {
    setPhotoUri(uri);
    setAnalyzing(true);
    setTimeout(() => {
      const pest = pickRandomPest();
      const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
      const confidence = 60 + Math.random() * 39;
      const affectedArea =
        pest.affectedAreaRange[0] + Math.random() * (pest.affectedAreaRange[1] - pest.affectedAreaRange[0]);
      const result: DetectionResult = {
        id: `scan-${Date.now()}`,
        pest,
        confidence,
        sector: sector.name,
        timestamp: Date.now(),
        photoUri: uri,
        affectedArea,
        stage: pest.severity === 'critical' ? 'L3-L4 (Desenvolvimento)' : pest.severity === 'moderate' ? 'Estágio inicial' : 'Presença isolada',
        offline: Math.random() > 0.5,
      };
      addDetection(result);
      setAnalyzing(false);
      setPhotoUri(null);
      navigation.navigate('ReportDetail', { id: result.id });
    }, 1800);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      runAnalysis(photo?.uri ?? null);
    } catch {
      runAnalysis(null);
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!result.canceled) {
      runAnalysis(result.assets[0].uri);
    }
  };

  if (analyzing) {
    return (
      <View style={styles.analyzing}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.analyzingImage} />}
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[typography.titleMd, { color: colors.onPrimary, marginTop: 16 }]}>Analisando com IA...</Text>
          <Text style={[typography.bodySm, { color: colors.inversePrimary, marginTop: 4 }]}>Processando localmente no dispositivo</Text>
        </View>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { padding: 32 }]}>
        <MaterialIcons name="photo-camera" size={48} color={colors.secondary} />
        <Text style={[typography.titleMd, { textAlign: 'center', marginTop: 16, marginBottom: 8 }]}>
          Precisamos da câmera para escanear a lavoura
        </Text>
        <Text style={[typography.bodySm, { textAlign: 'center', color: colors.onSurfaceVariant, marginBottom: 20 }]}>
          Usada apenas para identificar pragas e doenças nas fotos que você tirar.
        </Text>
        <Button label="PERMITIR CÂMERA" onPress={requestPermission} />
        <Pressable onPress={pickFromLibrary} style={{ marginTop: 16 }}>
          <Text style={[typography.bodySemiBold, { color: colors.secondary }]}>Ou escolher foto da galeria</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View style={styles.hudHeader}>
          <Text style={[typography.titleMd, { color: '#fff' }]}>AgroScan AI</Text>
          <View style={styles.syncedPill}>
            <View style={styles.syncedDot} />
            <Text style={[typography.labelCaps, { color: '#fff' }]}>SYNCED</Text>
          </View>
        </View>

        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Text style={styles.frameHint}>Centralize a folha no quadro</Text>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={pickFromLibrary} style={styles.smallBtn}>
            <MaterialIcons name="photo-library" size={24} color="#fff" />
          </Pressable>
          <Pressable onPress={takePhoto} style={styles.shutter}>
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.smallBtn} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  syncedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inversePrimary, marginRight: 6 },
  frame: { flex: 1, margin: 40, borderWidth: 2, borderColor: colors.secondary, borderStyle: 'dashed', borderRadius: radius.md, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 },
  frameHint: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.default, ...typography.bodySm },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.error },
  cornerTL: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 40 },
  smallBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  analyzing: { flex: 1, backgroundColor: '#000' },
  analyzingImage: { flex: 1, opacity: 0.4 },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
