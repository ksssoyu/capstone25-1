/**
 * @createBy 한수민
 * @description 카페 팝업 창 레이아웃
 */

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

import { Typography, useTheme } from '@mui/material';

import Popup from '~/components/atom/popup';
import getCoffeeBean from '~/pages/api/member/getCoffeeBean';
import { ActionButton } from '~/types/popup';
import reviewFail from '../../../static/images/not-review-logo.png';
import reviewSuccess from '../../../static/images/review-logo.png';
import { ReviewCount } from './cafeResponsePopup.styled';

interface CafePopupProps {
  openPopup: boolean;
  actions: ActionButton[];
  closePopup: () => void;
  type: 'success' | 'fail';
}

const CafeResponsePopup = ({
  openPopup,
  actions,
  closePopup,
  type,
}: CafePopupProps) => {
  const theme = useTheme();
  const mainColor = theme.palette.primary.main;
  const coffeColor = theme.palette.grey[400];

  // 커피콩 조회 react query 문
  const { data } = useQuery(['coffeeBean'], () => getCoffeeBean());

  return (
    <Popup
      open={openPopup}
      content={
        <>
          {type === 'success' ? (
            <>
              <Image src={reviewSuccess} alt="" width={130} height={200} />
              <ReviewCount>
                <Typography variant="body2">커피콩 </Typography>
                <Typography variant="body1" color={mainColor} mt="2px" ml="5px">
                  2
                </Typography>
                <Typography variant="body2">개 지급 완료!</Typography>
              </ReviewCount>
            </>
          ) : (
            <>
              <Image src={reviewFail} alt="" width={130} height={200} />
              <Typography variant="body2">잔여 커피콩이 없어요!</Typography>
            </>
          )}

          <Typography variant="body2" color={coffeColor}>
            잔여 커피콩: {data}개
          </Typography>
        </>
      }
      actions={actions}
      onClose={closePopup}
    />
  );
};
export default CafeResponsePopup;
