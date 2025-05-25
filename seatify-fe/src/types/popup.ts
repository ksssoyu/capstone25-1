/**
 * @createBy 김해지
 * @description Popup 관련 타입 정의 모음
 */

export type ActionButtonType = 'confirm' | 'close';

export interface ActionButton {
  title: string;
  type: ActionButtonType;
  onClick?: () => void;
}
