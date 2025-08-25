import axios from 'axios';

export async function generateToken() {
  try {
    var options = {
      method: 'POST',
      url: `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: `${process.env.API_CLIENT_ID}`,
        client_secret: `${process.env.API_CLIENT_SECRET}`,
        audience: `${process.env.API_IDENTIFIER}`,
      }),
    };
    // console.log('Generating token with options:', options);
    
    const { data } = await axios.request(options);
    return data.access_token;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function validateUser(
  id: string,
  permissions: string,
): Promise<boolean> {
  try {
    const token = await generateToken();
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${process.env.API_IDENTIFIER}users/${id}/permissions`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.request(config);
    const userPermissions = response.data;

    if (response.status === 500 || response.status === 404) {
      console.log('Error al validar el usuario');
      return false;
    }

    const user = userPermissions.filter(
      (permission) => permission.permission_name === permissions,
    );

    if (user.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}
