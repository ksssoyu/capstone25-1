import { ListItem, ListItemButton, Typography, useTheme } from '@mui/material';
import { RadioStatusButton } from '~/components/molecule/radioButtons';
import { CafeInfo } from '~/types/cafeInfo';
import { CafeStatusTypography } from '~/components/organism/cafeDetailInfo/cafeDetailInfo.styled';
import { CafeBox, CafeInfoTitle } from './cafeInfo.styled';
import { useEffect, useState } from 'react';
import { fetchSeats } from '~/pages/api/seat/getSeats';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';

interface CafeInfoProp {
  cafeClickHandler: () => void;
  cafes: CafeInfo;
}

// ✅ HTML 인코딩된 문자열(&quot;) → 원래 JSON 문자열로 디코딩
const decodeHtmlEntities = (str: string) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

const isCafeOpenNow = (openingHoursJson: string | null) => {
  if (!openingHoursJson) return false;
  try {
    const decoded = decodeHtmlEntities(openingHoursJson);
    const openingHours = JSON.parse(decoded);
    const now = new Date();
    const currentDay = now.getDay(); // 일요일 = 0
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const period = openingHours?.periods?.find(
        (p: any) => p.open.day === currentDay
    );

    if (!period) return false;

    const openTime = (p: any) => (p.open.hour ?? 0) * 60 + (p.open.minute ?? 0);
    const closeTime = (p: any) =>
        (p.close?.hour ?? 0) * 60 + (p.close?.minute ?? 0);

    const openMinutes = openTime(period);
    const closeMinutes = closeTime(period);

    // 자정을 넘는 시간대 처리 (ex. 22:00 ~ 02:00)
    if (closeMinutes <= openMinutes) {
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  } catch (err) {
    console.error('openingHours 파싱 에러:', err);
    return false;
  }
};

const CafeInfo = ({ cafeClickHandler, cafes }: CafeInfoProp) => {
  const theme = useTheme();
  const grayColor = theme.palette.grey[100];
  const token = useSelector((state: RootState) => state.auth.auth.access_token);

  const openingHours = cafes.openingHours;
  let openStatus = '';
  if (openingHours === '{}') {
    openStatus = '영업정보없음';
  } else {
    openStatus = isCafeOpenNow(openingHours) ? '영업중' : '영업종료';
  }

  const statusColor = openStatus === '영업중'
      ? '#bbeba7'
      : openStatus === '영업정보없음'
          ? grayColor
          : '#f2c8c4';

  const [seatStatus, setSeatStatus] = useState<'1' | '2' | '3'>('1');

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
              <CafeStatusTypography
                  color={statusColor}
                  variant="subtitle2"
              >
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
