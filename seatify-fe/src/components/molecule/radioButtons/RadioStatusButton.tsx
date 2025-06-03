 

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
