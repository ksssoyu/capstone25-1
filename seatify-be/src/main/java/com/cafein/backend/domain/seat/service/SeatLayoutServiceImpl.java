package com.cafein.backend.domain.seat.service;

import com.cafein.backend.domain.cafe.entity.Cafe;
import com.cafein.backend.domain.cafe.repository.CafeRepository;
import com.cafein.backend.domain.seat.entity.SeatLayout;
import com.cafein.backend.domain.seat.entity.Seat;
import com.cafein.backend.domain.seat.repository.SeatLayoutRepository;
import com.cafein.backend.domain.seat.repository.SeatRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SeatLayoutServiceImpl implements SeatLayoutService {

    private final CafeRepository cafeRepository;
    private final SeatLayoutRepository seatLayoutRepository;
    private final SeatRepository seatRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void saveSeatLayoutFromJson(Long cafeId, String jsonData) {
        try {
            Cafe cafe = cafeRepository.findById(cafeId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid cafe ID"));

            // 기존 좌석 및 레이아웃 삭제 (중복 방지)
            seatLayoutRepository.deleteByCafe_CafeId(cafeId);
            seatRepository.deleteByCafe_CafeId(cafeId);

            JsonNode root = objectMapper.readTree(jsonData);
            if (!root.isArray()) {
                throw new IllegalArgumentException("Expected a JSON array");
            }

            for (JsonNode seatNode : root) {
                int seatNumber = seatNode.get("seatID").asInt();
                int x = seatNode.get("x").asInt();
                int y = seatNode.get("y").asInt();
                int width = seatNode.get("width").asInt();
                int height = seatNode.get("height").asInt();

                // SeatLayout 저장
                SeatLayout layout = new SeatLayout(cafe, seatNumber, x, y, width, height);
                seatLayoutRepository.save(layout);

                // Seat 저장 (Builder 사용)
                Seat seat = Seat.builder()
                        .cafe(cafe)
                        .seatNumber(seatNumber)
                        .isOccupied(false)
                        .x(x)
                        .y(y)
                        .width(width)
                        .height(height)
                        .build();

                seatRepository.save(seat);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse and save seat layout", e);
        }
    }
}
