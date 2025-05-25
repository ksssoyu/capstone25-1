import '~/static/font-styles.css';

import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { Provider } from 'react-redux';
import { QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import GlobalStyle from '~/styles/global-styles';

import wrapper from '~/store';

import queryClient from '~/helpers/queryClient';
import { ConfigProvider } from '~/helpers/themeConfig';
import ThemeCustomization from '~/themes';
import EmptyLayout from '~/components/templates/EmptyLayout';
import MainLayout from '~/components/templates/MainLayout';

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    // 카카오 로그인 할 때 Javascript SDK 초기화 함수 추가
    //  app 최상단에 useEffect 로 init
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_KEY);
    }
  }, []);

  const { store, props } = wrapper.useWrappedStore(pageProps);
  const router = useRouter();

  // 권한 체크 후 동적 layout 적용
  const DynamicLayout = router.pathname === '/login' ? EmptyLayout : MainLayout;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedProps}>
          <ConfigProvider>
            <ThemeCustomization>
              <GlobalStyle />
              <DynamicLayout>
                <Component {...props} />
              </DynamicLayout>
              <ReactQueryDevtools initialIsOpen={false} />
            </ThemeCustomization>
          </ConfigProvider>
        </Hydrate>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
