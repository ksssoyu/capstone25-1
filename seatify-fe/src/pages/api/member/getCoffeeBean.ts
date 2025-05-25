/**
 * @createdBy 한수민
 * @description 회원 커피콩 조회 API
 */

import { customAxios } from '~/utils/customAxios';

const getCoffeeBean = async () => {
  const response = await customAxios.get('/api/member/coffeebean');
  return response.data;
};

export default getCoffeeBean;
