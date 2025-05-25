import { useDispatch } from 'react-redux';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Typography, useMediaQuery } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

import {
  setNavigationContent,
  useNavigationSelector,
} from '~/store/reducers/navigateSlice';
import { query } from '~/helpers/mobileQuery';
import { HeaderContainer } from './header.styled';

interface HomeProp {
  name: string;
}
const Header = ({ name }: HomeProp) => {
  const dispatch = useDispatch();
  const navigate = useNavigationSelector();
  const isMobile = useMediaQuery(query, { noSsr: true });

  // 뒤로 가기 버튼
  const handleBackArrowClick = () => {
    if (navigate === 'comment') {
      dispatch(setNavigationContent('content'));
    }
    if (navigate === 're-comment') {
      dispatch(setNavigationContent('comment'));
    }
    if (navigate === 'search-comment') {
      dispatch(setNavigationContent('search-detail'));
    }
    if (navigate === 'search-re-comment') {
      dispatch(setNavigationContent('search-comment'));
    }
  };

  // 홈 버튼
  const handleHomeClick = () => {
    dispatch(setNavigationContent('cafelist'));
  };

  return (
    <HeaderContainer>
      <ArrowBackIosNewIcon
        className="mui-icon"
        onClick={handleBackArrowClick}
      />
      {isMobile && (
        <HomeRoundedIcon className="mui-home-icon" onClick={handleHomeClick} />
      )}

      <Typography variant="h4" className="title" mr="20px">
        {name}
      </Typography>
    </HeaderContainer>
  );
};
export default Header;
