/**
 * @createdBy 한수민
 * @description 카페 커뮤니티 댓글 컴포넌트
 */

import { Typography, useTheme } from '@mui/material';

import Profile from '~/components/atom/profile';
import { CommentBox } from './cafeDetailInfo.styled';

interface CommentProp {
  content: string;
}
const CafeCommunityComment = ({ content }: CommentProp) => {
  const theme = useTheme();
  const grayColor = theme.palette.grey[100];

  return (
    <CommentBox color={grayColor}>
      <Profile size="sm" />
      <Typography ml="10px" className="arrow" variant="body2">
        {content}
      </Typography>
    </CommentBox>
  );
};

export default CafeCommunityComment;
