import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  countCategoryUses,
  isSelectableCategory,
  OTHER_CATEGORY_ID,
  BUILTIN_CATEGORIES,
  type Category,
  type CategoryRef,
} from '@/domain/category';
import { PrimaryButton } from '@/ui/components/basics';
import { RoundButton } from '@/ui/components/balance';
import { ScreenLayout } from '@/ui/components/layout';
import { CategoryIcon } from '@/ui/icons/categoryIcons';
import { useTheme } from '@/ui/ThemeProvider';

import { useCategories, useOneOffExpenses, useRecurringExpenses } from '../repositories';

export interface CategoryListProps {
  onBack: () => void;
  onOpen: (id: string) => void;
  onAdd: () => void;
}

const BUILTIN_ORDER = new Map(BUILTIN_CATEGORIES.map((b, i) => [b.id, i]));

function CategoryRow({
  category,
  uses,
  onPress,
}: {
  category: Category;
  uses: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const hidden = category.hiddenAt !== null;
  const fixed = category.id === OTHER_CATEGORY_ID;
  return (
    <Pressable
      testID={`category-${category.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}${hidden ? ', oculta' : ''}${fixed ? ', fija' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.tile, { backgroundColor: colors.bg, opacity: hidden ? 0.45 : 1 }]}>
        <CategoryIcon icon={category.icon} color={colors.ink} />
      </View>
      <View style={[styles.flex, { opacity: hidden ? 0.45 : 1 }]}>
        <Text style={[styles.name, { color: colors.ink }]}>{category.name}</Text>
        <Text
          style={[styles.uses, { color: colors.muted }]}
        >{`${uses} ${uses === 1 ? 'gasto' : 'gastos'}`}</Text>
      </View>
      {fixed || hidden ? (
        <Text
          style={[
            styles.tag,
            fixed
              ? { backgroundColor: colors.ink, color: colors.bg }
              : { backgroundColor: colors.bg, color: colors.muted },
          ]}
        >
          {fixed ? 'FIJA' : 'OCULTA'}
        </Text>
      ) : (
        <Text style={[styles.chev, { color: colors.muted }]}>›</Text>
      )}
    </Pressable>
  );
}

/** Categorías: las del usuario arriba y las de inicio abajo, con "Otro" al final. */
export function CategoryList({ onBack, onOpen, onAdd }: CategoryListProps) {
  const { colors } = useTheme();
  const categories = useCategories();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();
  const refs: CategoryRef[] = [...recurring.data, ...oneOffs.data];

  const mine = categories.data
    .filter((c) => !c.builtin)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const builtin = categories.data
    .filter((c) => c.builtin)
    .sort((a, b) => (BUILTIN_ORDER.get(a.id) ?? 99) - (BUILTIN_ORDER.get(b.id) ?? 99));
  const active = categories.data.filter(isSelectableCategory).length;

  const section = (label: string, list: Category[]) =>
    list.length === 0 ? null : (
      <>
        <Text style={[styles.section, { color: colors.muted }]}>{label}</Text>
        <View style={[styles.list, { backgroundColor: colors.card }]}>
          {list.map((c, i) => (
            <View key={c.id}>
              {i > 0 ? <View style={[styles.sep, { backgroundColor: colors.line }]} /> : null}
              <CategoryRow
                category={c}
                uses={countCategoryUses(c.id, refs)}
                onPress={() => onOpen(c.id)}
              />
            </View>
          ))}
        </View>
      </>
    );

  return (
    <ScreenLayout
      header={
        <View style={styles.topnav}>
          <RoundButton label="Volver" onPress={onBack}>
            <Text style={[styles.arrow, { color: colors.ink }]}>‹</Text>
          </RoundButton>
        </View>
      }
      footer={<PrimaryButton label="Nueva categoría" plus onPress={onAdd} testID="add-category" />}
    >
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        Categorías
      </Text>
      <Text style={[styles.desc, { color: colors.muted }]}>
        {`${active} ${active === 1 ? 'activa' : 'activas'} · para clasificar cada gasto`}
      </Text>
      {section('TUYAS', mine)}
      {section('DE INICIO', builtin)}
      <Text style={[styles.note, { color: colors.muted }]}>
        Las de inicio se pueden ocultar o cambiar de ícono. &quot;Otro&quot; recibe los gastos sin
        categoría.
      </Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topnav: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, flexDirection: 'row' },
  arrow: { fontSize: 24, fontWeight: '600' },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  desc: { fontSize: 15, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 8 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 10,
  },
  list: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 4 },
  sep: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  tile: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  uses: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chev: { fontSize: 20, fontWeight: '600' },
  note: { fontSize: 13, fontWeight: '600', paddingHorizontal: 4, paddingTop: 14 },
});
