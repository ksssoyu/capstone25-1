import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { fetchSeats } from '~/pages/api/seat/getSeats'; // 좌석 정보 API 호출 함수
import { useSelector } from 'react-redux';
import { RootState } from '~/store'; // Redux 상태 타입

// 좌석 정보 타입 정의
interface Seat {
  seatId: number;
  seatNumber: number;
  occupied: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SeatList = ({ cafeId }: { cafeId: string }) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useSelector((state: RootState) => state.auth.auth.access_token);

  useEffect(() => {
    if (!token) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const getSeats = async () => {
      try {
        const data = await fetchSeats(cafeId, token);
        setSeats(data);
      } catch (err) {
        console.error('좌석 정보를 불러오는 데 실패했습니다', err);
        setError('좌석 정보를 불러오는 데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    getSeats();
  }, [cafeId, token]);

  const SCALE_Y = 0.1; // 높이 축소 비율 (y가 4000이면 400으로 줄어듦)

  if (loading) {
    return <Typography>로딩 중...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ position: 'relative', width: 640, height: 480 }}>
        {seats.map((seat) => (
          <Box
            key={seat.seatId}
            sx={{
              position: 'absolute',
              left: seat.x,
              top: 30,
              width: seat.width,
              height: seat.height,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '2px solid',
              borderColor: seat.occupied ? 'lightcoral' : 'lightgreen',
              borderRadius: '8px',
              backgroundColor: seat.occupied ? 'lightcoral' : 'lightgreen',
              color: 'white',
              fontWeight: 'bold',
              padding: '4px',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="h6"
              noWrap
              sx={{ fontSize: '0.8rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              좌석 {seat.seatNumber}
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontSize: '0.7rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {seat.occupied ? '사용 중' : '빈 자리'}
            </Typography>
          </Box>

        ))}
      </Box>
    </Box>
  );
};

export default SeatList;
