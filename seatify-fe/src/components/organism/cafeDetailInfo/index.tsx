/**
 * @createBy 한수민
 * @description 카페 디테일 컴포넌트
 */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItem,
  Typography,
} from '@mui/material';

import { CafeInfo } from '~/types/cafeInfo';
import { useState } from 'react';
import CafePlaceInfo from './CafePlaceInfo';
import { CafeDetailContainer } from './cafeDetailInfo.styled';
import CafeDetailTitleHeader from './CafeDetailTitleHeader';
import SeatList from '~/components/organism/seatList/SeatList'; // 좌석 리스트 컴포넌트 임포트
import ReviewList from '~/components/organism/reviewList/ReviewList';
import CommunityCommentList from '~/components/organism/communityCommentList/CommunityCommentList';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';

interface DetailProps {
  data: CafeInfo;
}

// ✅ HTML 인코딩된 문자열(&quot;) → 원래 JSON 문자열로 디코딩
const decodeHtmlEntities = (str: string) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

const CafeDetailInfo = ({ data }: DetailProps) => {
  const [open, setOpen] = useState(false); // 모달 열기/닫기 상태
  const [commentOpen, setCommentOpen] = useState(false);

  const handleCommentDialogOpen = () => {
    setCommentOpen(true);
  };

  const handleCommentDialogClose = () => {
    setCommentOpen(false);
  };

  // 모달을 열고 닫는 함수
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const cafe = data.cafeInfo;
  const decodedReviews =
    typeof cafe.reviews === 'string' ? JSON.parse(decodeHtmlEntities(cafe.reviews)) : cafe.reviews;

  const token = useSelector((state: RootState) => state.auth.auth.access_token); // Redux에서 access_token 가져오기

  return (
    <ListItem>
      {cafe ? (
        <CafeDetailContainer>
          <CafeDetailTitleHeader data={cafe} />
          <CafePlaceInfo
            address={cafe.address}
            phoneNumber={cafe.phoneNumber}
            isCongestion={data.averageCongestion !== '0'}
            hasPlugCount={cafe.hasPlugCount}
            isCleanCount={cafe.isCleanCount}
          />
          <Box display="flex" gap={2} mt={2}>
            <Button onClick={handleClickOpen}>좌석 보기</Button>
            <Button onClick={handleCommentDialogOpen}>커뮤니티 보기</Button>
          </Box>
          <Dialog
            open={open}
            onClose={handleClose}
            BackdropProps={{
              style: {
                backgroundColor: 'rgba(0, 0, 0, 0.3)', // 배경 어두운 색 조절
              },
            }}
            sx={{
              '& .MuiDialog-paper': {
                backgroundColor: 'white', // 모달 내용 부분을 흰색으로 설정
                borderRadius: '8px', // 모달 내용 부분 둥근 테두리
                width: '80%', // 너비를 80%로 설정
                maxWidth: '800px', // 최대 너비를 800px로 설정
                height: 'auto', // 높이를 자동으로 설정
                padding: '20px', // 내부 여백을 20px로 설정
              },
            }}
          >
            <DialogTitle>
              <Typography variant="h2">좌석 상세 정보</Typography>
            </DialogTitle>
            <DialogContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                overflow: 'visible',
                maxHeight: 'unset',
                paddingBottom: '24px',
              }}
            >
              <Box mb={2}>
                <img
                  src={`images/cafe/${cafe.cafeId}.png`}
                  alt={`Cafe ${cafe.cafeId}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: '600px',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </Box>

              <Box>
                <SeatList cafeId={cafe.cafeId} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                닫기
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={commentOpen}
            onClose={handleCommentDialogClose}
            BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.3)' } }}
            sx={{
              '& .MuiDialog-paper': {
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '80%',
                maxWidth: '800px',
                padding: '20px',
              },
            }}
          >
            <DialogTitle>
              <Typography variant="h2">커뮤니티 댓글</Typography>
            </DialogTitle>
            <DialogContent>
              <CommunityCommentList cafeId={cafe.cafeId} token={token} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCommentDialogClose} color="primary">
                닫기
              </Button>
            </DialogActions>
          </Dialog>
          <ReviewList reviews={decodedReviews} />
        </CafeDetailContainer>
      ) : (
        <div>카페 상세 정보를 불러오는 중입니다...</div>
      )}
    </ListItem>
  );
};

export default CafeDetailInfo;
