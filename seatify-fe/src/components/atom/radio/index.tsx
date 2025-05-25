/**
 * @createBy 한수민
 * @description 라디오 버튼 작업 (1: 여유, 2: 보통, 3: 혼잡, 0: 모름)
 */

import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import HelpIcon from '@mui/icons-material/Help';

import { RadioProps, Status, options } from '~/types/radio';
import { Wrapper } from './radio.styled';

const Radio = ({ status }: RadioProps) => {
  return (
    <Wrapper color={options[status]?.color}>
      {status !== Status.unknown && (
        <RadioButtonCheckedIcon className="mui-icon" />
      )}
      {status === Status.unknown && <HelpIcon className="mui-icon" />}
    </Wrapper>
  );
};
export default Radio;
