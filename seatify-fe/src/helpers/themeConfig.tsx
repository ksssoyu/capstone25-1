/* eslint-disable react/function-component-definition */
import { createContext, ReactNode, useCallback, useMemo } from 'react';

import useLocalStorage from '~/hooks/useLocalStorage';
import { FontFamily, ThemeMode, CustomizationProps } from '~/types/theme';

// MUI Theme 설정 초기값
const initialState: CustomizationProps = {
  fontFamily: 'PretendardRegular',
  mode: 'light',
  onChangeMode: () => {},
  onChangeFontFamily: () => {},
};

const ConfigContext = createContext(initialState);

type ConfigProviderProps = {
  children: ReactNode;
};

// 테마 설정 관련 주입
const ConfigProvider = ({ children }: ConfigProviderProps) => {
  /**
   * 'cafe-in-ts-config' 키의 데이터가 있으면 가져온다.
   * 'cafe-in-ts-config' 키의 데이터가 없으면 initailState를 초기값으로 local storage 에 저장한다.
   */
  const [config, setConfig] = useLocalStorage(
    'cafe-in-ts-config',
    initialState
  );

  /**
   * 테마 모드 변경 함수
   * @param mode 테마 모드 (light or dark)
   */
  const onChangeMode = useCallback(
    (mode: ThemeMode) => {
      setConfig({ ...config, mode });
    },
    [config, setConfig]
  );

  /**
   * 테마 폰트 변경 함수
   * @param fontFamily 테마 폰트
   */
  const onChangeFontFamily = useCallback(
    (fontFamily: FontFamily) => {
      setConfig({ ...config, fontFamily });
    },
    [config, setConfig]
  );

  /**
   * ConfigContext 에 주입될 테마 설정 값들
   * 설정 값이 변경되면 리렌더링된다.
   */
  const configContextProps = useMemo(
    () => ({
      ...config,
      onChangeMode,
      onChangeFontFamily,
    }),
    [config, onChangeFontFamily, onChangeMode]
  );

  return (
    <ConfigContext.Provider value={configContextProps}>
      {children}
    </ConfigContext.Provider>
  );
};

export { ConfigProvider, ConfigContext };
