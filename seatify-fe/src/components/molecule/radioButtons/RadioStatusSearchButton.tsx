/**
 * @createBy 한수민
 * @description 검색했을 시 카페 디테일 페이지 상태 표시 (1: 여유, 2: 보통, 3: 혼잡, 0: 모름)
 */

import { Typography, useTheme } from '@mui/material';
import { CafeSearchBox } from './radioButton.styled';

interface StatusSearchProp {
  onClick?: () => void;
}
const RadioStatusSearchButton = ({ onClick }: StatusSearchProp) => {
  const theme = useTheme();
  const color = theme.palette.primary.main;
  return (
    <CafeSearchBox main={color} onClick={onClick}>
      <Typography color={color} variant="h5">
        실시간 혼잡도 알아보기
      </Typography>
    </CafeSearchBox>
  );
};
export default RadioStatusSearchButton;

RadioStatusSearchButton.defaultProps = {
  onClick: () => {},
};
