package com.cafein.backend.domain.seat.service;

import com.cafein.backend.domain.cafe.entity.Cafe;
import com.cafein.backend.domain.cafe.repository.CafeRepository;
import com.cafein.backend.domain.seat.entity.SeatLayout;
import com.cafein.backend.domain.seat.repository.SeatLayoutRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SeatLayoutServiceImpl implements SeatLayoutService {

    private final CafeRepository cafeRepository;
    private final SeatLayoutRepository seatLayoutRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void saveSeatLayoutFromJson(Long cafeId, String jsonData) {
        try {
            Cafe cafe = cafeRepository.findById(cafeId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid cafe ID"));

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

                SeatLayout layout = new SeatLayout(cafe, seatNumber, x, y, width, height);
                seatLayoutRepository.save(layout);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse and save seat layout", e);
        }
    }

}