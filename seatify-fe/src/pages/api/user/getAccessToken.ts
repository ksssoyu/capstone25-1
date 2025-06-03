 

const getAccessToken = async (token: string) => {
  try {
    const url = 'http://localhost:8080/api/access-token/issue';

    const response = await fetch(url, {
      method: 'POST',
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
export default getAccessToken;
