package com.cafein.backend.domain.seat.repository;

import com.cafein.backend.domain.cafe.entity.Cafe;
import com.cafein.backend.domain.seat.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByCafe(Cafe cafe);

    List<Seat> findByCafe_CafeId(Long cafeId);
}
