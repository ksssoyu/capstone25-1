package com.cafein.backend.api.seat.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SeatResponseDTO {
    private Long seatId;
    private int seatNumber;
    private boolean isOccupied;

    private int x;
    private int y;
    private int width;
    private int height;

    public SeatResponseDTO(Long seatId, int seatNumber, boolean isOccupied, int x, int y, int width, int height) {
        this.seatId = seatId;
        this.seatNumber = seatNumber;
        this.isOccupied = isOccupied;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
