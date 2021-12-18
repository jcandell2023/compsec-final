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

crypto.subtle
    .importKey(
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
    .then((data) => (serverKey = data))

crypto.subtle
    .generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    )
    .then((keys) => {
        privateKey = keys.privateKey
        publicKey = keys.publicKey
        document.getElementById('loading').style.display = 'none'
        document.getElementById('join-screen').style.display = 'block'
        crypto.subtle.exportKey('jwk', publicKey).then((exportKey) => {
            socket.emit('publicKey', { key: exportKey })
        })
    })

socket.on('encrypt_key', async ({ key, sign }) => {
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
        ['encrypt']
    )
})

//when a message is recieved from the server
socket.on('encryptedMessage', async ({ user, cipher, isPrivate, id, sign }) => {
    if (!checkSign(id, sign)) {
        return
    }
    const listItem = document.createElement('li')
    listItem.classList.add('list-group-item')
    message = await decrpytMessage(cipher)
    listItem.innerHTML = formatMessage(message, user, isPrivate)
    document.getElementById('chatlog').prepend(listItem)
})

socket.on('serverMessage', ({ message }) => {
    const listItem = document.createElement('li')
    listItem.classList.add('list-group-item')
    listItem.innerHTML = formatMessage(message, 'Chatbot', false)
    document.getElementById('chatlog').prepend(listItem)
})

//when there is an update to the rooms list
socket.on('rooms_update', ({ rooms }) => {
    document.getElementById('available-rooms').innerHTML = ''
    for (let i in rooms) {
        let optionEl = document.createElement('option')
        optionEl.value = i
        if (rooms[i].isPrivate) {
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
    console.log(keys)
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
                ['encrypt']
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

//when this user is removed from the room
socket.on('remove_user', (data) => {
    leaveRoom()
})

//when you fail to join a room
socket.on('join_fail', (error) => {
    switchToJoin()
    setTimeout(alert(error), 500)
})

//sends a message to the user, encrypting using their publiv key
async function sendMessage(message, user, isPrivate) {
    let key = users[user]
    let cipher = await encryptMessage(message, key)
    socket.emit('message', {
        cipher,
        user,
        isPrivate,
    })
}

//sends message to each user (encrpyting each separately)
function sendMassMessage() {
    let message = document.getElementById('message_input').value
    document.getElementById('message_input').value = ''
    for (let user in users) {
        sendMessage(message, user, false)
    }
}

//sends message to a specific user
function sendPrivateMessage() {
    let message = document.getElementById('message_input').value
    document.getElementById('message_input').value = ''
    let recipient = document.getElementById('privateUser').value
    sendMessage(message, recipient, true)
    const listItem = document.createElement('li')
    listItem.classList.add('list-group-item')
    listItem.innerHTML = formatMessage(message, `You to ${recipient}`, true)
    document.getElementById('chatlog').prepend(listItem)
}

//creates a room
function createRoom() {
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

    socket.emit('createRoom', {
        roomname,
        user,
        limit,
        password,
    })
    switchToChat(roomname)
}

//joins a room
function joinRoom() {
    let user = document.getElementById('username').value
    if (!user) {
        alert('Please supply a username')
        return
    }
    let roomname = document.getElementById('available-rooms').value
    let password = document.getElementById('joinPassword').value

    socket.emit('join_room', { user, roomname, password })
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
