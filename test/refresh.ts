import { request } from 'undici'
import { data } from './exports'

interface Register {
    success: boolean,
    activation_code: string,
    token: string
}

interface Body {
    success: boolean,
    status: number,
    token: string
}

export const refresh_token = async (code: { jsonBody: Register }) => {
    const refreshEndpoint = '/api/refresh-token'
    const refreshUrl = `http://${data.Hostname}:${data.Port}${refreshEndpoint}`

    const result = await request(refreshUrl, {
        method: 'GET',
        headers: {
            'x-api-key': (code.jsonBody.token?.trim())
        }
    })

    if (result.statusCode === 200) {
        console.log('Token refreshed successfully!')
        const body: Body = await result.body.json() as Body
        console.log('Refreshed token:', body.token)
    }
}
