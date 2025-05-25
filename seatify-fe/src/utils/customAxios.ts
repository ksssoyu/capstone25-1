import axios, { AxiosError, AxiosInstance } from 'axios';
import router from 'next/router';
import { getCookie, setCookie, removeCookie } from '~/helpers/cookie';
import { getAccessToken } from '~/pages/api/user';

interface ErrorResponse {
  errorCode: string;
  errorMessage: string;
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const setInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getCookie('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ErrorResponse>) => {
      const originalRequest = error.config;

      const errorCode = error?.response?.data?.errorCode;
      if (errorCode === 'A-002' || errorCode === 'A-001') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(instance(originalRequest));
              },
              reject: (err: any) => reject(err),
            });
          });
        }

        isRefreshing = true;

        try {
          const refreshToken = getCookie('refreshToken');
          const { accessToken } = await getAccessToken(refreshToken);
          setCookie('accessToken', accessToken, {});

          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (err) {
          processQueue(err, null);

          // ❗ refreshToken도 만료된 경우: 쿠키 제거 + 로그인 페이지 이동
          removeCookie('accessToken');
          removeCookie('refreshToken');
          router.push('/login');

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const createInstance = () => {
  const instance = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' },
  });
  return setInterceptors(instance);
};

export const customAxios = createInstance();
