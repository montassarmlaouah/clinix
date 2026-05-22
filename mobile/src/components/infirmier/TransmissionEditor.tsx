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

const SOAP_FIELDS = [
  { key: 'S', label: 'Subjectif', placeholder: 'Ce que le patient dit, ressent, décrit…' },
  { key: 'O', label: 'Objectif',  placeholder: 'Constantes, observations cliniques mesurables…' },
  { key: 'A', label: 'Assessment (Analyse)', placeholder: 'Interprétation clinique, diagnostic infirmier…' },
  { key: 'P', label: 'Plan',      placeholder: 'Actions prévues, soins à effectuer, suivi…' },
] as const;

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
  type: 'SBAR' | 'SOAP';
  tags: string[];
  priorite: 'NORMALE' | 'URGENTE';
  onContenuChange: (v: string) => void;
  onTypeChange: (t: 'SBAR' | 'SOAP') => void;
  onTagsChange: (tags: string[]) => void;
  onPrioriteChange: (p: 'NORMALE' | 'URGENTE') => void;
}

export function TransmissionEditor({
  contenu,
  type,
  tags,
  priorite,
  onContenuChange,
  onTypeChange,
  onTagsChange,
  onPrioriteChange,
}: Props) {
  // Pour le mode SOAP on gère les 4 champs séparément
  const [soapFields, setSoapFields] = useState({ S: '', O: '', A: '', P: '' });

  function updateSoap(key: 'S' | 'O' | 'A' | 'P', value: string) {
    const next = { ...soapFields, [key]: value };
    setSoapFields(next);
    // Sérialiser en un contenu structuré pour le champ `contenu`
    const built = SOAP_FIELDS
      .filter((f) => next[f.key].trim())
      .map((f) => `${f.label} :\n${next[f.key].trim()}`)
      .join('\n\n');
    onContenuChange(built);
  }

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
              ]}
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

      {/* Sélecteur type SBAR / SOAP */}
      <View style={styles.typeRow}>
        <Text style={styles.label}>Format</Text>
        <View style={styles.typeBtns}>
          {(['SBAR', 'SOAP'] as const).map((t) => (
            <Pressable
              key={t}
              style={({ pressed }) => [
                styles.typeBtn,
                type === t && styles.typeBtnSelected,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => onTypeChange(t)}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextSelected]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Contenu selon le type */}
      {type === 'SBAR' ? (
        <>
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

          <View>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.textArea}
              value={contenu}
              onChangeText={onContenuChange}
              placeholder="Rédigez votre transmission SBAR…"
              placeholderTextColor={LUNA_COLORS.textDisabled}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </>
      ) : (
        /* Champs SOAP */
        <View style={styles.soapContainer}>
          {SOAP_FIELDS.map((f) => (
            <View key={f.key} style={styles.soapField}>
              <Text style={styles.soapLabel}>{f.label}</Text>
              <TextInput
                style={styles.textAreaSmall}
                value={soapFields[f.key]}
                onChangeText={(v) => updateSoap(f.key, v)}
                placeholder={f.placeholder}
                placeholderTextColor={LUNA_COLORS.textDisabled}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          ))}
        </View>
      )}

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
  // Priorité
  prioriteRow: { gap: spacing.xs },
  prioriteBtns: { flexDirection: 'row', gap: spacing.sm },
  prioriteBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.inputBg,
  },
  prioriteNormale: { backgroundColor: LUNA_COLORS.infoLight, borderColor: LUNA_COLORS.secondary },
  prioriteUrgente: { backgroundColor: LUNA_COLORS.errorLight, borderColor: LUNA_COLORS.error },
  prioriteBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  prioriteBtnTextSelected: { fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },
  // Type SBAR / SOAP
  typeRow: { gap: spacing.xs },
  typeBtns: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.inputBg,
  },
  typeBtnSelected: {
    backgroundColor: LUNA_COLORS.secondaryLight ?? LUNA_COLORS.infoLight,
    borderColor: LUNA_COLORS.secondary,
  },
  typeBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  typeBtnTextSelected: { fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  // SBAR
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
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    minHeight: 120,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  // SOAP
  soapContainer: { gap: spacing.sm },
  soapField: { gap: 4 },
  soapLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textPrimary,
  },
  textAreaSmall: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    minHeight: 72,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  // Tags
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full ?? 99,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  tagSelected: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor: LUNA_COLORS.secondary,
  },
  tagText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  tagTextSelected: { color: LUNA_COLORS.surface, fontWeight: fontWeight.semibold },
});
