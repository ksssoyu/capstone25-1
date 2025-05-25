/**
 * @createBy 한수민
 * @description 카페 혼잡도 확인 팝업 창
 */

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

import { Typography, useTheme } from '@mui/material';

import { ActionButton } from '~/types/popup';
import Popup from '~/components/atom/popup';
import getCoffeeBean from '~/pages/api/member/getCoffeeBean';
import coffeebean from '../../../static/images/coffeebean.png';
import { CongestionCoffee } from './cafeDetailInfo.styled';

interface CongestionProps {
  open: boolean;
  actions: ActionButton[];
  onClose: () => void;
}

const CafeCongestionPopup = ({ open, actions, onClose }: CongestionProps) => {
  const theme = useTheme();
  const mainColor = theme.palette.primary.main;
  const grayColor = theme.palette.grey[400];

  // 커피콩 조회 react query 문
  const { data } = useQuery(['coffeeBean'], () => getCoffeeBean());
  return (
    <Popup
      open={open}
      content={
        <>
          <Typography>혼잡도를 확인하시겠습니까?</Typography>
          <Typography variant="subtitle2" color={grayColor} mt="10px" mb="10px">
            잔여 커피콩: {data}개
          </Typography>
          <CongestionCoffee>
            <Image src={coffeebean} alt="" />
            <Typography variant="subtitle1" color={mainColor}>
              2
            </Typography>
            <Typography variant="subtitle2" mr="2px">
              개 차감
            </Typography>
          </CongestionCoffee>
        </>
      }
      onClose={onClose}
      actions={actions}
    />
  );
};
export default CafeCongestionPopup;
