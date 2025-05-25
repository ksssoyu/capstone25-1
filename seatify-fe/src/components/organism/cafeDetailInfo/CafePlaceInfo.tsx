/**
 * @createBy 한수민
 * @description 카페 디테일 장소 컴포넌트
 */

import { Box, Typography, useTheme } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CallIcon from '@mui/icons-material/Call';

import { LabelItems } from '~/components/molecule/label';
import { useNavigationSelector } from '~/store/reducers/navigateSlice';
import ModalLabel from '~/components/molecule/modalLabel';
import {
  CafePlaceContainer,
  CongestionBox,
  CongestionItem,
} from './cafeDetailInfo.styled';

interface CafePlaceInfoProps {
  address: string;
  phoneNumber: string;
  isCongestion: boolean;
  hasPlugCount: number;
  isCleanCount: number;
}

const CafePlaceInfo = ({
  address,
  phoneNumber,
  isCongestion,
  hasPlugCount,
  isCleanCount,
}: CafePlaceInfoProps) => {
  const theme = useTheme();
  const grayColor = theme.palette.grey[100];
  const iconColor = theme.palette.grey[300];
  const mainColor = theme.palette.primary.main;

  const navigate = useNavigationSelector();
  return (
    <CafePlaceContainer color={grayColor} icon={iconColor}>
      <Typography variant="h4" mt="24px" mb="2px">
        매장 정보
      </Typography>

      {navigate !== 'search-detail' && (
        <>
          <Box className="cafe-info">
            <PlaceIcon />
            <Typography variant="body2">{address}</Typography>
          </Box>

          <Box className="cafe-info">
            <CallIcon />
            <Typography variant="body2">
              {phoneNumber && phoneNumber.trim() !== ''
                ? phoneNumber
                : '정보 없음'}
            </Typography>
          </Box>
        </>
      )}

      {isCongestion && (
        <CongestionBox>
          <CongestionItem>
            <LabelItems hasPlug isClean={false} />
            <Typography color={mainColor}>{hasPlugCount}</Typography>
          </CongestionItem>
          <CongestionItem>
            <LabelItems isClean hasPlug={false} />
            <Typography color={mainColor}>{isCleanCount}</Typography>
          </CongestionItem>
        </CongestionBox>
      )}
      {!isCongestion && navigate === 'search-detail' ? (
        <ModalLabel type="search" onClick={() => {}} />
      ) : (
        <ModalLabel onClick={() => {}} />
      )}
    </CafePlaceContainer>
  );
};
export default CafePlaceInfo;
