/**
 * @createBy 한수민
 * @description 카페 상태 표시 (1: 여유, 2: 보통, 3: 혼잡, 0: 모름)
 */

import { Typography } from '@mui/material';

import Radio from '~/components/atom/radio';
import { RadioProps, options } from '~/types/radio';
import { Wrapper } from './radioButton.styled';

const RadioStatusButton = ({ status }: RadioProps) => {
  return (
    <Wrapper>
      <Radio status={status} />
      <Typography variant="caption" color={options[status].color}>
        {options[status].label}
      </Typography>
    </Wrapper>
  );
};
export default RadioStatusButton;
