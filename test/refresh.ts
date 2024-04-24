import { request } from 'undici'
import { data } from './exports'

interface Register {
    success: boolean,
    activation_code: string,
    token: string
}

export const refresh_token = async (code: { jsonBody: Register }) => {
    const otpToken = (code.jsonBody.activation_code)?.trim()
    const refreshEndpoint = '/api/refresh-token'
    const verifyUrl = `http://${data.Hostname}:${data.Port}${refreshEndpoint}`

    const result = await request(verifyUrl, {
        method: 'GET',
        headers: {
            'x-api-key': (code.jsonBody.token?.trim()),
            'content-type': 'application/json'
        },
        body: null
    })

    return result
}
