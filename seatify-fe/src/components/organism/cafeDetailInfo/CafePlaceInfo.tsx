import { Box, Typography, useTheme } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CallIcon from '@mui/icons-material/Call';

import { LabelItems } from '~/components/molecule/label';
import { useNavigationSelector } from '~/store/reducers/navigateSlice';
import ModalLabel from '~/components/molecule/modalLabel';
import {
    CafePlaceContainer,
    CongestionBox,
    CongestionItem,
} from './cafeDetailInfo.styled';
import { options, Status } from '~/types/radio';

interface CafePlaceInfoProps {
    address: string;
    phoneNumber: string;
    isCongestion: boolean;
    hasPlugCount: number;
    isCleanCount: number;
    viewerCount: number;
    seatVacantCount: number;
    seatTotalCount: number;
}

const CafePlaceInfo = ({
                           address,
                           phoneNumber,
                           isCongestion,
                           hasPlugCount,
                           isCleanCount,
                           viewerCount,
                           seatVacantCount,
                           seatTotalCount,
                       }: CafePlaceInfoProps) => {
    const theme = useTheme();
    const grayColor = theme.palette.grey[100];
    const iconColor = theme.palette.grey[300];
    const mainColor = theme.palette.primary.main;

    const navigate = useNavigationSelector();

    // ✅ 혼잡도 판단 기준: 좌석 점유율 기반
    let status: Status = Status.unknown;
    if (seatTotalCount > 0) {
        const occupiedRatio = (seatTotalCount - seatVacantCount) / seatTotalCount;
        if (occupiedRatio <= 0.3) status = Status.spare;
        else if (occupiedRatio <= 0.7) status = Status.average;
        else status = Status.busy;
    }

    const viewerOption = options[status];

    return (
        <CafePlaceContainer color={grayColor} icon={iconColor}>
            {/* ✅ 시청자 수 박스 */}
            <Box
                sx={{
                    backgroundColor: viewerOption.color2,
                    color: viewerOption.color,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '40px',
                }}
            >
                <Typography variant="subtitle2" textAlign="center">
                    👀 현재{' '}
                    <span style={{ color: '#ff4545', fontWeight: 'bold' }}>
            {viewerCount}
          </span>
                    명이 보고 있어요
                </Typography>
            </Box>

            {/* ✅ 실시간 좌석 상태 박스 */}
            <Box
                sx={{
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '36px',
                }}
            >
                <Typography variant="subtitle2" textAlign="center">
                    🪑 실시간 좌석 상태: {seatVacantCount} / {seatTotalCount}
                </Typography>
            </Box>

            <Typography variant="h4" mt="24px" mb="2px">
                매장 정보
            </Typography>

            {navigate !== 'search-detail' && (
                <>
                    <Box className="cafe-info">
                        <PlaceIcon />
                        <Typography variant="body2">{address}</Typography>
                    </Box>

                    <Box className="cafe-info">
                        <CallIcon />
                        <Typography variant="body2">
                            {phoneNumber && phoneNumber.trim() !== ''
                                ? phoneNumber
                                : '정보 없음'}
                        </Typography>
                    </Box>
                </>
            )}

            {isCongestion && (
                <CongestionBox>
                    <CongestionItem>
                        <LabelItems hasPlug isClean={false} />
                        <Typography color={mainColor}>{hasPlugCount}</Typography>
                    </CongestionItem>
                    <CongestionItem>
                        <LabelItems isClean hasPlug={false} />
                        <Typography color={mainColor}>{isCleanCount}</Typography>
                    </CongestionItem>
                </CongestionBox>
            )}
            {!isCongestion && navigate === 'search-detail' ? (
                <ModalLabel type="search" onClick={() => {}} />
            ) : (
                <ModalLabel onClick={() => {}} />
            )}
        </CafePlaceContainer>
    );
};

export default CafePlaceInfo;
