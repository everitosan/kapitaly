import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  canChangeIcon,
  canHide,
  canRemove,
  canRename,
  CATEGORY_ICON_KEYS,
  countCategoryUses,
  validateCategoryInput,
  type Category,
  type CategoryField,
} from '@/domain/category';
import {
  DangerButton,
  Field,
  FieldRow,
  PrimaryButton,
  Switch,
  TextField,
} from '@/ui/components/basics';
import { DuotoneBlock } from '@/ui/components/DuotoneBlock';
import { SheetLayout } from '@/ui/components/layout';
import { CategoryIcon } from '@/ui/icons/categoryIcons';
import { useTheme } from '@/ui/ThemeProvider';

import { errorMessage } from '../messages';
import {
  useCategories,
  useOneOffExpenses,
  useRecurringExpenses,
  useRepositories,
} from '../repositories';

export interface CategoryFormProps {
  /** `null` para crear una nueva. */
  category: Category | null;
  /** Al guardar recibe la categoría guardada; al cancelar o borrar, nada. */
  onDone: (saved?: Category) => void;
}

/** Hoja para crear o editar una categoría, con las reglas de "Otro", de inicio y personalizadas. */
export function CategoryForm({ category, onDone }: CategoryFormProps) {
  const theme = useTheme();
  const { colors } = theme;
  const repos = useRepositories();
  const categories = useCategories();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState<string>(category?.icon ?? 'dots');
  const [visible, setVisible] = useState(category ? category.hiddenAt === null : true);
  const [errors, setErrors] = useState<Partial<Record<CategoryField, string>>>({});
  const [saving, setSaving] = useState(false);

  const isNew = category === null;
  const renamable = isNew || canRename(category);
  const iconEditable = isNew || canChangeIcon(category);
  const hideable = !isNew && canHide(category);
  const removable = !isNew && canRemove(category);
  const editable = renamable || iconEditable || hideable;
  const uses = category ? countCategoryUses(category.id, [...recurring.data, ...oneOffs.data]) : 0;
  const usesText = `${uses} ${uses === 1 ? 'gasto' : 'gastos'}`;

  const save = async () => {
    const r = validateCategoryInput({ name, icon }, categories.data, category);
    if (!r.ok) return setErrors(r.errors);
    setSaving(true);
    try {
      let saved: Category;
      if (isNew) saved = await repos.categories.create(r.value);
      else {
        saved = await repos.categories.update(category.id, r.value);
        if (hideable && visible !== (category.hiddenAt === null)) {
          if (visible) await repos.categories.unhide(category.id);
          else await repos.categories.hide(category.id);
        }
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDone(saved);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    if (!category) return;
    Alert.alert(
      `¿Borrar "${category.name}"?`,
      uses > 0
        ? `${usesText === '1 gasto' ? 'El gasto que la usa pasará' : `Los ${usesText} que la usan pasarán`} a "Otro".`
        : 'Ningún gasto la usa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar categoría',
          style: 'destructive',
          onPress: async () => {
            await repos.categories.remove(category.id);
            onDone();
          },
        },
      ],
    );
  };

  const subtitle = isNew
    ? 'Categoría tuya'
    : `${usesText} · ${category.builtin ? 'de inicio' : 'categoría tuya'}`;

  return (
    <SheetLayout
      title={isNew ? 'Nueva categoría' : 'Editar categoría'}
      onLeft={() => onDone()}
      leftLabel={editable ? 'Cancelar' : 'Cerrar'}
      footer={
        editable ? (
          <PrimaryButton label="Guardar" onPress={save} disabled={saving} testID="save-category" />
        ) : undefined
      }
    >
      <View style={[styles.preview, { backgroundColor: colors.card }]}>
        <DuotoneBlock gradient={theme.frequency.monthly} radius={24} style={styles.big}>
          <CategoryIcon icon={icon} color={colors.onBlock} size={34} />
        </DuotoneBlock>
        <Text style={[styles.previewName, { color: colors.ink }]}>
          {name.trim() || 'Nueva categoría'}
        </Text>
        <Text style={[styles.previewSub, { color: colors.muted }]}>{subtitle}</Text>
      </View>

      {renamable ? (
        <TextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Gimnasio"
          error={errorMessage('name', errors.name)}
          testID="category-name"
        />
      ) : null}

      {iconEditable ? (
        <Field label="Ícono" error={errorMessage('icon', errors.icon)}>
          <View style={styles.grid}>
            {CATEGORY_ICON_KEYS.map((k) => (
              <Pressable
                key={k}
                testID={`icon-${k}`}
                accessibilityRole="button"
                accessibilityLabel={`Ícono ${k}`}
                accessibilityState={{ selected: icon === k }}
                onPress={() => setIcon(k)}
                style={[
                  styles.iconCell,
                  { backgroundColor: icon === k ? colors.card : colors.bg },
                  icon === k ? { borderColor: colors.ink } : null,
                ]}
              >
                <CategoryIcon icon={k} color={colors.ink} size={22} />
              </Pressable>
            ))}
          </View>
        </Field>
      ) : null}

      {hideable ? (
        <Field>
          <FieldRow label="Ofrecer en gastos nuevos">
            <Switch
              label="Ofrecer en gastos nuevos"
              value={visible}
              onValueChange={setVisible}
              testID="category-visible"
            />
          </FieldRow>
        </Field>
      ) : null}

      {!editable || (!isNew && category.builtin) ? (
        <View style={[styles.notice, { backgroundColor: colors.card }]}>
          <Text style={[styles.noticeText, { color: colors.muted }]}>
            {editable
              ? 'Las categorías de inicio no se renombran ni se borran; si no te sirve, deja de ofrecerla.'
              : '"Otro" recibe los gastos sin categoría y los de categorías borradas; no se puede cambiar.'}
          </Text>
        </View>
      ) : null}

      {removable ? (
        <>
          <View style={[styles.notice, { backgroundColor: colors.card }]}>
            <Text style={[styles.noticeText, { color: colors.muted }]}>
              {uses > 0
                ? `Si la borras, ${uses === 1 ? '1 gasto pasará' : `${uses} gastos pasarán`} a "Otro".`
                : 'Ningún gasto la usa.'}
            </Text>
          </View>
          <DangerButton label="Borrar categoría" onPress={confirmRemove} testID="remove-category" />
        </>
      ) : null}
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  preview: { borderRadius: 30, padding: 22, alignItems: 'center', gap: 10 },
  big: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  previewSub: { fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  notice: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  noticeText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
