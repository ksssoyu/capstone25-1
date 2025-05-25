import { Box } from '@mui/material';
import styled from 'styled-components';

// [모바일] 카페 리뷰 작성 모달
interface GrayProp {
  color: string;
}
export const MobileTitle = styled(Box)<GrayProp>`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${(prop) => prop.color};
  padding: 0.8rem 0.9rem;
  padding-top: 2rem;
  & > :first-child {
    flex: 1;
  }
  .closeIcon {
    color: black;
  }
`;
export const MobileReviewButtons = styled(Box)`
  position: fixed;
  left: 0;
  bottom: 40px;
  width: 100%;
  & > :first-child {
    width: 40%;
    margin: 0px 10px;
  }
  & > :last-child {
    width: 40%;
    margin: 0px 10px;
  }
`;
