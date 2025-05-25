/**
 * @createdBy 한수민
 * @description access token을 header에 보내면 refresh token을 만료시켜 로그아웃시켜주는 api 함수
 */

import axios from 'axios';
import { removeCookie } from '~/helpers/cookie';

const getLogout = async (token: string) => {
  try {
    await axios.post('http://localhost:8080/api/logout', null, {
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    removeCookie('refreshToken');
    return true;
  } catch (error) {
    return false;
  }
};

export default getLogout;
