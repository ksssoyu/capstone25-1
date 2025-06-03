 

import { ReactNode, Suspense, useCallback, useState } from 'react';
import Image from 'next/image';

import { Box, Toolbar, useMediaQuery } from '@mui/material';

import Logo from '~/static/images/logo.png';

import { DrawerItem, DrawerName } from '~/types/drawer';
import AppBar from '~/components/organism/appBar';
import Drawer from '~/components/pages/drawer';
import Profile from '~/components/atom/profile';
import BottomSheet from '~/components/pages/bottomSheet';
import { useNavigationSelector } from '~/store/reducers/navigateSlice';
import MobilePage from '../pages/mobilePage';

interface MainLayoutProps {
  children: ReactNode;
}

const drawerItems: DrawerItem[] = [
  {
    name: 'logo',
    text: '',
    children: <Image src={Logo} alt="로고 이미지" width={30} height={30} />,
  },
  { name: 'mypage', text: '마이', children: <Profile size="sm" /> },
];

const query = '(min-width:0px) and (max-width:600px)';

const MainLayout = ({ children }: MainLayoutProps) => {
   
  const isMobile = useMediaQuery(query, { noSsr: true });

  const navigate = useNavigationSelector();

  // 선택중인 메뉴
  const [selectedMenu, setSelectedMenu] = useState<DrawerName>('logo');

  // 메뉴 변경 함수
  const handleSelectedMenu = useCallback((name: DrawerName) => {
    setSelectedMenu(name);
  }, []);

  return (
    <Box style={{ display: 'flex' }}>
      {/* 모바일 AppBar 영역 */}
      {isMobile && (navigate === 'cafelist' || navigate === 'content') && (
        <AppBar />
      )}

      {/* PC 용 Side Menu 영역 */}
      {!isMobile && (
        <Drawer
          data={drawerItems}
          selectedMenu={selectedMenu}
          handleSelectedMenu={handleSelectedMenu}
        />
      )}
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: 'gray' }}>
        {isMobile && (navigate === 'cafelist' || navigate === 'content') && (
          <Toolbar />
        )}
        {children}
        {isMobile && (navigate === 'cafelist' || navigate === 'content') && (
          <Suspense fallback={<div>loading...</div>}>
            <BottomSheet />
          </Suspense>
        )}
      </Box>
      {isMobile && navigate !== 'content' && navigate !== 'cafelist' && (
        <Suspense fallback={<div>loading...</div>}>
          <MobilePage />
        </Suspense>
      )}
    </Box>
  );
};

export default MainLayout;
