import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const SBAR_TEMPLATES = {
  S: 'S (Situation) : Le patient [Nom] présente [problème].\n',
  B: 'B (Background) : Antécédents : [antécédents]. Hospitalisé depuis [date] pour [motif].\n',
  A: 'A (Assessment) : Évaluation : [évaluation clinique].\n',
  R: 'R (Recommendation) : Je recommande : [action].',
};

const TAGS_DISPONIBLES = [
  'douleur',
  'perfusion',
  'tension',
  'chute',
  'agitation',
  'fièvre',
  'plaie',
  'nausées',
];

interface Props {
  contenu: string;
  tags: string[];
  priorite: 'NORMALE' | 'URGENTE';
  onContenuChange: (v: string) => void;
  onTagsChange: (tags: string[]) => void;
  onPrioriteChange: (p: 'NORMALE' | 'URGENTE') => void;
}

export function TransmissionEditor({
  contenu,
  tags,
  priorite,
  onContenuChange,
  onTagsChange,
  onPrioriteChange,
}: Props) {
  const insertTemplate = (key: keyof typeof SBAR_TEMPLATES) => {
    onContenuChange(contenu + SBAR_TEMPLATES[key]);
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Priorité */}
      <View style={styles.prioriteRow}>
        <Text style={styles.label}>Priorité</Text>
        <View style={styles.prioriteBtns}>
          {(['NORMALE', 'URGENTE'] as const).map((p) => (
            <Pressable
              key={p}
              style={({ pressed }) => [
                styles.prioriteBtn,
                priorite === p && (p === 'URGENTE' ? styles.prioriteUrgente : styles.prioriteNormale),
                pressed && { opacity: 0.75 },
              ]} // ✨
              onPress={() => onPrioriteChange(p)}
            >
              <Text
                style={[
                  styles.prioriteBtnText,
                  priorite === p && styles.prioriteBtnTextSelected,
                ]}
              >
                {p === 'NORMALE' ? 'Normale' : '🚨 Urgente'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Templates SBAR */}
      <View>
        <Text style={styles.label}>Templates SBAR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesRow}>
          {(Object.keys(SBAR_TEMPLATES) as Array<keyof typeof SBAR_TEMPLATES>).map((key) => (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.templateBtn, pressed && { opacity: 0.75 }]}
              onPress={() => insertTemplate(key)}
            >
              <Text style={styles.templateBtnText}>{key}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Contenu */}
      <View>
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.textArea}
          value={contenu}
          onChangeText={onContenuChange}
          placeholder="Rédigez votre transmission..."
          placeholderTextColor={LUNA_COLORS.textDisabled}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Tags */}
      <View>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagsContainer}>
          {TAGS_DISPONIBLES.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={({ pressed }) => [styles.tag, selected && styles.tagSelected, pressed && { opacity: 0.75 }]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  prioriteRow: { gap: spacing.xs },
  prioriteBtns: { flexDirection: 'row', gap: spacing.sm },
  prioriteBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.inputBg, // ✨
  },
  prioriteNormale: { backgroundColor: LUNA_COLORS.infoLight, borderColor: LUNA_COLORS.secondary },
  prioriteUrgente: { backgroundColor: LUNA_COLORS.errorLight, borderColor: LUNA_COLORS.error },
  prioriteBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  prioriteBtnTextSelected: { fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },
  templatesRow: { marginBottom: spacing.xs },
  templateBtn: {
    backgroundColor: LUNA_COLORS.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  templateBtnText: {
    color: LUNA_COLORS.surface,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput, // ✨
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    minHeight: 120,
    backgroundColor: LUNA_COLORS.inputBg, // ✨
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full ?? 99,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
    backgroundColor: LUNA_COLORS.inputBg, // ✨
  },
  tagSelected: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor: LUNA_COLORS.secondary,
  },
  tagText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  tagTextSelected: { color: LUNA_COLORS.surface, fontWeight: fontWeight.semibold },
});
