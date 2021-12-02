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
    //cipher = new Uint8Array(cipher)

    //cipher = [...cipher]
    console.log(cipher)
    return cipher
}

async function decrpytMessage(cipher) {
    console.log(cipher)
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
