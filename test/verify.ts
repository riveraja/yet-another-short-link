import { request } from 'undici'
import { data } from './exports'

interface Register {
    success: boolean,
    activation_code: string,
    token: string
}

export const verify_otp = async (code: { jsonBody: Register }) => {
    const otpToken = (code.jsonBody.activation_code)?.trim()
    const verifyEndpoint = '/api/verify'
    const verifyUrl = `http://${data.Hostname}:${data.Port}${verifyEndpoint}=${otpToken}`

    const { statusCode } = await request(verifyUrl, {
        method: 'GET',
        headers: {
            'x-api-key': (code.jsonBody.token?.trim()),
            'content-type': 'application/json'
        },
        body: null
    })

    return statusCode
}

