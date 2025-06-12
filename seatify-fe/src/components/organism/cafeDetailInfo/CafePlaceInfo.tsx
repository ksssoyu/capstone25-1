import { Box, Typography, useTheme } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import CallIcon from '@mui/icons-material/Call';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { LabelItems } from '~/components/molecule/label';
import { useNavigationSelector } from '~/store/reducers/navigateSlice';
import ModalLabel from '~/components/molecule/modalLabel';
import { options, Status } from '~/types/radio';
import {
    CafePlaceContainer,
    CongestionBox,
    CongestionItem,
} from './cafeDetailInfo.styled';

interface CafePlaceInfoProps {
    address: string;
    phoneNumber: string;
    isCongestion: boolean;
    hasPlugCount: number;
    isCleanCount: number;
    viewerCount: number;
    seatVacantCount: number;
    seatTotalCount: number;
    cafeId: string;
}

// ✅ Dummy data for different cafes (고정된 카페 데이터)
const cafeData = {
    '1': {
        basePattern: [
            10, 15, 20, 25, 30, 40, 50, 65, 75, 80, 85, 90, 95, 90, 85, 80, 75, 70,
            80, 85, 70, 60, 40, 25,
        ], // 0-11시 ~ 12-23시
        recommendedHours: '오전 7-9시, 오후 3-5시',
    },
    '2': {
        basePattern: [
            5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 80, 70, 60, 50, 40, 30,
            25, 20, 15, 10, 5,
        ],
        recommendedHours: '오후 8-10시, 오전 6-8시',
    },
    '3': {
        basePattern: [
            20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 90, 80, 70, 60, 50, 40, 30,
            25, 20, 15, 10, 5, 0,
        ],
        recommendedHours: '오전 0-2시, 오후 10-11시',
    },
    default: {
        basePattern: [
            10, 15, 20, 25, 30, 40, 50, 65, 75, 80, 85, 90, 95, 90, 85, 80, 75, 70,
            80, 85, 70, 60, 40, 25,
        ],
        recommendedHours: '오전 7-9시, 오후 3-5시',
    },
};

// ✅ 시간대별 혼잡도 예측 (cafeId에 따라 고정된 데이터를 기반으로 예측)
const generateHourlyPrediction = (cafeId: string) => {
    const currentHour = new Date().getHours();
    const predictions = [];

    const numericCafeId = parseInt(cafeId, 10);
    const index = numericCafeId % 3;

    const data = cafeData[`${index + 1}`] || cafeData.default;
    const { basePattern } = data;

    // 9시 ~ 23시 (시간대 변경)
    for (let i = 9; i <= 23; i++) {
        const percentage = basePattern[i];

        let status: Status = Status.spare;
        if (percentage > 70) status = Status.busy;
        else if (percentage > 30) status = Status.average;

        predictions.push({
            hour: i,
            percentage,
            status,
            isCurrent: i === currentHour,
            isPast: i < currentHour, // 과거 시간대 체크
        });
    }

    return predictions;
};

const CafePlaceInfo = ({
                           address,
                           phoneNumber,
                           isCongestion,
                           hasPlugCount,
                           isCleanCount,
                           viewerCount,
                           seatVacantCount,
                           seatTotalCount,
                           cafeId,
                       }: CafePlaceInfoProps) => {
    const theme = useTheme();
    const grayColor = theme.palette.grey[100];
    const iconColor = theme.palette.grey[300];
    const mainColor = theme.palette.primary.main;

    const navigate = useNavigationSelector();
    const hourlyPredictions = generateHourlyPrediction(cafeId);

    const recommendedVisitHours =
        cafeData[cafeId]?.recommendedHours || cafeData.default.recommendedHours;

    let status: Status = Status.unknown;
    if (seatTotalCount > 0) {
        const occupiedRatio = (seatTotalCount - seatVacantCount) / seatTotalCount;
        if (occupiedRatio <= 0.3) status = Status.spare;
        else if (occupiedRatio <= 0.7) status = Status.average;
        else status = Status.busy;
    }

    const viewerOption = options[status];

    // 혼잡도 상태별 색상 매핑
    const getStatusColor = (status: Status, isPast: boolean) => {
        if (isPast) {
            return '#BDBDBD'; // 과거 시간대는 회색
        }
        switch (status) {
            case Status.spare:
                return '#4CAF50'; // 초록
            case Status.average:
                return '#FF9800'; // 주황
            case Status.busy:
                return '#F44336'; // 빨강
            default:
                return '#9E9E9E'; // 회색
        }
    };

    const getStatusText = (status: Status) => {
        switch (status) {
            case Status.spare:
                return '여유';
            case Status.average:
                return '보통';
            case Status.busy:
                return '혼잡';
            default:
                return '알수없음';
        }
    };

    return (
        <CafePlaceContainer color={grayColor} icon={iconColor}>
            {/* 시청자 수 박스 */}
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
          </span>{' '}
                    명이 보고 있어요
                </Typography>
            </Box>

            {/* 실시간 좌석 상태 박스 */}
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

            {/* 시간대별 혼잡도 예측 */}
            <Box sx={{ marginTop: '20px', marginBottom: '20px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <TrendingUpIcon sx={{ marginRight: '8px', color: mainColor }} />
                    <Typography variant="h5" sx={{ color: mainColor, fontWeight: 'bold' }}>
                        오늘 시간대별 혼잡도 예측
                    </Typography>
                </Box>

                <Box
                    sx={{
                        backgroundColor: '#fafafa',
                        padding: '16px',
                        borderRadius: '12px',
                        border: 'none',
                        marginBottom: '12px',
                    }}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(10, 1fr)',
                            gap: '4px',
                            marginBottom: '8px',
                        }}
                    >
                        {hourlyPredictions.map((prediction) => (
                            <Box key={prediction.hour} sx={{ textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        height: '40px',
                                        backgroundColor: getStatusColor(prediction.status, prediction.isPast),
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '4px',
                                        border: prediction.isCurrent ? '2px solid #1976d2' : 'none',
                                        position: 'relative',
                                    }}
                                >
                                    {prediction.isCurrent && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '-8px',
                                                fontSize: '10px',
                                                color: '#1976d2',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            ●
                                        </Box>
                                    )}
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'white', fontWeight: 'bold' }}
                                    >
                                        {prediction.percentage}%
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontSize: '10px' }}>
                                    {prediction.hour}시
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* 추천 시간대 */}
                <Typography
                    variant="h5"
                    sx={{ color: '#2e7d32', fontWeight: 'bold', }}
                >
                    💡 추천 방문 시간대
                </Typography>
                <Box
                    sx={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '8px',
                        border: 'none',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{ color: '#2e7d32' }}
                    >
                        {recommendedVisitHours}
                    </Typography>
                </Box>
            </Box>

            {/* 매장 정보 */}
            <Typography variant="h4" mt="24px" mb="2px">
                매장 정보
            </Typography>
            <Box className="cafe-info">
                <PlaceIcon />
                <Typography variant="body2">{address}</Typography>
            </Box>
            <Box className="cafe-info">
                <CallIcon />
                <Typography variant="body2">{phoneNumber || '정보 없음'}</Typography>
            </Box>

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
