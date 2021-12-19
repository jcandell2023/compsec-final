function switchToChat(roomname) {
    document.getElementById('chat').style.display = 'block'
    document.getElementById('join-screen').style.display = 'none'
    document.getElementById('roomname').innerText = roomname
}

function switchToJoin() {
    document.getElementById('chat').style.display = 'none'
    document.getElementById('join-screen').style.display = 'block'
    document.getElementById('chatlog').innerHTML = ''
}

function formatMessage(message, user, isPrivate) {
    if (isPrivate) {
        user += ' (private)'
    }
    return `<span class="align-middle"><strong>${user}:</strong> ${message}</span>`
}

async function encryptMessage(message, key) {
    let cipher = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        key,
        getMessageEncoding(message)
    )
    return cipher
}

async function encryptData(data, key) {
    let aesKey = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    )
    let iv = crypto.getRandomValues(new Uint8Array(12))
    let cipher = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        getMessageEncoding(JSON.stringify(data))
    )
    let encryptedKey = await crypto.subtle.wrapKey('jwk', aesKey, key, {
        name: 'RSA-OAEP',
    })
    return { cipher, encryptedKey, iv }
}

async function decryptData(data) {
    const aesKey = await crypto.subtle.unwrapKey(
        'jwk',
        data.encryptedKey,
        privateKey,
        { name: 'RSA-OAEP' },
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    )
    const infoStr = getMessageDecoding(
        await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: data.iv,
            },
            aesKey,
            data.cipher
        )
    )
    return JSON.parse(infoStr)
}

async function decrpytMessage(cipher) {
    return getMessageDecoding(
        await crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP',
            },
            privateKey,
            cipher
        )
    )
}

async function generateKeys() {
    let keys = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    )
    return keys
}

function getMessageEncoding(str) {
    let enc = new TextEncoder()
    return enc.encode(str)
}

function getMessageDecoding(input) {
    let dec = new TextDecoder()
    return dec.decode(input)
}
