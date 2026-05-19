import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface Allergie {
  substance:  string;
  severite?:  string;
}

interface Traitement {
  medicament: string;
  posologie?: string;
}

interface Examen {
  type:       string;
  resultat?:  string;
  date?:      string;
}

interface LettreLiaisonCardProps {
  patientNom:     string;
  patientPrenom:  string;
  medecinEnvoyeur: string;
  dateEnvoi:      string;
  motif:          string;
  resumeClinique: string;
  antecedents?:   string;
  allergies?:     Allergie[];
  traitements?:   Traitement[];
  examens?:       Examen[];
  urgence?:       boolean;
  statut:         string;
}

export function LettreLiaisonCard({
  patientNom,
  patientPrenom,
  medecinEnvoyeur,
  dateEnvoi,
  motif,
  resumeClinique,
  antecedents,
  allergies,
  traitements,
  examens,
  urgence,
  statut,
}: LettreLiaisonCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const statutColor: Record<string, string> = {
    EN_ATTENTE: LUNA_COLORS.warning,
    ACCEPTE:    LUNA_COLORS.success,
    REFUSE:     LUNA_COLORS.error,
  };

  return (
    <View style={[styles.card, urgence && styles.cardUrgent]}>
      {urgence && (
        <View style={styles.urgenceBanner}>
          <Text style={styles.urgenceText}>🚨 URGENCE</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patientPrenom} {patientNom}</Text>
          <Text style={styles.medecinText}>De : Dr {medecinEnvoyeur}</Text>
          <Text style={styles.dateText}>{new Date(dateEnvoi).toLocaleDateString('fr-FR')}</Text>
        </View>
        <View style={[styles.statutBadge, { backgroundColor: (statutColor[statut] ?? LUNA_COLORS.textDisabled) + '22' }]}>
          <Text style={[styles.statutText, { color: statutColor[statut] ?? LUNA_COLORS.textDisabled }]}>
            {statut.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Motif */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Motif</Text>
        <Text style={styles.sectionText}>{motif}</Text>
      </View>

      {/* Résumé */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Résumé clinique</Text>
        <Text style={styles.sectionText} numberOfLines={expanded ? undefined : 3}>
          {resumeClinique}
        </Text>
      </View>

      {/* Expand / collapse details */}
      <TouchableOpacity
        style={styles.expandBtn}
        onPress={() => setExpanded((p) => !p)}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <Text style={styles.expandBtnText}>
          {expanded ? '▲ Masquer les détails' : '▼ Voir les détails'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <ScrollView scrollEnabled={false}>
          {antecedents && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Antécédents</Text>
              <Text style={styles.sectionText}>{antecedents}</Text>
            </View>
          )}

          {allergies && allergies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Allergies</Text>
              {allergies.map((a, i) => (
                <Text key={i} style={styles.listItem}>
                  • {a.substance}{a.severite ? ` (${a.severite})` : ''}
                </Text>
              ))}
            </View>
          )}

          {traitements && traitements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Traitements en cours</Text>
              {traitements.map((t, i) => (
                <Text key={i} style={styles.listItem}>
                  • {t.medicament}{t.posologie ? ` — ${t.posologie}` : ''}
                </Text>
              ))}
            </View>
          )}

          {examens && examens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Examens complémentaires</Text>
              {examens.map((e, i) => (
                <Text key={i} style={styles.listItem}>
                  • {e.type}{e.resultat ? ` : ${e.resultat}` : ''}{e.date ? ` (${e.date})` : ''}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg, // ✨
    padding:         spacing.md,
    gap:             spacing.sm,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle, // ✨
    borderLeftWidth:  4,
    borderLeftColor: LUNA_COLORS.secondary,
  },
  cardUrgent: {
    borderLeftColor: LUNA_COLORS.error,
  },
  urgenceBanner: {
    backgroundColor: LUNA_COLORS.errorLight,
    padding:         spacing.xs,
    borderRadius:    borderRadius.xs,
    alignItems:      'center',
  },
  urgenceText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: LUNA_COLORS.error },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  patientInfo: { flex: 1, gap: 2 },
  patientName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  medecinText: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary },
  dateText:    { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },
  statutBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    borderRadius:      borderRadius.sm,
  },
  statutText:  { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  section:     { gap: 4 },
  sectionLabel: {
    ...typography.sectionTitle, // ✨
  },
  sectionText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, lineHeight: 20 },
  listItem:    { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, paddingLeft: spacing.xs },
  expandBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨
    marginTop: spacing.xs,
  },
  expandBtnText: { fontSize: fontSize.xs, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
});
