 
import Image from 'next/image';

import { AppBar, Box, Toolbar, Typography } from '@mui/material';

import Logo from '~/static/images/logo.png';
import CoffeeBean from '~/static/images/coffeebean.png';
import Search from '~/static/images/search.png';

import Profile from '~/components/atom/profile';
import { useDispatch } from 'react-redux';
import { setNavigationContent } from '~/store/reducers/navigateSlice';

// Toolbar 영역 높이 값
export const TOOL_BAR_HEIGHT = 56;

// 빈 Toolbar 영역 높이 값
export const EMPTY_TOOL_BAR_HEIGHT = 24;

const MobileAppBar = () => {
  const dispatch = useDispatch();

  // 돋보기 클릭했을 때
  const searchClickHandler = () => {
    dispatch(setNavigationContent('search'));
  };
  return (
    <AppBar component="nav" color="default">
      <Toolbar sx={{ minHeight: EMPTY_TOOL_BAR_HEIGHT }} />
      <Toolbar>
        {/* Logo 영역 */}
        <Image src={Logo} alt="로고 이미지" />

        {/* 검색 및 프로필 영역 */}
        <Box
          display="flex"
          flexDirection="row"
          flexGrow={1}
          justifyContent="flex-end"
        >
          <Image src={Search} alt="검색 이미지" onClick={searchClickHandler} />

          <Profile size="sm" ml={1.5} mr={1} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MobileAppBar;
