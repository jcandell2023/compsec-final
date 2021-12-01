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
    return `<p><span>${user}:</span>${message}</p>`
}

function encryptMessage(message, key) {
    return message
}

function decrpytMessage(cipher) {
    return cipher
}

function generateKeys() {}

function getMessageEncoding(str) {
    let enc = new TextEncoder()
    return enc.encode(str)
}

function getMessageDecoding(input) {
    let dec = new TextDecoder()
    return dec.decode(input)
}


