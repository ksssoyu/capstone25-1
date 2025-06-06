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
import SeatList from '~/components/organism/seatList/SeatList';
import ReviewList from '~/components/organism/reviewList/ReviewList';
import CommunityCommentList from '~/components/organism/communityCommentList/CommunityCommentList';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '~/store';
import getAllCafeInfo from '~/pages/api/home/getAllCafeInfo';
import { useQuery } from '@tanstack/react-query';
import { fetchSeats } from '~/pages/api/seat/getSeats';
import { setCafeId } from '~/store/reducers/cafeIdSlice';
import { setNavigationContent } from '~/store/reducers/navigateSlice';
import CafeDetailTitleHeader from './CafeDetailTitleHeader';
import { CafeDetailContainer } from './cafeDetailInfo.styled';
import CafePlaceInfo from './CafePlaceInfo';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface DetailProps {
  data: CafeInfo;
}

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
    const currentDay = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const period = openingHours?.periods?.find(
        (p: any) => p.open.day === currentDay
    );
    if (!period) return false;

    const openMinutes =
        (period.open.hour ?? 0) * 60 + (period.open.minute ?? 0);
    const closeMinutes =
        (period.close?.hour ?? 0) * 60 + (period.close?.minute ?? 0);

    if (closeMinutes <= openMinutes) {
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  } catch (err) {
    console.error('openingHours 파싱 에러:', err);
    return false;
  }
};

