/**
 * @createdBy 한수민
 * @description 카페 혼잡도 확인 버튼 컴포넌트
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/material';

import { ActionButton } from '~/types/popup';
import {
  RadioStatusBoxButton,
  RadioStatusSearchButton,
} from '~/components/molecule/radioButtons';
import CafeResponsePopup from '~/components/molecule/cafeResponsePopup';
import { useAddCoffeeBeanMutation } from '~/pages/api/cafe/useCoffeeBean';
import getCoffeeBean from '~/pages/api/member/getCoffeeBean';
import { useNavigationSelector } from '~/store/reducers/navigateSlice';
import { useCafeIdSelector } from '~/store/reducers/cafeIdSlice';
import CafeCongestionPopup from './CafeCongestionPopup';

interface CongestionProps {
  congestion: string;
}

const CafeCongestionStatus = ({ congestion }: CongestionProps) => {
  const { cafeId } = useCafeIdSelector();
  const navigate = useNavigationSelector();
  // 실시간 혼잡도 확인할 때 팝업창
  const [cafeCongestionPopup, setCafeCongestionPopup] =
    useState<boolean>(false);
  // 커피콩 부족할 때 팝업창
  const [coffeeBeanPopup, setCoffeeBeanPopup] = useState<boolean>(false);

  // 혼잡도 확인 react query 문
  const { mutate: CoffeeBeanMutate } = useAddCoffeeBeanMutation();

  // 커피콩 조회 react query 문
  const { data, status: coffeeBeanStatus } = useQuery(['coffeeBean'], () =>
    getCoffeeBean()
  );

  // 커피콩 개수에 따라 혼잡도 확인 혹은 부족 팝업창
  const congestionCoffeeBeanClickHandler = useCallback(() => {
    // 커피콩이 2개 이상이면 혼잡도 확인 팝업
    if (coffeeBeanStatus === 'success' && data >= 2) {
      setCafeCongestionPopup(true);
    } else {
      // 커피콩 1개 이하이면 커피콩 부족 팝업
      setCoffeeBeanPopup(true);
    }
  }, [coffeeBeanStatus, data]);

  // 커피콩 부족 팝업 닫기 함수
  const closeCoffeeBeanPopup = useCallback(() => {
    setCoffeeBeanPopup(false);
  }, []);

  // 커피콩 부족 팝업 Button 목록
  const coffeeBeanActions: ActionButton[] = useMemo(() => {
    return [
      {
        title: '간단한 글 남기고 커피콩 얻기',
        type: 'confirm',
        onClick: closeCoffeeBeanPopup,
      },
      { title: '취소', type: 'close', onClick: closeCoffeeBeanPopup },
    ];
  }, [closeCoffeeBeanPopup]);

  // 혼잡도 확인 팝업 닫기 함수
  const closeCafeCongestionPopup = useCallback(() => {
    setCafeCongestionPopup(false);
  }, []);

  // 혼잡도 확인하는 버튼 함수
  const handleCoffeCongestion = useCallback(() => {
    CoffeeBeanMutate(cafeId);
    closeCafeCongestionPopup();
  }, [CoffeeBeanMutate, closeCafeCongestionPopup, cafeId]);

  // 혼잡도 확인 팝업 Button 목록
  const congestionActions: ActionButton[] = useMemo(() => {
    return [
      {
        title: ' 정보 확인하기',
        type: 'confirm',
        onClick: handleCoffeCongestion,
      },
      { title: '취소', type: 'close', onClick: closeCafeCongestionPopup },
    ];
  }, [closeCafeCongestionPopup, handleCoffeCongestion]);

  // @ts-ignore
  return (
    <Box>
      {/* 카페 혼잡도 확인 팝업 모달 */}
      <CafeCongestionPopup
        open={cafeCongestionPopup}
        onClose={closeCafeCongestionPopup}
        actions={congestionActions}
      />

      {/* 커피콩 부족 팝업 모달 */}
      <CafeResponsePopup
        openPopup={coffeeBeanPopup}
        actions={coffeeBeanActions}
        closePopup={closeCoffeeBeanPopup}
        type="fail"
      />

      {['0', '1', '2', '3'].includes(congestion) && (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
          {congestion === '0' && navigate === 'search-detail' ? (
            <RadioStatusSearchButton
              onClick={congestionCoffeeBeanClickHandler}
            />
          ) : (
            <RadioStatusBoxButton
              status={congestion}
              onClick={congestionCoffeeBeanClickHandler}
            />
          )}
        </>
      )}
    </Box>
  );
};
export default CafeCongestionStatus;
