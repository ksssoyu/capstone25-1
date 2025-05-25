/**
 * @createdBy 김해지
 * @description Drawer 관련 타입 정의 모음
 */
import { ReactNode } from 'react';

export type DrawerName = 'logo' | 'mypage';
export interface DrawerItem {
  name: DrawerName;
  text: string;
  children: ReactNode;
}
