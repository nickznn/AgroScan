import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert, Animated, Easing, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../../../shared/theme';
import { Button } from '../../../shared/components/Button';
import { RootStackParamList } from '../../../navigation/types';
import { Result } from '../../../shared/models';
import { GpsStatus, ScanStage, useScannerViewModel } from '../viewmodel/useScannerViewModel';

const GPS_LABEL: Record<GpsStatus, string> = { checking: 'GPS...', on: 'GPS ativo', off: 'GPS desligado' };
const GPS_COLOR: Record<GpsStatus, string> = { checking: colors.outlineVariant, on: colors.inversePrimary, off: colors.warning };

export function ScannerView() {
  // A câmera é hardware da interface: a View pede a permissão, controla lanterna/lado e tira a foto;
  // o ViewModel cuida da localização, do envio e da análise.
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { photoUri, analyzing, stage, gps, enableGps, analyze, analyzeFromLibrary } = useScannerViewModel();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false);
  const [frameHeight, setFrameHeight] = useState(260);
  const capturing = useRef(false);

  const showOutcome = (result: Result<string> | null) => {
    if (!result) return;
    if (result.ok) navigation.navigate('ReportDetail', { id: result.data });
    else Alert.alert('Erro ao analisar', result.error);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing.current) return; // ignora o segundo toque enquanto o primeiro está em andamento
    capturing.current = true;
    try {
      let uri: string | null = null;
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
        uri = photo?.uri ?? null;
      } catch {
        // sem foto: a análise segue assim mesmo, como antes
      }
      setTorch(false);
      showOutcome(await analyze(uri));
    } finally {
      capturing.current = false;
    }
  };

  const pickFromLibrary = async () => showOutcome(await analyzeFromLibrary());

  if (analyzing) return <AnalyzingScreen photoUri={photoUri} stage={stage} />;

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
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} enableTorch={torch}>
        <View style={styles.hudHeader}>
          <Text style={[typography.titleMd, { color: '#fff' }]}>AgroScan AI</Text>
          <Pressable onPress={gps === 'off' ? enableGps : undefined} style={styles.gpsPill}>
            <MaterialIcons name={gps === 'off' ? 'location-off' : 'my-location'} size={14} color={GPS_COLOR[gps]} />
            <Text style={[typography.labelCaps, { color: '#fff', marginLeft: 6 }]}>{GPS_LABEL[gps]}</Text>
          </Pressable>
        </View>

        <View style={styles.frame} pointerEvents="none" onLayout={(e) => setFrameHeight(e.nativeEvent.layout.height)}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <ScanLine travel={frameHeight} />
          <Text style={styles.frameHint}>Centralize a folha no quadro</Text>
        </View>

        {gps === 'off' && (
          <Text style={styles.gpsWarning}>Sem GPS o foco não aparece no mapa. Toque em "GPS desligado" para ativar.</Text>
        )}

        <View style={styles.controls}>
          <View style={styles.sideButtons}>
            <Pressable onPress={pickFromLibrary} style={styles.smallBtn} accessibilityLabel="Escolher da galeria">
              <MaterialIcons name="photo-library" size={24} color="#fff" />
            </Pressable>
          </View>
          <Pressable onPress={takePhoto} style={styles.shutter} accessibilityLabel="Tirar foto e analisar">
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.sideButtons}>
            <Pressable
              onPress={() => setTorch((on) => !on)}
              style={[styles.smallBtn, torch && styles.smallBtnActive]}
              accessibilityLabel="Lanterna"
            >
              <MaterialIcons name={torch ? 'flash-on' : 'flash-off'} size={22} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setFacing((side) => (side === 'back' ? 'front' : 'back'))}
              style={styles.smallBtn}
              accessibilityLabel="Trocar de câmera"
            >
              <MaterialIcons name="flip-camera-android" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

// Linha que varre o quadro de cima a baixo enquanto a câmera está aberta.
function ScanLine({ travel }: { travel: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(progress, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });
  return <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />;
}

const STEPS: { stage: ScanStage; label: string }[] = [
  { stage: 'locating', label: 'Obtendo a localização do foco' },
  { stage: 'uploading', label: 'Enviando a foto e analisando' },
];

function AnalyzingScreen({ photoUri, stage }: { photoUri: string | null; stage: ScanStage }) {
  const current = STEPS.findIndex((s) => s.stage === stage);
  return (
    <View style={styles.analyzing}>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.analyzingImage} />}
      <View style={styles.analyzingOverlay}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[typography.titleMd, { color: colors.onPrimary, marginTop: 16, marginBottom: 20 }]}>Analisando com IA...</Text>
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <View key={step.stage} style={styles.stepRow}>
              <MaterialIcons
                name={done ? 'check-circle' : active ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={done ? colors.inversePrimary : active ? '#fff' : colors.outline}
              />
              <Text style={[typography.bodyMd, { marginLeft: 10, color: active || done ? '#fff' : colors.outline }]}>{step.label}</Text>
            </View>
          );
        })}
      </View>
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
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  frame: { flex: 1, margin: 40, borderWidth: 2, borderColor: colors.secondary, borderStyle: 'dashed', borderRadius: radius.md, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12, overflow: 'hidden' },
  frameHint: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.default, ...typography.bodySm },
  scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.inversePrimary, opacity: 0.9, shadowColor: colors.inversePrimary, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.error },
  cornerTL: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },
  gpsWarning: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', textAlign: 'center', marginHorizontal: 40, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.default, ...typography.bodySm },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 12, paddingBottom: 40 },
  sideButtons: { flexDirection: 'row', width: 96 },
  smallBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  smallBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
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
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
