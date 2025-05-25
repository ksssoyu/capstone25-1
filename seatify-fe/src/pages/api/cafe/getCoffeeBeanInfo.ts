/**
 * @createdBy 한수민
 * @description 카페 혼잡도 확인한 카페 정보 받아오는 api 함수
 */

import { CafeComment } from '~/types/cafeInfo';
import { customAxios } from '~/utils/customAxios';

const getCoffeeBeanInfo = async (cafeId: string, token: string) => {
  const response = await customAxios.get(`/api/cafe/${cafeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data as CafeComment;
};

export default getCoffeeBeanInfo;
