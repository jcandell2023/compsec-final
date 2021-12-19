const socket = io()
let users = {}

let serverKey
let serverCryptKey

async function checkSign(data, sign) {
    let verified = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        serverKey,
        sign,
        getMessageEncoding(data)
    )
    return verified
}

let privateKey, publicKey

socket.on('encrypt_key', async ({ key, sign }) => {
    serverKey = await crypto.subtle.importKey(
        'jwk',
        {
            alg: 'RS256',
            e: 'AQAB',
            ext: true,
            key_ops: ['verify'],
            kty: 'RSA',
            n: 'sPU4I4faB0IPvfeWjCcTfH0EWhLfzJRPCcL-f1tbaAY8jlGDdcAqrBPzlPjD5LhEngqx9zCT4o51Y9tPCiV9YCgmuNZ2FFwWORXjM-VTZ5CsK8DPa75DepgBtSNVRJHS1rDPFWP6IoR1gMKNa-5gZov5scJZ8WxF3zaepZGICAV0Cowv2_YE7Ots9Oov3oHRx3GSbLrDR9jrJXgn78FcNWpRDWs39N-4Y0wkjbADIrTElyLmsdiw-uhnJbPRUJ93VJVBwDDgk5fOWiSYSKo5AofnfVw0zRNx9lprkZVlg7WR9L5TKpvL9JLTItTdSzK4XeifDHftNp8RnAKynjl3_uaOPGhcev2gT99JEtoONnW59iQET2uJYzuyC2rpPJ7m-L3-gu0BM40Y73M7RmMaK_eutgQL0QiiKoYUjjVHDeXCuoec5_OUPBRALW9P8fYp9g0nLQf6oWZGJSTl4BN5rpozkIbQDr6puRcIoE3vdczNTClExcJmXq8kDdOqmYwxGqFwNxj74vd2HnfsAQvf-yAYh58_EULG_5pff5z1DQhYHa4tiedZjuGVl1wqw4pMQnG6d9vx3cn1Rrt-NOWeAvlzPcKHb3eTRstwEhVEX6lMqiPepDK04agat3cBUx8_N4vmFKY_MqiSHcVabGpnpRa7ixE7FgfsKQMhwPLczkM',
        },
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['verify']
    )
    let verified = await checkSign(key, sign)
    if (!verified) {
        return
    }
    serverCryptKey = await crypto.subtle.importKey(
        'jwk',
        key,
        {
            name: 'RSA-OAEP',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'wrapKey']
    )
    const keys = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    )
    privateKey = keys.privateKey
    publicKey = keys.publicKey
    const exportKey = await crypto.subtle.exportKey('jwk', publicKey)
    const encryptedKeyData = await encryptData(exportKey, serverCryptKey)
    socket.emit('publicKey', { data: encryptedKeyData })
    document.getElementById('loading').style.display = 'none'
    document.getElementById('join-screen').style.display = 'block'
})

//when a message is recieved from the server
socket.on('encryptedMessage', async ({ user, cipher, isPrivate, payload, sign }) => {
    const verified = await checkSign(payload, sign)
    if (!verified) {
        return
    }
    const listItem = document.createElement('li')
    listItem.classList.add('list-group-item')
    message = await decryptData(cipher)
    listItem.innerHTML = formatMessage(message, user, isPrivate)
    document.getElementById('chatlog').prepend(listItem)
})

socket.on('serverMessage', async ({ message, sign }) => {
    const verified = await checkSign(message, sign)
    if (!verified) {
        return
    }
    const listItem = document.createElement('li')
    listItem.classList.add('list-group-item')
    listItem.innerHTML = formatMessage(message, 'Chatbot', false)
    document.getElementById('chatlog').prepend(listItem)
})

//when there is an update to the rooms list
socket.on('rooms_update', async ({ rooms }) => {
    document.getElementById('available-rooms').innerHTML = ''
    for (let i in rooms) {
        let optionEl = document.createElement('option')
        optionEl.value = i
        if (rooms[i].password) {
            optionEl.innerText = `${i} - Private`
        } else {
            optionEl.innerText = i
        }
        document.getElementById('available-rooms').appendChild(optionEl)
    }
})

