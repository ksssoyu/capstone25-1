import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import SearchCafe from '~/components/molecule/search';
import getAllCafeInfo from '~/pages/api/home/getAllCafeInfo';
import { CafesInfo } from '~/types/cafeInfo';

interface MobileSearchProps {
  filterCafe: CafesInfo[];
  setFilterCafe: (value: CafesInfo[]) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
}

const MobileSearch = ({
  filterCafe,
  setFilterCafe,
  searchInput,
  setSearchInput,
}: MobileSearchProps) => {
  // 전체 카페 정보 가져오는 react query 문
  const { data } = useQuery(['cafeList'], () => getAllCafeInfo(), {
    suspense: true,
  });

  // 검색어 입력하는 값 update 하는 함수
  const searchInputSetHandler = useCallback(
    (s: string) => {
      setSearchInput(s);

      // 검색어가 변경될 때마다 필터링된 카페 목록 업데이트
      const filteredCafes =
        data?.cafes?.filter((cafe: CafesInfo) => {
          // cafe.name과 검색어를 모두 소문자로 변환하여 비교
          const cafeNameLower = cafe.name.toLowerCase().replace(/\s/g, '');
          const searchInputLower = s.toLowerCase().replace(/\s/g, ''); // 공백 제거

          // cafeNameLower에서 검색어를 포함하는지 검사
          return cafeNameLower.includes(searchInputLower);
        }) || [];
      setFilterCafe(filteredCafes);
    },
    [data?.cafes, setFilterCafe, setSearchInput]
  );
  return (
    <SearchCafe
      searchInput={searchInput}
      setSearchInput={searchInputSetHandler}
      filterCafe={filterCafe}
    />
  );
};
export default MobileSearch;
