import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import getMemberMyPage from '~/pages/api/member/getMemberMyPage';

import { Box, Divider, Tab, Tabs, useTheme } from '@mui/material';
import { MyPageResponse, MyPageTab, TMyPageTabKey } from '~/types/mypage';
import Recently from '~/components/molecule/mypage/Recently';
import Post from '~/components/molecule/mypage/Post';

type TabContainerProps = {
  accessToken: string;
};

const TabContainer = ({ accessToken }: TabContainerProps) => {
  const theme = useTheme();

  const { data, isLoading, isError, error } = useQuery(
    ['mypage'],
    async () => {
      const result = await getMemberMyPage(accessToken);
      console.log('📦 받아온 데이터:', result);
      return result;
    },
    {
      enabled: !!accessToken, // 토큰 없으면 query 비활성화
    }
  );

  if (isLoading) return <div>불러오는 중...</div>;
  if (isError) return <div>에러: {(error as Error).message}</div>;

  const {
    cafeInfoViewedByMemberDTOS = [],
    reviewCount = 0,
    reviewDTOS = [],
  } = (data as MyPageResponse) || {};

  const [tabKey, setTabKey] = useState<TMyPageTabKey>('recently');

  const getFontStyle = useCallback(
    (value: TMyPageTabKey) =>
      value === tabKey
        ? theme.typography.h5
        : {
            ...theme.typography.h5,
            color: theme.palette.grey[400],
            fontFamily: 'PretendardRegular',
          },
    [tabKey, theme]
  );

  const tabList = useMemo<MyPageTab[]>(() => {
    return [
      { label: '최근 본 매장', value: 'recently' },
      { label: `작성한 게시물 ${reviewCount}`, value: 'post' },
    ];
  }, [reviewCount]);

  const onChangeTabKey = useCallback(
    (_: React.SyntheticEvent, newTabKey: TMyPageTabKey) => {
      setTabKey(newTabKey);
    },
    []
  );

  return (
    <Box>
      <Tabs value={tabKey} onChange={onChangeTabKey} variant="fullWidth">
        {tabList.map((v) => (
          <Tab
            key={v.value}
            label={v.label}
            value={v.value}
            sx={getFontStyle(v.value)}
          />
        ))}
      </Tabs>
      <Divider />
      <Box sx={{ p: 0 }}>
        {tabKey === 'recently' && (
          <Recently items={cafeInfoViewedByMemberDTOS} />
        )}
        {tabKey === 'post' && <Post items={reviewDTOS} />}
      </Box>
    </Box>
  );
};

export default TabContainer;
