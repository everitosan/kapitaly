import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  buildBody,
  buildSubject,
  canSend,
  FEEDBACK_MAX_SHOTS,
  FEEDBACK_MAX_TEXT,
  remainingShots,
  type FeedbackDiagnostics,
} from '@/domain/feedback';
import { RoundButton } from '@/ui/components/balance';
import { Field, PrimaryButton } from '@/ui/components/basics';
import { ScreenLayout } from '@/ui/components/layout';
import { useTheme } from '@/ui/ThemeProvider';

import { FEEDBACK_EMAIL } from './config';
import { feedbackDiagnostics } from './diagnostics';

export interface FeedbackScreenProps {
  onBack: () => void;
  /** Dependencias del sistema; se inyectan en pruebas. */
  mail?: Pick<typeof MailComposer, 'isAvailableAsync' | 'composeAsync'>;
  picker?: Pick<typeof ImagePicker, 'launchImageLibraryAsync'>;
  diagnostics?: () => FeedbackDiagnostics;
}

const formatCount = (n: number) => n.toLocaleString('es-MX');

/** Ajustes > Comentarios: arma un correo con texto y capturas en la app de correo del teléfono. */
export function FeedbackScreen({
  onBack,
  mail = MailComposer,
  picker = ImagePicker,
  diagnostics = feedbackDiagnostics,
}: FeedbackScreenProps) {
  const { colors, radii } = useTheme();
  const [text, setText] = useState('');
  const [shots, setShots] = useState<string[]>([]);
  const [mailAvailable, setMailAvailable] = useState<boolean | null>(null);
  const [opened, setOpened] = useState(false);
  const [info] = useState(diagnostics);

  useEffect(() => {
    let active = true;
    mail.isAvailableAsync().then((available) => {
      if (active) setMailAvailable(available);
    });
    return () => {
      active = false;
    };
  }, [mail]);

  const addShots = async () => {
    const limit = remainingShots(shots.length);
    if (limit === 0) return;
    const result = await picker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 0.7,
    });
    if (result.canceled) return;
    setShots((current) =>
      [...current, ...result.assets.map((a) => a.uri)].slice(0, FEEDBACK_MAX_SHOTS),
    );
    setOpened(false);
  };

  const send = async () => {
    await mail.composeAsync({
      recipients: [FEEDBACK_EMAIL],
      subject: buildSubject(info.version),
      body: buildBody(text, info),
      attachments: shots,
    });
    // En Android el resultado siempre es "sent", aunque se cancele: no se asume que se envió.
    setOpened(true);
  };

  const noMail = mailAvailable === false;

  return (
    <ScreenLayout
      header={
        <View style={styles.topnav}>
          <RoundButton label="Volver" onPress={onBack}>
            <Text style={[styles.arrow, { color: colors.ink }]}>‹</Text>
          </RoundButton>
        </View>
      }
      footer={
        <PrimaryButton
          label="Enviar por correo"
          testID="feedback-send"
          disabled={!canSend(text, mailAvailable === true)}
          onPress={send}
        />
      }
    >
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        Comentarios
      </Text>
      <Text style={[styles.desc, { color: colors.muted }]}>
        <Text style={{ color: colors.ink }}>¿Te es de ayuda la app?</Text>
        {'\n'}Ayúdame a mejorar la experiencia compartiendo tus comentarios, inquietudes o propuestas
        de mejora.
      </Text>

      {noMail ? (
        <View
          testID="feedback-no-mail"
          style={[styles.notice, { backgroundColor: colors.alertBg }]}
        >
          <Text style={[styles.noticeTitle, { color: colors.alertInk }]}>
            No hay una app de correo
          </Text>
          <Text style={[styles.noticeText, { color: colors.alertInk }]}>
            Configura una cuenta en Gmail u otra app de correo para poder enviar tus comentarios. Lo
            que escribiste se queda aquí.
          </Text>
        </View>
      ) : null}

      <Field label="Tu comentario" style={styles.block}>
        <TextInput
          testID="feedback-text"
          accessibilityLabel="Tu comentario"
          value={text}
          onChangeText={(v) => {
            setText(v);
            setOpened(false);
          }}
          maxLength={FEEDBACK_MAX_TEXT}
          multiline
          textAlignVertical="top"
          placeholder="Ej.: Al guardar un gasto con tarjeta digital…"
          placeholderTextColor={colors.muted}
          style={[styles.textArea, { color: colors.ink }]}
        />
        <Text testID="feedback-count" style={[styles.count, { color: colors.muted }]}>
          {`${formatCount(text.length)} / ${formatCount(FEEDBACK_MAX_TEXT)}`}
        </Text>
      </Field>

      <Field label="Capturas · opcional" style={styles.block}>
        <View style={styles.shots}>
          {shots.map((uri, i) => (
            <View key={`${uri}-${i}`} style={[styles.shot, { borderRadius: radii.field - 2 }]}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar captura ${i + 1}`}
                hitSlop={6}
                onPress={() => {
                  setShots((current) => current.filter((_, j) => j !== i));
                  setOpened(false);
                }}
                style={styles.remove}
              >
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))}
          {shots.length < FEEDBACK_MAX_SHOTS ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agregar captura"
              onPress={addShots}
              style={[
                styles.add,
                {
                  borderColor: colors.line,
                  backgroundColor: colors.bg,
                  borderRadius: radii.field - 2,
                },
              ]}
            >
              <Text style={[styles.addText, { color: colors.muted }]}>+</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {`Hasta ${FEEDBACK_MAX_SHOTS} imágenes de tu galería.`}
        </Text>
      </Field>

      <View style={[styles.info, { backgroundColor: colors.card, borderRadius: radii.row }]}>
        <Text style={[styles.infoText, { color: colors.muted }]}>
          Se compartirá la siguiente información para tener más contexto en caso de un problema:{' '}
          <Text style={{ color: colors.ink }}>{`versión ${info.version}`}</Text>,{' '}
          <Text style={{ color: colors.ink }}>{info.device}</Text>.
        </Text>
      </View>

      {opened ? (
        <Text
          testID="feedback-opened"
          accessibilityRole="alert"
          style={[styles.opened, { backgroundColor: colors.ink, color: colors.bg }]}
        >
          Se abrió tu correo para enviar los comentarios
        </Text>
      ) : null}
    </ScreenLayout>
  );
}

const SHOT_W = 74;
const SHOT_H = 96;

const styles = StyleSheet.create({
  topnav: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, flexDirection: 'row' },
  arrow: { fontSize: 24, fontWeight: '600' },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  desc: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingBottom: 20,
    lineHeight: 21,
  },
  block: { marginBottom: 14 },
  textArea: { minHeight: 150, fontSize: 16, fontWeight: '600', lineHeight: 23, paddingTop: 4 },
  count: { textAlign: 'right', fontSize: 12, fontWeight: '700', marginTop: 4 },
  shots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  shot: { width: SHOT_W, height: SHOT_H, overflow: 'hidden' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(20,20,20,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  add: {
    width: SHOT_W,
    height: SHOT_H,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 26, fontWeight: '600' },
  hint: { fontSize: 12.5, fontWeight: '600', marginTop: 10 },
  info: { paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14 },
  infoText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  notice: { borderRadius: 18, padding: 14, marginBottom: 14 },
  noticeTitle: { fontSize: 15, fontWeight: '800' },
  noticeText: { fontSize: 13, fontWeight: '600', marginTop: 2, lineHeight: 18 },
  opened: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
});
