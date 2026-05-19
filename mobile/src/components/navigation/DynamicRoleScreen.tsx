/**
 * DynamicRoleScreen.tsx — Routeur dynamique partagé par tous les rôles.
 *
 * Factorise la logique de [screen].tsx pour être réutilisable par :
 *   médecin, infirmier, secrétaire, admin clinique, radiologue, etc.
 *
 * Usage dans un fichier [screen].tsx :
 *   import { DynamicRoleScreen } from '@/src/components/navigation/DynamicRoleScreen';
 *
 *   const SCREENS = {
 *     agenda: () => <AgendaScreen />,
 *     notes:  () => <NotesScreen />,
 *   };
 *
 *   export default function Screen() {
 *     return <DynamicRoleScreen role="medecin" screens={SCREENS} />;
 *   }
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScreenFactory = () => React.JSX.Element;
export type ScreenMap = Record<string, ScreenFactory>;

interface Props {
  /** Nom du rôle affiché dans le message 404. */
  role: string;
  /** Map clé → composant. La clé doit correspondre au paramètre `screen` de l'URL. */
  screens: ScreenMap;
}

// ── 404 inline ────────────────────────────────────────────────────────────────

function NotFound({ role, screen }: { role: string; screen: string }): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Écran introuvable</Text>
      <Text style={styles.sub}>
        [{role}] Route non gérée : {screen || '(vide)'}
      </Text>
    </View>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

/**
 * Résout le paramètre `screen` de l'URL et rend le composant correspondant.
 * Si la clé n'est pas trouvée dans `screens`, affiche une page 404 interne.
 */
export function DynamicRoleScreen({ role, screens }: Props): React.JSX.Element {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  const key = Array.isArray(screen) ? screen[0] : screen ?? '';

  const Component = screens[key];
  if (!Component) return <NotFound role={role} screen={key} />;

  return <Component />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FC',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2B4A',
  },
  sub: {
    fontSize: 13,
    color: '#8A94A6',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
