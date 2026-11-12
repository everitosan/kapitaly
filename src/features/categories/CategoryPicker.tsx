import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BUILTIN_CATEGORIES,
  isSelectableCategory,
  resolveCategory,
  type Category,
} from '@/domain/category';
import { PrimaryButton } from '@/ui/components/basics';
import { SheetLayout } from '@/ui/components/layout';
import { CategoryIcon } from '@/ui/icons/categoryIcons';
import { useTheme } from '@/ui/ThemeProvider';

import { useCategories } from '../repositories';
import { CategoryForm } from './CategoryForm';

export interface CategoryPickerProps {
  /** Categoría actual del gasto. */
  selectedId: string;
  /** Texto de contexto, p. ej. "Recarga metro · $100.00". */
  context: string;
  /** Recibe la categoría elegida, o nada si se cancela. */
  onDone: (categoryId?: string) => void;
}

const BUILTIN_ORDER = new Map(BUILTIN_CATEGORIES.map((b, i) => [b.id, i]));
const order = (c: Category) => (c.builtin ? (BUILTIN_ORDER.get(c.id) ?? 99) : 50);

/**
 * Segunda hoja sobre el gasto: elige entre las categorías vigentes y no ocultas. La categoría
 * actual del gasto se ofrece aunque esté oculta, para no cambiarla en silencio.
 */
export function CategoryPicker({ selectedId, context, onDone }: CategoryPickerProps) {
  const { colors } = useTheme();
  const categories = useCategories();
  // Las categorías cargan después del primer render: se guarda el id y se resuelve al dibujar.
  const [selected, setSelected] = useState(selectedId);
  const [creating, setCreating] = useState(false);

  if (creating)
    return (
      <CategoryForm
        category={null}
        onDone={(saved) => {
          setCreating(false);
          if (saved) onDone(saved.id);
        }}
      />
    );

  const current = resolveCategory(selected, categories.data);
  const options = categories.data
    .filter((c) => isSelectableCategory(c) || c.id === selectedId)
    .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, 'es'));

  return (
    <SheetLayout
      title="Categoría"
      leftLabel="‹ Gasto"
      onLeft={() => onDone()}
      footer={
        <PrimaryButton
          label={`Usar ${current.name}`}
          onPress={() => onDone(current.id)}
          testID="use-category"
        />
      }
    >
      <View style={[styles.ctx, { backgroundColor: colors.card }]}>
        <Text style={[styles.ctxLabel, { color: colors.muted }]}>Para el gasto</Text>
        <Text style={[styles.ctxValue, { color: colors.ink }]} numberOfLines={1}>
          {context}
        </Text>
      </View>
      <View style={[styles.list, { backgroundColor: colors.card }]}>
        {options.map((c, i) => {
          const on = c.id === current.id;
          return (
            <View key={c.id}>
              {i > 0 ? <View style={[styles.sep, { backgroundColor: colors.line }]} /> : null}
              <Pressable
                testID={`pick-${c.id}`}
                accessibilityRole="radio"
                accessibilityLabel={c.name}
                accessibilityState={{ checked: on }}
                onPress={() => setSelected(c.id)}
                style={styles.row}
              >
                <View style={[styles.tile, { backgroundColor: colors.bg }]}>
                  <CategoryIcon icon={c.icon} color={colors.ink} />
                </View>
                <Text style={[styles.name, { color: colors.ink }]}>{c.name}</Text>
                <View
                  style={[
                    styles.check,
                    { borderColor: on ? colors.ink : colors.line },
                    on ? { backgroundColor: colors.ink } : null,
                  ]}
                >
                  {on ? <Text style={[styles.tick, { color: colors.bg }]}>✓</Text> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
        <View style={[styles.sep, { backgroundColor: colors.line }]} />
        <Pressable
          testID="new-category"
          accessibilityRole="button"
          onPress={() => setCreating(true)}
          style={styles.row}
        >
          <View style={[styles.tile, styles.newTile, { borderColor: colors.muted }]}>
            <Text style={[styles.plus, { color: colors.muted }]}>+</Text>
          </View>
          <Text style={[styles.name, { color: colors.muted }]}>Nueva categoría</Text>
        </Pressable>
      </View>
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  ctx: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  ctxLabel: { fontSize: 13, fontWeight: '600' },
  ctxValue: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  list: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 4 },
  sep: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  tile: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  newTile: { borderWidth: 2, borderStyle: 'dashed' },
  plus: { fontSize: 20, fontWeight: '600' },
  name: { flex: 1, fontSize: 16, fontWeight: '700' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 13, fontWeight: '800' },
});
