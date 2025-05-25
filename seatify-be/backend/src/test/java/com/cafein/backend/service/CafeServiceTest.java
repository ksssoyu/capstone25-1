package com.cafein.backend.service;

import static com.cafein.backend.support.fixture.CafeFixture.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.util.Collections;

import com.cafein.backend.api.cafe.dto.CafeInfoResponseDTO;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import com.cafein.backend.api.cafe.dto.CafeDTO;
import com.cafein.backend.domain.cafe.repository.CafeRepository;
import com.cafein.backend.domain.cafe.service.CafeService;
import com.cafein.backend.support.utils.ServiceTest;

@ServiceTest
class CafeServiceTest {

	@InjectMocks
	private CafeService cafeService;

	@Mock
	private CafeRepository cafeRepository;

	@Test
	void 카페_정보를_반환한다() {
		// Given: Mock CafeInfoResponseDTO with openingHours
		CafeInfoResponseDTO cafeInfo = CafeInfoResponseDTO.builder()
				.cafeId("1")
				.name("5to7")
				.phoneNumber("050713337616")
				.address("서울시 성동구 서울숲2길44-13 1층")
				.status("영업중")
				.averageCongestion("2")
				.hasReviewed(true)
				.hasPlugCount(5)
				.isCleanCount(3)
				.rating("4.5")
				.latitude("37.5460707")
				.longitude("127.043297")
				.openingHours("{\"periods\":[], \"weekdayDescriptions\":[]}") // Include openingHours field
				.build();

		// Given: Mock cafeRepository to return the cafeInfo
		given(cafeRepository.findCafeInfoById(anyLong(), anyLong())).willReturn(cafeInfo);
		given(cafeRepository.findAllCommentByCafeId(anyLong())).willReturn(Collections.emptyList());

		// When: Execute the service method
		CafeDTO cafeDTO = cafeService.findCafeInfoById(1L, 1L);

		// Then: Validate that the openingHours field is present and other fields are correct
		then(cafeRepository).should(times(1)).findCafeInfoById(anyLong(), anyLong());
		then(cafeRepository).should(times(1)).findAllCommentByCafeId(anyLong());

		// Validate CafeInfoResponseDTO fields
		assertThat(cafeDTO.getCafeInfo().getName()).isEqualTo("5to7");
		assertThat(cafeDTO.getCafeInfo().getOpeningHours()).isEqualTo("{\"periods\":[], \"weekdayDescriptions\":[]}"); // Validate openingHours
		assertThat(cafeDTO.getCafeInfo().getStatus()).isEqualTo("영업중");
	}

	@Test
	void 회원이_조회한_카페들의_정보를_반환한다() {
		// Given: Mock the cafeRepository to return the viewed cafes info
		given(cafeRepository.findCafeInfoViewedByMember(anyLong())).willReturn(CAFE_INFO_VIEWED_BY_MEMBER);

		// When: Execute the service method
		cafeService.findCafeInfoViewedByMember(VIEWED_CAFE_IDS);

		// Then: Validate that the repository was called for each viewed cafe
		then(cafeRepository).should(times(3)).findCafeInfoViewedByMember(anyLong());
	}

	@Test
	void 홈_화면의_전체_카페_정보를_반환한다() {
		// Given: Mock cafeRepository to return a count and empty list for the home data
		given(cafeRepository.count()).willReturn(5L);
		given(cafeRepository.getHomeData(1L)).willReturn(Collections.emptyList());

		// When: Execute the service method
		cafeService.getHomeData(1L);

		// Then: Validate that the repository methods were called correctly
		then(cafeRepository).should(times(1)).count();
		then(cafeRepository).should(times(1)).getHomeData(anyLong());
	}
}
