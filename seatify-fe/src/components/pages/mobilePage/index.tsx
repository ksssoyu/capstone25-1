import { useQuery } from '@tanstack/react-query';
import { Suspense, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useDispatch } from 'react-redux';

import { setCafeId, useCafeIdSelector } from '~/store/reducers/cafeIdSlice';
import {
  setNavigationContent,
  useNavigationSelector,
} from '~/store/reducers/navigateSlice';
import { CafeComment, CafesInfo } from '~/types/cafeInfo';

import CafeDetailComment from '~/components/organism/cafeDetailComment';
import CafeReComment from '~/components/organism/cafeReComment';
import CafeWriteComment from '~/components/organism/cafeWriteComment';
import getCoffeeBeanInfo from '~/pages/api/cafe/getCoffeeBeanInfo';
import MobileSearch from '~/components/organism/mobileSearch';
import NoCafeComment from '~/components/organism/cafeInfoList/NoCafeComment';
import CafeInfo from '~/components/organism/cafeInfoList/CafeInfo';

const MobilePage = () => {
  const navigate = useNavigationSelector();
  const cafe = useCafeIdSelector();
  const dispatch = useDispatch();

  const [filterCafe, setFilterCafe] = useState<CafesInfo[]>([]);
  const [searchInput, setSearchInput] = useState('');

  const setSearchInputHandler = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const setFilterCafeHandler = useCallback((value: CafesInfo[]) => {
    setFilterCafe(value);
  }, []);

  const cafeClickHandler = useCallback(
    (id: string) => {
      dispatch(setCafeId({ cafeId: id, commentId: '' }));
      dispatch(setNavigationContent('content'));
    },
    [dispatch]
  );

  const { data: congestion } = useQuery<CafeComment>(
    ['comment', cafe.cafeId],
    () => getCoffeeBeanInfo(cafe.cafeId),
    {
      suspense: true,
      enabled: !!cafe.cafeId,
    }
  );

  return (
    <Box sx={{ width: '100%' }}>
      {(navigate === 'comment' || navigate === 'search-comment') &&
        congestion && (
          <CafeDetailComment
            name={congestion?.cafeInfo.name}
            comments={congestion?.comments}
            cafeId={congestion?.cafeInfo.cafeId}
          />
        )}

      {(navigate === 're-comment' || navigate === 'search-re-comment') && (
        <CafeReComment />
      )}

      {(navigate === 'write' || navigate === 'search-write') && congestion && (
        <CafeWriteComment
          name={congestion?.cafeInfo.name}
          cafeId={congestion?.cafeInfo.cafeId}
        />
      )}

      {(navigate === 'search' ||
        navigate === 'search-list' ||
        navigate === 'search-detail') && (
        <Suspense fallback={<div>loading...</div>}>
          <MobileSearch
            filterCafe={filterCafe}
            setFilterCafe={setFilterCafeHandler}
            searchInput={searchInput}
            setSearchInput={setSearchInputHandler}
          />
        </Suspense>
      )}

      {navigate === 'search-list' && filterCafe.length === 0 && (
        <NoCafeComment searchInput={searchInput} />
      )}

      {navigate === 'search-list' && filterCafe.length > 0 && (
        <>
          {filterCafe.map((filter: CafesInfo, index: number) => (
            <CafeInfo
              // key={cafe.cafeId}
              // 백엔드 아이디 처리 전까지
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              cafeClickHandler={() => cafeClickHandler(filter.cafeId)}
              cafes={filter}
            />
          ))}
        </>
      )}
    </Box>
  );
};
export default MobilePage;
