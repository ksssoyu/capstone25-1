/**
 * 권한이 필요 없는 빈 페이지 Layout
 * @returns Empty Layout
 */

import { ReactNode } from 'react';

interface EmptyLayoutProps {
  children: ReactNode;
}

const EmptyLayout = ({ children }: EmptyLayoutProps) => {
  return <div>{children}</div>;
};

export default EmptyLayout;
