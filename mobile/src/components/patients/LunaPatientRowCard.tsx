import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PatientRowView } from '@/src/utils/patientDisplay';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

interface LunaPatientRowCardProps {
  row: PatientRowView;
  onPress: () => void;
}

function patientIcons(row: PatientRowView): IonIcon[] {
  const icons: IonIcon[] = [];
  if (row.patient.typeAdmission === 'URGENCE' || row.patient.typeAdmission === 'URGENT') {
    icons.push('medkit-outline');
  }
  if (row.daysAdmitted != null && row.daysAdmitted > 3) {
    icons.push('fitness-outline');
  }
  if (row.medecinLabel) {
    icons.push('medical-outline');
  }
  return icons.slice(0, 3);
}

export function LunaPatientRowCard({ row, onPress }: LunaPatientRowCardProps): React.JSX.Element {
  const { patient, age, daysAdmitted, chambreLabel, medecinLabel, accent } = row;
  const initials = `${patient.prenom?.charAt(0) ?? ''}${patient.nom?.charAt(0) ?? ''}`.toUpperCase();
  const icons = patientIcons(row);
  const daysLabel = daysAdmitted != null ? `${daysAdmitted}j` : null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{initials || '?'}</Text>
        </View>
        {daysLabel ? (
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeTxt}>{daysLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {(patient.nom ?? '').toUpperCase()} {(patient.prenom ?? '').toUpperCase()}
        </Text>
        <Text style={styles.detailLine} numberOfLines={1}>
          {age != null ? `Age: ${age} Ans` : 'Age: —'}
          {chambreLabel ? `   ${chambreLabel}` : ''}
        </Text>
        {medecinLabel ? (
          <Text style={styles.doctorLine} numberOfLines={1}>
            Médecin: {medecinLabel.replace(/^Dr\s*/i, '')}
          </Text>
        ) : null}
        {icons.length > 0 ? (
          <View style={styles.iconRow}>
            {icons.map((icon) => (
              <Ionicons key={icon} name={icon} size={16} color={LUNA_COLORS.tertiary} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.statusBar, accent === 'alert' && styles.statusBarAlert]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  avatarWrap: {
    width: 56,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LUNA_COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarTxt: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.dark,
  },
  dayBadge: {
    position: 'absolute',
    top: -2,
    right: 0,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: LUNA_COLORS.surface,
  },
  dayBadgeTxt: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    letterSpacing: 0.3,
  },
  detailLine: {
    marginTop: 4,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.secondary,
  },
  doctorLine: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.secondary,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: borderRadius.sm,
    backgroundColor: LUNA_COLORS.borderDark,
    marginLeft: spacing.xs,
  },
  statusBarAlert: {
    backgroundColor: LUNA_COLORS.error,
  },
});
