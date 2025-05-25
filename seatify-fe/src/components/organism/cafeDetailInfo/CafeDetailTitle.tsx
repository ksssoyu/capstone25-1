/**
 * @createBy 한수민
 * @description 카페 디테일 제목 컴포넌트(리뷰 등록)
 */

import { useCallback, useMemo, useState } from 'react';

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';

import { WriteButton } from '~/components/atom/buttons';
import { ActionButton } from '~/types/popup';
import { query } from '~/helpers/mobileQuery';
import CafeResponsePopup from '~/components/molecule/cafeResponsePopup';
import { useNavigationSelector } from '~/store/reducers/navigateSlice';
import { useCafeIdSelector } from '~/store/reducers/cafeIdSlice';
import CafeReviewModal from './CafeReviewModal';
import {
  CafeStatusTypography,
  CafeTitle,
  CafeTitleContainer,
} from './cafeDetailInfo.styled';
import CafeReviewMobileModal from './mobile/CafeReviewMobileModal';

interface CafeTitleProps {
  name: string;
  openStatus: string;
  address: string;
}

const CafeDetailTitle = ({ name, openStatus, address }: CafeTitleProps) => {
  const { cafeId } = useCafeIdSelector();
  const theme = useTheme();
  const navigate = useNavigationSelector();
  const grayColor = theme.palette.grey[100];

  const isMobile = useMediaQuery(query, { noSsr: true });

  // 리뷰 등록 모달 상태
  const [reviewOpen, setReviewOpen] = useState<boolean>(false);
  // 리뷰 등록 성공 팝업 모달 상태
  const [reviewPopUp, setReviewPopUp] = useState<boolean>(false);

  // 리뷰 Modal 열기 함수
  const openReviewHandler = useCallback(() => {
    setReviewOpen(true);
  }, []);

  // 리뷰 성공 팝업 열기 함수
  const openReviewPopup = useCallback(() => {
    setReviewPopUp(true);
  }, []);

  // 리뷰 성공 팝업 닫기 함수
  const closePopup = useCallback(() => {
    setReviewPopUp(false);
  }, []);

  // 리뷰 성공 팝업 확인 함수
  const onConfirm = useCallback(() => {
    closePopup();
  }, [closePopup]);

  // 리뷰 성공 팝업 Button 목록
  const actions: ActionButton[] = useMemo(() => {
    return [
      {
        title: '다른 카페 정보 보러가기',
        type: 'confirm',
        onClick: onConfirm,
      },
      { title: '확인', type: 'close', onClick: closePopup },
    ];
  }, [closePopup, onConfirm]);

  // 리뷰 Modal 닫기 함수
  const closeReviewHandler = useCallback(() => {
    setReviewOpen(false);
  }, []);

  const statusColor = openStatus === '영업중'
    ? '#bbeba7'
    : openStatus === '영업정보없음'
      ? grayColor // 회색으로 설정
      : '#f2c8c4'; // 영업종료일 때 색상

  return (
    <Box>
      {/* 카페 리뷰 등록 모달 */}
      {isMobile ? (
        <CafeReviewMobileModal
          cafeId={cafeId}
          open={reviewOpen}
          onClose={closeReviewHandler}
          title={name}
          reviewSuccess={openReviewPopup}
        />
      ) : (
        <CafeReviewModal
          cafeId={cafeId}
          open={reviewOpen}
          onClose={closeReviewHandler}
          title={name}
          reviewSuccess={openReviewPopup}
        />
      )}

      {/* 카페 리뷰 등록 성공 팝업 모달 */}
      <CafeResponsePopup
        openPopup={reviewPopUp}
        actions={actions}
        closePopup={closePopup}
        type="success"
      />

      <CafeTitle>
        <Box>
          <Typography variant="h3" mr="4px" mt="7px">
            {name}
          </Typography>
          <CafeTitleContainer>
            {navigate === 'search-detail' && <CallIcon className="mui-icon" />}
            <CafeStatusTypography
              color={statusColor}
              variant="subtitle2"
            >
              {openStatus}
            </CafeStatusTypography>
            {isMobile && (
              <Typography variant="subtitle2" mt="7px" ml="5px">
                {address}
              </Typography>
            )}
          </CafeTitleContainer>
        </Box>
        {/* 리뷰 작성 버튼 */}
        <WriteButton onClick={openReviewHandler} />
      </CafeTitle>
    </Box>
  );
};
export default CafeDetailTitle;
