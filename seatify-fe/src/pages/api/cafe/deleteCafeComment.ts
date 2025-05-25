/**
 * @createdBy 한수민
 * @description 카페 댓글 삭제하는 api 함수
 */

import { customAxios } from '~/utils/customAxios';

interface CafeComment {
  cafeId: string;
  commentId: string;
}

const deleteCafeComment = async (body: CafeComment) => {
  const { cafeId, commentId } = body;

  const response = await customAxios.delete(
    `/api/cafe/${cafeId}/comment/${commentId}`
  );
  return response.data;
};
export default deleteCafeComment;
