import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { type PageHeaderState, usePageHeaderStore } from '@/src/store/pageHeader.store';

export type UsePageHeaderOptions = Partial<
  Pick<
    PageHeaderState,
    | 'title'
    | 'subtitle'
    | 'showMenu'
    | 'showBack'
    | 'showNotifications'
    | 'showProfil'
    | 'showBrand'
    | 'right'
    | 'center'
    | 'onBack'
  >
>;

/** Définit le titre de la barre supérieure (layout global ou écran isolé). */
export function usePageHeader(options: UsePageHeaderOptions): void {
  const setHeader = usePageHeaderStore((s) => s.setHeader);

  useFocusEffect(
    useCallback(() => {
      setHeader(options);
      return () => {
        setHeader({ title: '', subtitle: undefined, right: undefined, center: undefined, onBack: undefined });
      };
    }, [
      options.title,
      options.subtitle,
      options.showMenu,
      options.showBack,
      options.showNotifications,
      options.showProfil,
      options.showBrand,
      options.onBack,
      options.right,
      options.center,
      setHeader,
    ]),
  );
}
