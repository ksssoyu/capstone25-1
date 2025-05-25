/**
 * @createdBy 한수민
 * @description jwt 토큰과 role을 넣어 get 통신을 하면 user 정보를 반환하는 api 함수
 */

const getUserData = async (token: string | undefined, role: string) => {
  try {
    const url = `http://localhost:8080/api/member/info?role=${role}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return error;
  }
};
export default getUserData;
