package com.cafein.backend.api.cafe.dto;

import java.util.List;

import com.cafein.backend.api.comment.dto.CommentInfoDTO;
import com.cafein.backend.api.seat.dto.SeatDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@JsonPropertyOrder({
		"cafeInfo",
		"comments"
})
@Builder
@Getter
public class CafeDTO {
	private CafeInfoResponseDTO cafeInfo;
	private List<SeatDTO> seats; // 자리 정보 추가
	private List<CommentInfoDTO> comments;
}