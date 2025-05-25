/**
 * @createdBy 한수민
 * @description 홈화면에 필요한 모든 카페 정보 받아오는 api 함수
 */

import { customAxios } from '~/utils/customAxios';

const getAllCafeInfo = async (token: string) => {
  const response = await customAxios.get('/api/home', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default getAllCafeInfo;
