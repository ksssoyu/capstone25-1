import { useTheme } from '@mui/material';

import { CafeInfo } from '~/types/cafeInfo';
import CafeCongestionStatus from './CafeCongestionStatus';
import CafeDetailTitle from './CafeDetailTitle';
import { CafeContentContainer } from './cafeDetailInfo.styled';

const decodeHtmlEntities = (str: string) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

const isCafeOpenNow = (openingHours: string | null | undefined): boolean => {
  if (!openingHours) return false;

  try {
    // ⭐ 먼저 HTML 엔티티 디코딩
    const decoded = decodeHtmlEntities(openingHours);

    const parsed = JSON.parse(decoded); // ✅ 이제 제대로 파싱됨

    const now = new Date();
    const currentDay = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const period = parsed?.periods?.find(
      (p: any) => p.open.day === currentDay
    );
    if (!period) return false;

    const openTime = (period.open.hour ?? 0) * 60 + (period.open.minute ?? 0);
    const closeTime = (period.close.hour ?? 0) * 60 + (period.close.minute ?? 0);

    if (closeTime <= openTime) {
      return nowMinutes >= openTime || nowMinutes < closeTime;
    }

    return nowMinutes >= openTime && nowMinutes < closeTime;
  } catch (err) {
    console.error('❌ openingHours 파싱 실패:', err);
    return false;
  }
};

interface DetailProps {
  data: CafeInfo;
}

const CafeDetailTitleHeader = ({ data }: DetailProps) => {
  const theme = useTheme();
  const grayColor = theme.palette.grey[100];
  const openingHours = data.openingHours;
  let openStatusText = '';
  if (openingHours === '{}') {
    openStatusText = '영업정보없음';
  }
  else {
    openStatusText = isCafeOpenNow(openingHours) ? '영업중' : '영업종료';
  }

  return (
    <CafeContentContainer color={grayColor}>
      <CafeDetailTitle
        name={data.name}
        openStatus={openStatusText}
        address={data.address}
      />
      <CafeCongestionStatus congestion={data.averageCongestion} />
    </CafeContentContainer>
  );
};

export default CafeDetailTitleHeader;