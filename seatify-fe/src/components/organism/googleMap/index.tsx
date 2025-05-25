import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setCafeId } from '~/store/reducers/cafeIdSlice';
import { RootState } from '~/store';
import {
  setInitialized,
  selectIsMapInitialized,
} from '~/store/reducers/mapSlice';

import { encodeSVG } from './encodeSVG';
import { tagSvgRaw } from './tagSvgRaw';
import queryClient from '~/helpers/queryClient';
import { setNavigationContent } from '~/store/reducers/navigateSlice';

const GoogleMapComponent = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(
    (state: RootState) => state.auth.auth.access_token
  );
  const isMapInitialized = useSelector(selectIsMapInitialized);

  const currentViewingCafeRef = useRef<string | null>(null);

  useEffect(() => {
    // ✅ cleanup 함수
    return () => {
      const currentCafe = currentViewingCafeRef.current;
      if (currentCafe) {
        fetch(
          `http://localhost:8080/api/cafe-view/end?cafe_id=${currentCafe}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ).catch((err) => console.warn('⛔ cafe-view end 실패:', err));
      }
    };
  }, [accessToken]);

  const fetchNearbyCafes = async (lat: number, lng: number) => {
    const res = await fetch(`/api/cafe/cafes?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error('Failed to fetch nearby cafes');
    const data = await res.json();
    return data.results || [];
  };

  const saveCafesToDB = async (token: string, cafes: any[]) => {
    const res = await fetch('http://localhost:8080/api/cafes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cafes),
    });
    if (!res.ok) throw new Error('Spring API DB 저장 실패');
  };

  const fetchPlaceDetails = async (placeId: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { Place } = (await google.maps.importLibrary(
      'places'
    )) as google.maps.PlacesLibrary;

    const place = new Place({
      id: placeId,
      requestedLanguage: 'ko',
    });

    await place.fetchFields({
      fields: [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'nationalPhoneNumber',
        'businessStatus',
        'regularOpeningHours',
        'reviews',
        'rating',
      ],
    });

    return {
      placeId: place.id,
      name: place.displayName,
      latitude: place.location?.lat?.() || '',
      longitude: place.location?.lng?.() || '',
      address: place.formattedAddress || '',
      phoneNumber: place.nationalPhoneNumber || '',
      status: place.businessStatus || '',
      openingHours: JSON.stringify(place.regularOpeningHours || {}),
      reviews: JSON.stringify(place.reviews || []),
      rating: place.rating?.toString() || '',
    };
  };

  const fetchCafesFromDB = async (token: string) => {
    const res = await fetch('http://localhost:8080/api/cafes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('DB에서 카페 정보 불러오기 실패');
    return res.json();
  };

  useEffect(() => {
    if (!accessToken) {
      console.warn('⛔ accessToken 없음 - 로그인 후에 지도 초기화됩니다.');
      return;
    }

    const loadGoogleMapScript = () =>
      // eslint-disable-next-line consistent-return
      new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line no-promise-executor-return
        if (window.google && window.google.maps) return resolve();

        const existingScript = document.querySelector(
          `script[src^="https://maps.googleapis.com/maps/api/js"]`
        );
        if (existingScript)
          // eslint-disable-next-line no-promise-executor-return
          return existingScript.addEventListener('load', () => resolve());

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google Maps failed to load.'));
        document.body.appendChild(script);
      });

    const initMap = async () => {
      const center = { lat: 37.504992, lng: 126.953561 }; // 기존 첫 번째 위치

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const map = new window.google.maps.Map(document.getElementById('map')!, {
        center,
        zoom: 18,
        disableDefaultUI: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      map.setOptions({ zoomControl: true });

      const firstSearchLocation = { lat: 37.504992, lng: 126.953561 }; // 첫 번째 검색 위치
      const secondSearchLocation = { lat: 37.507416, lng: 126.960169 }; // 두 번째 검색 위치

      const hasSaved = localStorage.getItem('cafes_saved') === 'true';

      if (!hasSaved) {
        const firstNearby = await fetchNearbyCafes(
          firstSearchLocation.lat,
          firstSearchLocation.lng
        );
        const secondNearby = await fetchNearbyCafes(
          secondSearchLocation.lat,
          secondSearchLocation.lng
        );

        // 두 번째 검색을 병렬로 실행
        const firstDetailedCafeList = await Promise.all(
          firstNearby.map((place: any) => fetchPlaceDetails(place.place_id))
        );
        const secondDetailedCafeList = await Promise.all(
          secondNearby.map((place: any) => fetchPlaceDetails(place.place_id))
        );

        // 두 검색 결과 합침
        const detailedCafeList = [
          ...firstDetailedCafeList,
          ...secondDetailedCafeList,
        ];

        try {
          await saveCafesToDB(accessToken, detailedCafeList);
          queryClient.invalidateQueries(['cafeList']);
          localStorage.setItem('cafes_saved', 'true');
        } catch (e) {
          console.error('❌ saveCafesToDB 실패:', e);
        }
      }

      const cafes = await fetchCafesFromDB(accessToken);
      cafes.forEach((cafe: any) => {
        const position = {
          lat: parseFloat(cafe.latitude),
          lng: parseFloat(cafe.longitude),
        };
        const svg = tagSvgRaw(cafe.name, cafe.averageCongestion || '1');
        const marker = new window.google.maps.Marker({
          position,
          map,
          icon: {
            url: encodeSVG(svg),
            scaledSize: new window.google.maps.Size(181, 65),
          },
        });

        marker.addListener('click', async () => {
          const prevCafeId = currentViewingCafeRef.current;
          const newCafeId = cafe.cafeId;

          if (prevCafeId && prevCafeId !== newCafeId) {
            await fetch(
              `http://localhost:8080/api/cafe-view/end?cafe_id=${prevCafeId}`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
          }

          await fetch(
            `http://localhost:8080/api/cafe-view/start?cafe_id=${newCafeId}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

          // ✅ 시청자 수 fetch
          try {
            const res = await fetch(
              `http://localhost:8080/api/cafe-view/count?cafe_id=${newCafeId}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const count = await res.json();
            console.log(
              `현재 ${newCafeId}번 카페를 보고 있는 사람 수: ${count}`
            );
          } catch (err) {
            console.warn('실시간 시청자 수 가져오기 실패:', err);
          }

          currentViewingCafeRef.current = newCafeId;
          dispatch(setCafeId({ cafeId: newCafeId, commentId: '0' }));
          dispatch(setNavigationContent('content'));
        });
      });

      const controlsDiv = document.createElement('div');
      controlsDiv.classList.add('custom-map-controls');
      map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(
        controlsDiv
      );

      dispatch(setInitialized());
      localStorage.setItem('map_initialized', 'true');
    };

    loadGoogleMapScript()
      .then(() => initMap())
      .catch((err) => console.error('Google Maps API load error:', err));
  }, [dispatch, accessToken, isMapInitialized]);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
};

export default GoogleMapComponent;
