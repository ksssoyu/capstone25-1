/**
 * @createdBy 한수민
 * @description access 토큰을 header로 전달하면 jwt토큰 반환하는 api 함수
 */

import axios from 'axios';
import { LoginResponse } from '~/types/auth';

const getLoginToken = async (token: string, type: string) => {
  try {
    console.log('📢 axios에 붙는 토큰:', token);

    const res: LoginResponse = await axios.post(
      'http://localhost:8080/api/oauth/login',
      {
        memberType: `${type}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    // ✅ 전체 응답 콘솔 출력
    console.log('✅ 로그인 응답 전체:', res);
    console.log('✅ accessToken:', res.data?.accessToken);
    console.log('✅ refreshToken:', res.data?.refreshToken);

    return { ...res, success: true };
  } catch (error) {
    console.error('❌ 로그인 에러:', error);
    return { success: false };
  }
};

export default getLoginToken;
