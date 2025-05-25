package com.cafein.backend.domain.seat.service;

import com.cafein.backend.api.seat.dto.SeatDTO;
import org.springframework.stereotype.Service;

import com.cafein.backend.domain.seat.entity.Seat;
import com.cafein.backend.domain.seat.repository.SeatRepository;

import javax.transaction.Transactional;
import java.util.List;

@Service
public class SeatService {

    private final SeatRepository seatRepository;

    public SeatService(SeatRepository seatRepository) {
        this.seatRepository = seatRepository;
    }

    // 카페의 좌석 정보를 반환하는 메소드
    public List<Seat> findSeatsByCafeId(Long cafeId) {
        return seatRepository.findByCafe_CafeId(cafeId); // 카페 ID에 해당하는 좌석 정보 반환
    }

    @Transactional
    public void updateSeats(Long cafeId, List<SeatDTO> seats) {
        for (SeatDTO dto : seats) {
            Seat seat = seatRepository.findById(dto.getSeatID())
                    .orElseThrow(() -> new IllegalArgumentException("Seat not found with ID: " + dto.getSeatID()));

            // 상태(state) 기준으로 occupied 필드 업데이트
            seat.setOccupied("using_table".equals(dto.getState()));

            // 원하면 좌표값 등도 업데이트 가능
            seat.setX(dto.getX());
            seat.setY(dto.getY());
            seat.setWidth(dto.getWidth());
            seat.setHeight(dto.getHeight());

            seatRepository.save(seat);
        }
    }

}
