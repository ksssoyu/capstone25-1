import React from 'react';
import { Box, Typography } from '@mui/material';

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

interface SeatListProps {
  seats: Seat[];
}

const SeatList = ({ seats }: SeatListProps) => {
  return (
      <Box sx={{ position: 'relative', width: 640, height: 480 }}>
        {seats.map((seat) => (
            <Box
                key={seat.seatId}
                sx={{
                  position: 'absolute',
                  left: seat.x,
                  top: seat.y * 0.1,
                  width: seat.width,
                  height: seat.height,
                  backgroundColor: seat.occupied ? 'lightcoral' : 'lightgreen',
                  border: '2px solid',
                  borderColor: seat.occupied ? 'lightcoral' : 'lightgreen',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '4px',
                }}
            >
              <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>좌석 {seat.seatNumber}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                {seat.occupied ? '사용 중' : '빈 자리'}
              </Typography>
            </Box>
        ))}
      </Box>
  );
};


export default SeatList;
