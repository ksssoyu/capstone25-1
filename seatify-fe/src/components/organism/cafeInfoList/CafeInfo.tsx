import {
  ListItem,
  ListItemButton,
  Typography,
  useTheme,
} from '@mui/material';
import { RadioStatusButton } from '~/components/molecule/radioButtons';
import { CafeInfo } from '~/types/cafeInfo';
import { CafeStatusTypography } from '~/components/organism/cafeDetailInfo/cafeDetailInfo.styled';
import { useEffect, useState } from 'react';
import { fetchSeats } from '~/pages/api/seat/getSeats';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { CafeBox, CafeInfoTitle } from './cafeInfo.styled';

interface CafeInfoProp {
  cafeClickHandler: () => void;
  cafes: CafeInfo;
}

// ✅ SSR 환경에서는 window 객체가 없기 때문에 안전하게 체크
const isBrowser = typeof window !== 'undefined';

// ✅ HTML entity decoding 함수 (브라우저 환경에서만 실행)
const decodeHtmlEntities = (str: string) => {
  if (!isBrowser) return str;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

// ✅ 카페 영업 여부 계산 함수 (브라우저에서만 동작)
const calculateOpenStatus = (openingHoursJson: string | null) => {
  if (!openingHoursJson || !isBrowser) return '영업정보없음';

  try {
    const decoded = decodeHtmlEntities(openingHoursJson);
    const openingHours = JSON.parse(decoded);
    const now = new Date();
    const currentDay = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const period = openingHours?.periods?.find(
        (p: any) => p.open.day === currentDay
    );
    if (!period) return '영업정보없음';

    const openMinutes = (period.open.hour ?? 0) * 60 + (period.open.minute ?? 0);
    const closeMinutes = (period.close?.hour ?? 0) * 60 + (period.close?.minute ?? 0);

    if (closeMinutes <= openMinutes) {
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes
          ? '영업중'
          : '영업종료';
    }

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes
        ? '영업중'
        : '영업종료';
  } catch (e) {
    console.error('openingHours 파싱 에러:', e);
    return '영업정보없음';
  }
};

const CafeInfo = ({ cafeClickHandler, cafes }: CafeInfoProp) => {
  const theme = useTheme();
  const grayColor = theme.palette.grey[100];
  const token = useSelector((state: RootState) => state.auth.auth.access_token);

  const [openStatus, setOpenStatus] = useState('영업정보없음');
  const [seatStatus, setSeatStatus] = useState<'1' | '2' | '3'>('1');

  // ✅ 클라이언트에서만 영업 상태 계산
  useEffect(() => {
    if (isBrowser && cafes.openingHours && cafes.openingHours !== '{}') {
      const status = calculateOpenStatus(cafes.openingHours);
      setOpenStatus(status);
    }
  }, [cafes.openingHours]);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const data = await fetchSeats(cafes.cafeId, token);
        const occupied = data.filter((s) => s.occupied).length;
        const ratio = occupied / data.length;
        const level = ratio <= 0.3 ? '1' : ratio <= 0.7 ? '2' : '3';
        setSeatStatus(level);
      } catch (e) {
        console.warn('좌석 정보 불러오기 실패', e);
      }
    };
    fetchSeatData();
  }, [cafes.cafeId, token]);

  const statusColor =
      openStatus === '영업중'
          ? '#bbeba7'
          : openStatus === '영업정보없음'
              ? grayColor
              : '#f2c8c4';

  return (
      <ListItem>
        <ListItemButton onClick={cafeClickHandler}>
          <CafeBox>
            <CafeInfoTitle>
              <Typography variant="h5" mr="4px">
                {cafes.name}
              </Typography>
              <RadioStatusButton status={seatStatus} />
            </CafeInfoTitle>

            <Typography variant="body2" mt="5px">
              {cafes.address}
            </Typography>

            <CafeInfoTitle>
              <CafeStatusTypography color={statusColor} variant="subtitle2">
                {openStatus}
              </CafeStatusTypography>
              <Typography
                  variant="subtitle2"
                  color="grey"
                  mt="12px"
                  mb="10px"
                  ml="10px"
              >
                후기{cafes.commentReviewCount}
              </Typography>
            </CafeInfoTitle>
          </CafeBox>
        </ListItemButton>
      </ListItem>
  );
};

export default CafeInfo;
