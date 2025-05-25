/**
 * @createdBy 한수민
 * @description 로그인 서비스에 따른 버튼 return
 */

import { GoogleButton, KakaoButton } from '~/components/atom/buttons';

interface ButtonProps {
  onClick: () => void;
  type: 'kakao' | 'google';
}
const SnsButton = ({ onClick, type }: ButtonProps) => {
  if (type === 'kakao') {
    return <KakaoButton onClick={onClick} />;
  }
  if (type === 'google') {
    return <GoogleButton onClick={onClick} />;
  }
  return null;
};
export default SnsButton;
