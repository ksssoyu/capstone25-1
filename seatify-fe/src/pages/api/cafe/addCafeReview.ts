/**
 * @createdBy 한수민
 * @description 카페 리뷰 등록하는 api 함수
 */

import { customAxios } from '~/utils/customAxios';

interface CafeReview {
  cafeId: string;
  cafeCongestion: string;
  hasPlug: string;
  isClean: string;
}
const addCafeReview = async (body: CafeReview) => {
  const { cafeId, ...bodyData } = body;
  const response = await customAxios.post(
    `/api/cafe/${cafeId}/review`,
    bodyData
  );
  return response.data;
};
export default addCafeReview;
