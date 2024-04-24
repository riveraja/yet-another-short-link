import { request } from 'undici'
import { data } from './exports'

const registerEndpoint = '/api/register'
const registerUrl = `http://${data.Hostname}:${data.Port}${registerEndpoint}`

interface Body {
    user_id: string,
    email: string
}

interface UserData {
    token: string,
    body: Body
}

export const registerUser = async (data: UserData) => {
    const {
        statusCode,
        body
    } = await request(registerUrl, {
        method: 'POST',
        headers: {
            'x-api-key': data.token,
            'content-type': 'application/json'
        },
        body: JSON.stringify(data.body)
    })

    if (statusCode === 200) console.log('User registration successful!')
    return body
}