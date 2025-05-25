/**
 * @createBy 한수민
 * @description 카페 디테일 페이지 상태 표시 (1: 여유, 2: 보통, 3: 혼잡, 0: 모름)
 */

import { Typography } from '@mui/material';

import Radio from '~/components/atom/radio';
import { RadioStatusProps, options } from '~/types/radio';
import { CafeStatusSearch } from './radioButton.styled';

const RadioStatusBoxButton = ({ status, onClick }: RadioStatusProps) => {
  const isBorder = status === '0';
  return (
    <CafeStatusSearch
      bordercolor={options[status]?.color}
      background={options[status]?.color2}
      isborder={isBorder.toString()}
      onClick={onClick}
    >
      <Radio status={status} />
      <Typography variant="subtitle2" color={options[status]?.color}>
        {options[status]?.label2}
      </Typography>
    </CafeStatusSearch>
  );
};
export default RadioStatusBoxButton;
