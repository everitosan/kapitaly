import { StyleSheet, Text } from 'react-native';

import { SNOOZE_HOURS } from '@/domain/pendingSnooze';
import { useTheme } from '@/ui/ThemeProvider';

export const SNOOZE_NOTICE = `Volveré a avisarte dentro de ${SNOOZE_HOURS} hrs`;

/** Aviso breve tras posponer un pendiente. */
export function SnoozeNotice() {
  const { colors } = useTheme();
  return (
    <Text
      testID="snooze-notice"
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor: colors.ink, color: colors.bg }]}
    >
      {SNOOZE_NOTICE}
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
});