const CafeDetailInfo = ({ data }: DetailProps) => {
  const [open, setOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendedCafe, setRecommendedCafe] = useState<CafeInfo | null>(null);
  const [recommendedViewerCount, setRecommendedViewerCount] = useState<number | null>(null);
  const [recommendedSeatInfo, setRecommendedSeatInfo] = useState<{ total: number; vacant: number } | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatInfo, setSeatInfo] = useState({ total: 0, vacant: 0 });
  const [seatCongestion, setSeatCongestion] = useState<'1' | '2' | '3'>('1');
  const videoRef = useRef<HTMLVideoElement>(null);  // ✅ 비디오 ref 추가

  const cafe = data.cafeInfo;
  const decodedReviews =
      typeof cafe.reviews === 'string'
          ? JSON.parse(decodeHtmlEntities(cafe.reviews))
          : cafe.reviews;

  const token = useSelector((state: RootState) => state.auth.auth.access_token);
  const { data: allCafes } = useQuery<CafeInfo[]>(['cafeList'], () => getAllCafeInfo(token), { enabled: !!token });

  const dispatch = useDispatch();

  const handleClickOpen = async () => {
    setOpen(true);

    // detect 시작
    try {
      await axios.post('http://localhost:5001/start-detect', { cafeId: cafe.cafeId });
      console.log('Detect 시작 요청 성공');
    } catch (err) {
      console.error('Detect 시작 요청 실패:', err);
    }
  };

  const handleClose = async () => {
    setOpen(false);

    // detect 중지 요청 (모달 닫을 때)
    try {
      await axios.post('http://localhost:5001/stop-detect', { cafeId: cafe.cafeId });
      console.log('Detect 중지 요청 성공');
    } catch (err) {
      console.error('Detect 중지 요청 실패:', err);
    }
  };

  // ✅ 영상 자동재생 안정성 보장
  useEffect(() => {
    if (open && cafe.cafeId === '20' && videoRef.current) {
      const videoEl = videoRef.current;
      videoEl.play().catch((e) => {
        console.warn('Autoplay 실패:', e);
      });
    }
  }, [open, cafe.cafeId]);

  const handleCommentDialogOpen = () => setCommentOpen(true);
  const handleCommentDialogClose = () => setCommentOpen(false);

  const handleSelectRecommendedCafe = () => {
    if (recommendedCafe) {
      dispatch(setCafeId({ cafeId: recommendedCafe.cafeId, commentId: '0' }));
      dispatch(setNavigationContent('content'));
      setRecommendOpen(false);
    }
  };

  // 좌석 데이터 가져오기 (polling용)
  const fetchSeatData = async () => {
    if (!token || !cafe?.cafeId) return;
    try {
      const data = await fetchSeats(cafe.cafeId, token);
      setSeats(data);

      const occupied = data.filter((s) => s.occupied).length;
      const vacant = data.length - occupied;
      setSeatInfo({ total: data.length, vacant });

      const ratio = occupied / data.length;
      setSeatCongestion(ratio <= 0.3 ? '1' : ratio <= 0.7 ? '2' : '3');
    } catch (e) {
      console.warn('좌석 정보 불러오기 실패', e);
    }
  };

  // viewer count (1번만 호출)
  useEffect(() => {
    const fetchViewerCount = async () => {
      if (!cafe?.cafeId || !token || !allCafes) return;
      try {
        const res = await fetch(`http://localhost:8080/api/cafe-view/count?cafe_id=${cafe.cafeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setViewerCount(result);

        const congestionWeight = seatCongestion === '3' ? 2 : seatCongestion === '2' ? 1 : 0;
        const VIEWER_THRESHOLD = 1;

        if (result >= VIEWER_THRESHOLD) {
          const scoredCandidates = [];
          for (const candidate of allCafes) {
            if (candidate.cafeId === cafe.cafeId) continue;
            if (!isCafeOpenNow(candidate.openingHours)) continue;

            const altRes = await fetch(`http://localhost:8080/api/cafe-view/count?cafe_id=${candidate.cafeId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const altViewer = await altRes.json();

            const seatRes = await fetchSeats(candidate.cafeId, token);
            const occupied = seatRes.filter((s) => s.occupied).length;
            const vacant = seatRes.length - occupied;
            const ratio = seatRes.length > 0 ? occupied / seatRes.length : 0;
            const seatLevel = ratio <= 0.3 ? 1 : ratio <= 0.7 ? 2 : 3;

            const score = congestionWeight * 4 + seatLevel * 2 - (candidate.hasPlugCount || 0) - (candidate.isCleanCount || 0);

            scoredCandidates.push({ ...candidate, score, altViewer, seatInfo: { total: seatRes.length, vacant } });
          }

          const sorted = scoredCandidates.sort((a, b) => a.score - b.score);
          for (const candidate of sorted) {
            if (candidate.altViewer < VIEWER_THRESHOLD) {
              setRecommendedCafe(candidate);
              setRecommendedViewerCount(candidate.altViewer);
              setRecommendedSeatInfo(candidate.seatInfo);
              break;
            }
          }
          setRecommendOpen(true);
        }
      } catch (err) {
        console.warn('viewer count fetch failed:', err);
      }
    };

    fetchViewerCount();
  }, [cafe?.cafeId, token, allCafes, seatCongestion]);

  // 좌석 상태 polling 관리
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (!cafe?.cafeId || !token) return;

    const startPolling = () => {
      fetchSeatData(); // 최초 호출
      if (cafe.cafeId === '20') {
        console.log('Polling started!');
        intervalId = setInterval(fetchSeatData, 3000);
      }
    };

    startPolling();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Polling stopped!');
      }
    };
  }, [cafe?.cafeId, token]);

  return (
      <ListItem component="div">
        {cafe ? (
            <CafeDetailContainer>
              <CafeDetailTitleHeader data={cafe} seatCongestion={seatCongestion} token={token} />
              <CafePlaceInfo
                  address={cafe.address}
                  phoneNumber={cafe.phoneNumber}
                  isCongestion={seatCongestion !== '1'}
                  hasPlugCount={cafe.hasPlugCount}
                  isCleanCount={cafe.isCleanCount}
                  viewerCount={viewerCount}
                  seatVacantCount={seatInfo.vacant}
                  seatTotalCount={seatInfo.total}
              />
              <Box display="flex" gap={2} mt={2}>
                <Button onClick={handleClickOpen}>좌석 보기</Button>
                <Button onClick={handleCommentDialogOpen}>커뮤니티 보기</Button>
              </Box>

              {/* 좌석 보기 Dialog */}
              <Dialog open={open} onClose={handleClose} BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.3)' } }}
                      sx={{ '& .MuiDialog-paper': { backgroundColor: 'white', borderRadius: '8px', width: '80%', maxWidth: '800px', padding: '20px' } }}>
                <DialogTitle><Typography variant="h2">좌석 상세 정보</Typography></DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                  <Box mb={2}>
                    {cafe.cafeId === '20' ? (
                        <video
                            ref={videoRef}
                            width="100%"
                            controls
                            muted
                            autoPlay
                            playsInline  // ✅ 모바일 브라우저 호환성 개선
                            src="/videos/cafe.mp4"
                            style={{ borderRadius: '8px' }}
                        />
                    ) : (
                        <img
                            src={`/images/cafe/${cafe.cafeId}.png`}
                            alt={`Cafe ${cafe.cafeId}`}
                            style={{ width: '100%', borderRadius: '8px' }}
                        />
                    )}
                  </Box>
                  <SeatList seats={seats} />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">닫기</Button>
                </DialogActions>
              </Dialog>

              {/* 추천 Dialog */}
              <Dialog open={recommendOpen} onClose={() => setRecommendOpen(false)} BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.3)' } }}
                      sx={{ '& .MuiDialog-paper': { backgroundColor: 'white', borderRadius: '8px', width: '70%', maxWidth: '600px', padding: '24px', textAlign: 'center' } }}>
                <DialogTitle>📢 혼잡도 안내</DialogTitle>
                <DialogContent>
                  <Typography variant="body1" mb={2}>현재 <strong style={{ color: '#ff4d4f' }}>{viewerCount}</strong>명이 이 카페를 보고 있어요.</Typography>
                  <Typography variant="body2" color="text.secondary">더 여유로운 카페도 함께 확인해보는 건 어떠세요?</Typography>
                  {recommendedCafe ? (
                      <Box mt={2}>
                        <Typography variant="body2" fontWeight="bold" color="primary">👉 추천: {recommendedCafe.name}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{recommendedCafe.address}</Typography>
                        {recommendedViewerCount !== null && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>현재 <strong>{recommendedViewerCount}</strong>명이 보고 있어요.</Typography>
                        )}
                        {recommendedSeatInfo && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>🪑 좌석 상태: {recommendedSeatInfo.vacant} / {recommendedSeatInfo.total}</Typography>
                        )}
                        <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={handleSelectRecommendedCafe}>이 카페 보러가기</Button>
                      </Box>
                  ) : (
                      <Typography variant="caption" color="text.secondary" mt={2}>지금은 대체 카페 추천이 어렵습니다.</Typography>
                  )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}><Button variant="contained" onClick={() => setRecommendOpen(false)}>닫기</Button></DialogActions>
              </Dialog>

              {/* 댓글 Dialog */}
              <Dialog open={commentOpen} onClose={handleCommentDialogClose} BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.3)' } }}
                      sx={{ '& .MuiDialog-paper': { backgroundColor: 'white', borderRadius: '8px', width: '80%', maxWidth: '800px', padding: '20px' } }}>
                <DialogTitle><Typography variant="h2">커뮤니티 댓글</Typography></DialogTitle>
                <DialogContent><CommunityCommentList cafeId={cafe.cafeId} token={token} /></DialogContent>
                <DialogActions><Button onClick={handleCommentDialogClose} color="primary">닫기</Button></DialogActions>
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
