import type { ReactNode, RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../ThemeProvider';
import { useKeyboardVisible } from '../useKeyboardVisible';

/** Hoja modal: barra con "Cancelar"/título, contenido desplazable y un botón principal fijo abajo. */
export function SheetLayout({
  title,
  leftLabel = 'Cancelar',
  onLeft,
  children,
  footer,
}: {
  title: string;
  leftLabel?: string;
  onLeft: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { colors } = useTheme();
  // En Android la ventana se redimensiona con el teclado y el botón fijo subiría encima del
  // formulario; en iOS el teclado ya lo cubre. Se oculta mientras se escribe en ambos casos.
  const keyboardVisible = useKeyboardVisible();
  const showFooter = footer && !(Platform.OS === 'android' && keyboardVisible);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.grab, { backgroundColor: colors.line }]} />
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            onPress={onLeft}
            hitSlop={12}
            style={styles.navSide}
          >
            <Text style={[styles.navLeft, { color: colors.muted }]}>{leftLabel}</Text>
          </Pressable>
          <Text accessibilityRole="header" style={[styles.navTitle, { color: colors.ink }]}>
            {title}
          </Text>
          <View style={styles.navSide} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {showFooter ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Pantalla con título grande y botón flotante opcional. */
export function ScreenLayout({
  children,
  footer,
  header,
  scrollRef,
}: {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  /** Para desplazar el contenido desde la pantalla (p. ej. a una sección). */
  scrollRef?: RefObject<ScrollViewInstance | null>;
}) {
  const { colors } = useTheme();
  // Mientras se escribe (p. ej. en el buscador) el botón flotante se oculta: en Android subiría con
  // el teclado y taparía la lista; en iOS el teclado ya lo cubre.
  const keyboardVisible = useKeyboardVisible();
  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.screenBody}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer && !keyboardVisible ? <View style={styles.fab}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  navSide: { width: 90 },
  navLeft: { fontSize: 16, fontWeight: '600' },
  navTitle: { fontSize: 17, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  footer: { position: 'absolute', left: 20, right: 20, bottom: 30 },
  screenBody: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 130 },
  fab: { position: 'absolute', left: 20, right: 20, bottom: 30 },
});