//when there is an update to the user list for this room
socket.on('user_update', async ({ roomInfo, id, sign, keys }) => {
    if (!checkSign(id, sign)) {
        return
    }
    document.getElementById('userList').innerHTML = ''
    document.getElementById('privateUser').innerHTML = ''
    let newUsers = {}
    for (let user in keys) {
        if (users[user]) {
            newUsers[user] = users[user]
        } else {
            let newKey = await crypto.subtle.importKey(
                'jwk',
                keys[user],
                {
                    name: 'RSA-OAEP',
                    modulusLength: 4096,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256',
                },
                true,
                ['encrypt', 'wrapKey']
            )
            newUsers[user] = newKey
        }
        let listItem = document.createElement('li')
        listItem.innerText = user
        listItem.classList.add('list-group-item')
        document.getElementById('userList').appendChild(listItem)
        let select = document.createElement('option')
        select.innerText = user
        select.value = user
        document.getElementById('privateUser').appendChild(select)
    }
    users = newUsers
    document.getElementById('limit').innerText = roomInfo.limit
})

//when you fail to join a room
socket.on('join_fail', (error) => {
    switchToJoin()
    setTimeout(alert(error), 500)
})

//sends a message to the user, encrypting using their publiv key
async function sendMessage(message, user, isPrivate) {
    let key = users[user]
    let cipher = await encryptData(message, key)
    let serverInfo = { user, isPrivate }
    let serverCipher = await encryptData(serverInfo, serverCryptKey)
    socket.emit('message', {
        cipher,
        serverCipher,
    })
}

//sends message to each user (encrpyting each separately)
function sendMassMessage() {
    let message = document.getElementById('message_input').value
    if(message.length > 1000){
        alert('Message is too long, please split into multiple messages')
        return 
    }
    document.getElementById('message_input').value = ''
    for (let user in users) {
        sendMessage(message, user, false)
    }
}

//sends message to a specific user
function sendPrivateMessage() {
    let message = document.getElementById('message_input').value
    if(message.length > 1000){
        alert('Message is too long, please split into multiple messages')
        return 
    }
    document.getElementById('message_input').value = ''
    let recipient = document.getElementById('privateUser').value
    sendMessage(message, recipient, true)
    const listItem = document.createElement('li')
    listItem.classList.add('list-group-item')
    listItem.innerHTML = formatMessage(message, `You to ${recipient}`, true)
    document.getElementById('chatlog').prepend(listItem)
}

//creates a room
async function createRoom() {
    let user = document.getElementById('username').value
    if (!user) {
        alert('Please supply a username')
        return
    }
    let roomname = document.getElementById('newRoomname').value
    if (!roomname) {
        alert('Please supply a roomname')
        return
    }
    let limit = Number(document.getElementById('roomLimit').value)
    let password = document.getElementById('createPassword').value

    const serverInfo = {roomname, user, limit, password}
    const encryptedInfo = await encryptData(serverInfo, serverCryptKey)

    socket.emit('createRoom', {
        encryptedInfo
    })
    switchToChat(roomname)
}

//joins a room
async function joinRoom() {
    let user = document.getElementById('username').value
    if (!user) {
        alert('Please supply a username')
        return
    }
    let roomname = document.getElementById('available-rooms').value
    let password = document.getElementById('joinPassword').value

    const serverInfo = {roomname, user, password}
    const encryptedInfo = await encryptData(serverInfo, serverCryptKey)

    socket.emit('join_room', { encryptedInfo })
    switchToChat(roomname)
}

//leaves room
function leaveRoom() {
    socket.emit('leave_room')
    users = {}
    switchToJoin()
}

//join existing room
document.getElementById('join-button').addEventListener('click', joinRoom)

//leave room
document.getElementById('leave-button').addEventListener('click', leaveRoom)

//create new room
document.getElementById('create-button').addEventListener('click', createRoom)

//send message to everyone
document.getElementById('send-button').addEventListener('click', sendMassMessage)

//send message to one person
document.getElementById('send-private').addEventListener('click', sendPrivateMessage)
