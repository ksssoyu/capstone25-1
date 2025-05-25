package com.cafein.backend.domain.cafe.service;

import java.util.List;
import java.util.stream.Collectors;

import com.cafein.backend.api.cafe.dto.CafeInfoResponseDTO;
import com.cafein.backend.api.cafe.dto.CafeSaveRequestDTO;
import com.cafein.backend.domain.seat.entity.Seat;
import com.cafein.backend.domain.seat.repository.SeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cafein.backend.api.cafe.dto.CafeDTO;
import com.cafein.backend.api.comment.dto.CommentInfoDTO;
import com.cafein.backend.api.home.dto.HomeResponseDTO;
import com.cafein.backend.api.member.dto.CafeInfoViewedByMemberProjection;
import com.cafein.backend.domain.cafe.entity.Cafe;
import com.cafein.backend.domain.cafe.repository.CafeRepository;
import com.cafein.backend.domain.comment.constant.Keyword;
import com.cafein.backend.domain.comment.entity.Comment;
import com.cafein.backend.domain.commentkeyword.entity.CommentKeyword;
import com.cafein.backend.global.error.ErrorCode;
import com.cafein.backend.global.error.exception.EntityNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CafeService {

	private final CafeRepository cafeRepository;
	private final SeatRepository seatRepository;

	private boolean containsKorean(String address) {
		return address != null && address.matches(".*[ㄱ-ㅎㅏ-ㅣ가-힣]+.*");
	}

	@Transactional(readOnly = true)
	public HomeResponseDTO getHomeData(Long memberId) {
		return HomeResponseDTO.builder()
			.cafeCount(cafeRepository.count())
			.cafes(cafeRepository.getHomeData(memberId))
			.build();
	}

	@Transactional
	public void saveAllCafes(List<CafeSaveRequestDTO> cafeList) {
		for (CafeSaveRequestDTO dto : cafeList) {
			// 💡 한글 주소가 아닌 경우 무시
			if (!containsKorean(dto.getAddress())) continue;
			if (cafeRepository.existsByPlaceId(dto.getPlaceId())) continue;

			Cafe cafe = Cafe.builder()
					.placeId(dto.getPlaceId())
					.name(dto.getName())
					.status(dto.getStatus())
					.latitude(dto.getLatitude())
					.longitude(dto.getLongitude())
					.address(dto.getAddress())
					.phoneNumber(dto.getPhoneNumber())
					.rating(dto.getRating())
					.openingHours(dto.getOpeningHours())
					.reviews(dto.getReviews())
					.hasPlugCount(0) // 초기값 또는 계산된 값
					.isCleanCount(0) // 초기값 또는 계산된 값
					.build();

			cafeRepository.save(cafe);
		}
	}

	// 모든 카페 정보를 가져오는 메소드
	public List<CafeInfoResponseDTO> getAllCafeInfo() {
		List<Cafe> cafes = cafeRepository.findAll();  // 모든 카페 정보를 DB에서 가져옵니다.

		// 각 카페의 정보를 CafeInfoResponseDTO로 변환하여 리스트로 반환
		return cafes.stream()
				.map(cafe -> {
					// 혼잡도 계산
					double averageCongestion = calculateAverageCongestion(cafe.getCafeId());

					return CafeInfoResponseDTO.builder()
							.cafeId(String.valueOf(cafe.getCafeId()))
							.name(cafe.getName())
							.phoneNumber(cafe.getPhoneNumber())
							.address(cafe.getAddress())
							.status(cafe.getStatus())
							.rating(cafe.getRating())
							.latitude(cafe.getLatitude())
							.longitude(cafe.getLongitude())
							.openingHours(cafe.getOpeningHours())  // openingHours도 포함
							.averageCongestion(String.valueOf((int) averageCongestion))  // 혼잡도 반영
							.reviews(cafe.getReviews())
							.hasPlugCount(cafe.getHasPlugCount())  // 실제 값 사용
							.isCleanCount(cafe.getIsCleanCount())  // 실제 값 사용
							.build();
				})
				.collect(Collectors.toList());  // 리스트로 반환
	}

	@Transactional(readOnly = true)
	public CafeDTO findCafeInfoById(Long memberId, Long cafeId) {
		Cafe cafe = cafeRepository.findById(cafeId)
				.orElseThrow(() -> new EntityNotFoundException(ErrorCode.CAFE_NOT_EXIST));

		// 혼잡도 계산
		double averageCongestion = calculateAverageCongestion(cafeId);

		CafeInfoResponseDTO cafeInfo = CafeInfoResponseDTO.builder()
				.cafeId(String.valueOf(cafe.getCafeId()))
				.name(cafe.getName())
				.phoneNumber(cafe.getPhoneNumber())
				.address(cafe.getAddress())
				.status(cafe.getStatus())
				.rating(cafe.getRating())
				.latitude(cafe.getLatitude())
				.longitude(cafe.getLongitude())
				.openingHours(cafe.getOpeningHours()) // openingHours 필드
				.averageCongestion(String.valueOf((int) averageCongestion)) // 혼잡도 반영
				.reviews(cafe.getReviews())
				.hasPlugCount(cafe.getHasPlugCount()) // 실제 값 사용
				.isCleanCount(cafe.getIsCleanCount()) // 실제 값 사용
				.build();

		return CafeDTO.builder()
				.cafeInfo(cafeInfo)
				.comments(getComments(cafeId))
				.build();
	}

	private List<CommentInfoDTO> getComments(final Long cafeId) {
		final List<Comment> comments = cafeRepository.findAllCommentByCafeId(cafeId);
		log.debug("comments: {}", comments);
		return comments.stream()
			.map(comment -> CommentInfoDTO.builder()
				.commentId(comment.getCommentId())
				.memberName(comment.getMember().getName())
				.createdTime(comment.getCreatedTime())
				.content(comment.getContent())
				.keywords(getCommentKeywords(comment))
				.build())
			.collect(Collectors.toList());
	}

	private List<Keyword> getCommentKeywords(Comment comment) {
		return comment.getKeywords().stream()
			.map(CommentKeyword::getKeyword)
			.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	public List<CafeInfoViewedByMemberProjection> findCafeInfoViewedByMember(final List<Long> viewedCafeIds) {
		return viewedCafeIds.stream()
			.map(cafeRepository::findCafeInfoViewedByMember)
			.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	public Cafe findCafeByCafeId(final Long cafeId) {
		return cafeRepository.findById(cafeId)
			.orElseThrow(() -> new EntityNotFoundException(ErrorCode.CAFE_NOT_EXIST));
	}

	/**
	 * 특정 카페의 평균 혼잡도를 계산하는 메서드
	 * @param cafeId 카페 ID
	 * @return 평균 혼잡도 (0~3)
	 */
	public double calculateAverageCongestion(Long cafeId) {
		List<Seat> seats = seatRepository.findByCafe_CafeId(cafeId); // 카페의 좌석 정보 조회
		int occupiedSeats = 0;
		int totalSeats = seats.size();

		// 좌석이 사용 중인 수를 계산
		for (Seat seat : seats) {
			if (seat.isOccupied()) {
				occupiedSeats++;
			}
		}

		// 좌석이 없으면 혼잡도 0 반환
		if (totalSeats == 0) return 0;

		// 혼잡도 계산 (0 ~ 3)
		double congestionRatio = (double) occupiedSeats / totalSeats;

		if (congestionRatio < 0.25) {
			return 0; // 0% ~ 25% 사용 -> 0
		} else if (congestionRatio < 0.5) {
			return 1; // 25% ~ 50% 사용 -> 1
		} else if (congestionRatio < 0.75) {
			return 2; // 50% ~ 75% 사용 -> 2
		} else {
			return 3; // 75% 이상 사용 -> 3
		}
	}

	// 카페 정보 저장 메서드
	public void saveCafe(Cafe cafe) {
		cafeRepository.save(cafe);
	}
}
