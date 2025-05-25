/**
 * @createdBy 한수민
 * @description 커피콩을 활용해서 카페 혼잡도 확인하는 api 함수
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { customAxios } from '~/utils/customAxios';

const useCoffeeBean = async (cafeId: string) => {
  const response = await customAxios.post(`/api/cafe/${cafeId}`);
  return response.data;
};
export default useCoffeeBean;

// 인자 only defined => lint error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useAddCoffeeBeanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(useCoffeeBean, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cafeList']);
      queryClient.invalidateQueries(['comment']);
      queryClient.invalidateQueries(['coffeeBean']);
    },
  });
};
