const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const crypto = require('crypto')
const { subtle } = crypto.webcrypto

app.use(express.static('public'))

const rooms = {}
const keys = {}
const users = {}
let privateKey
let signature
subtle
    .importKey(
        'jwk',
        {
            alg: 'RS256',
            d: 'DcmKrl4DKJtG4wwGK0pPdDIWDjc36lZzKAq3eHseOTx50wmFKWintSY4IsG_xYjD3optHkTR0446QDr8mAj0EUi056Qx_q5uvtOL6GW0Ogv6wM1He-4O5N-GC95tDNLNxL4cNwmbRL2MSCl1tP9AJzfoZFIFCaXgIHQ-0nNEeteDQzUen3qLcgglF5n4Jn534UcMhl3bdt7ER3RAAaf6RAvSCoPG5X8u0ccYy_9MPJPYA1c2oTcFvFmHe9exoHX5lAStuEiL9C6Y5yDAdVzp5Ilr3we5nMbTPhitFo03eRZtq6N5PbHLfMqZxQt6aHBTDrdf-QE5DA9DDc7kqtDwc9xf_UdlPkUuhR2xZNwjdIwg_i4T1wiHbUemwnjjKqzc_MhycyDp6-uZwENJ75fPnitG4V70bN1sMxfgCC8nFvXboo3N2vGCW4Vm82ldQLkEK1pMa9vohB9zO2sHSI3m8lGCKXEOj6T9VXYaLUCEeWV_6vXiVX1er2GvIK68JjtvY0QsfIMBir6ri2qJOpAyBKSn6-SPnW1d3A-gwin9JAx4sjOfl9HoKPKVzTl2FzlTcltGsXLNy7RgYiio8eK696H5r0w3m4cim0jQznIsVkix2uE4vKLrW6pVDKvea5V-RNgzW_YZ8NcgE9mGl-WbIPXrrXDHkscyXqclsEvai70',
            dp: 'XX_oJGamGKiFtx_8RFvWuMp8R1VYJtgHfGVwH4CvSvq2MtprP5hOj951yZ8hemzcwJJ48-zxt5LkdvjABIYs7ZmL-pDCjGIJsRYBw_MydsFkr5CLssi5jPKaiijHxJagMsV-O4nmS1CemopL7kTgTG4FpXtylwtiRMIGx0KWps2PJR7JpLzzdAecgeyM-wjmpg2O2oy_IpzhyIMGbprl9ZSMXGtSflqYg9dcXQ-HN4zxe-Un8KgZqoUYzK63V7xPpjiTz_9zdh1g7k4WRbRJzY7qpkjUmznnbZPke2YVOXFhQHurX8sz7rI8q_4WGD2bBRMiyf3BsDY88M95sfYv8Q',
            dq: 'pklBCncZT5_Bnpdnv-jfwZZq2qGsOPobGurYwyF-BOaaQFtlipQkop5WQNq9-OPKMDY82OKBWt-q10JOHqGYR_t8zY1sLWnHI8D9notLV554lhr2LFp2_jWN51yuZDpK6tyzWsXKdGP9qU4M0TUidXwZH3_fV0uHz8suoBfu1ZlS6sw0-wzkwTJC_KScs8b3LJKvJQxKOqxHhsplBjao8dvlQEvVS00lTbKTdKYpTJqyCHe5FvRYBjPD6JoGjtMcOnz3nI-kPavF79HlwWsw0cfEHg7UYiYop713LsZ3H4HUMxqBh5l57W2UQnckBxUP96vza7sSuTz_qtrE17UPYQ',
            e: 'AQAB',
            ext: true,
            key_ops: ['sign'],
            kty: 'RSA',
            n: 'sPU4I4faB0IPvfeWjCcTfH0EWhLfzJRPCcL-f1tbaAY8jlGDdcAqrBPzlPjD5LhEngqx9zCT4o51Y9tPCiV9YCgmuNZ2FFwWORXjM-VTZ5CsK8DPa75DepgBtSNVRJHS1rDPFWP6IoR1gMKNa-5gZov5scJZ8WxF3zaepZGICAV0Cowv2_YE7Ots9Oov3oHRx3GSbLrDR9jrJXgn78FcNWpRDWs39N-4Y0wkjbADIrTElyLmsdiw-uhnJbPRUJ93VJVBwDDgk5fOWiSYSKo5AofnfVw0zRNx9lprkZVlg7WR9L5TKpvL9JLTItTdSzK4XeifDHftNp8RnAKynjl3_uaOPGhcev2gT99JEtoONnW59iQET2uJYzuyC2rpPJ7m-L3-gu0BM40Y73M7RmMaK_eutgQL0QiiKoYUjjVHDeXCuoec5_OUPBRALW9P8fYp9g0nLQf6oWZGJSTl4BN5rpozkIbQDr6puRcIoE3vdczNTClExcJmXq8kDdOqmYwxGqFwNxj74vd2HnfsAQvf-yAYh58_EULG_5pff5z1DQhYHa4tiedZjuGVl1wqw4pMQnG6d9vx3cn1Rrt-NOWeAvlzPcKHb3eTRstwEhVEX6lMqiPepDK04agat3cBUx8_N4vmFKY_MqiSHcVabGpnpRa7ixE7FgfsKQMhwPLczkM',
            p: '4-WMHRWnyoRdOd2avPksmizVvoLZ9LqYYLQuDWnJHi55PGgt8sfYxncHKRntM4zAEh7cy5OXPHHoyVx1RcCkZ_RcgcJGzxFZEeWFT_KA0X-JpPP_HiDench4AngPDmFjVgwyR9PXEkUaO1fiEkm3gCync0CXSwGJLfhXOXGL23rDUdxXeWXqErC25L3zu6hFTYCxs1VS8M3_5iYS57cTH2eu0HfgtgNqsjtCsF2TJb4f7Bt0-RGxa3YD-khl0lWH1NCkmqbXJqAE_GknuDK5GvhinFRYZK3-F0NGmc6mMZJrkRIDJ-X8cC2BFmtqnnbaUoxgP651lXDHBHWz_4q4Pw',
            q: 'xseW5dn9RF3E5S7pSM8_vZwrHRWC-29NYzUstKBWP01vUNPCw6QGrlEHbhetnB5Y7Pzivwj50vQcMt2LrZdvjVXBD2apfzmDEgGTSspwwPOi2xJTCfodB1fOOj_67IDfthIlikwBndJJNHcLY9yHbWignB1uWG9RAMxndCuNTkx4TiT7Nwiz-MkkylrkqESi9oUw71r1T7Xlarwa0wprGg9GP6jWYajjjE7mq0jMDQS84t7fYdK4Sd7M6uJfcsPfCncZtT9SbpLTVtB40xC1YtixGBu6vyl6Z82jo37s8GPB8AFw780z_opy6C7Mxtm-PQU-iERtxZL2XIq9CE1I_Q',
            qi: 'rvhRG0mrWZvdUWJbN0RC7Y4RxMS5TvM3gZE7odVcXlpkMFQfynB9Ci5q-XD4NX3O7E9urJr0rW-4XaL0YSdSlkrGeXEGJyS_kYbR2UxJNqmCXxWOzi-mDTFTrgbeyDpd1elM20n4RYflh7JwjBDDKBUFgvyq8SoH4cK_D6z47DmLB0sj1AsOBEvZBAvcKAEcw2zlUSzG7HnHooAuB5CZhbvbdRUekeNhtaYSwxCI-g2cZKLO1UZKvFayBaWp7qHcfOdScHox4cNRCgwFxTHWv3gQ68EbErFnPHQqYb7i9q2627g_ybwJlGlJ701a-iiKu8-2l_qOu0ujdL2p-mQKkg',
        },
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['sign']
    )
    .then((key) => {
        privateKey = key
        subtle
            .sign('RSASSA-PKCS1-v1_5', privateKey, getMessageEncoding('hello'))
            .then((data) => (signature = data))
    })

function getMessageEncoding(str) {
    let enc = new TextEncoder()
    return enc.encode(str)
}

function getMessageDecoding(input) {
    let dec = new TextDecoder()
    return dec.decode(input)
}

async function createSign() {
    let id = crypto.randomUUID()
    let sign = await subtle.sign('RSASSA-PKCS1-v1_5', privateKey, getMessageEncoding(id))
    return { id, sign }
}

function getRoomKeys(roomname) {
    if (!(roomname in rooms)) {
        return {}
    }
    const roomUsers = rooms[roomname].users
    const roomKeys = {}
    for (let user of roomUsers) {
        let userId = users[user]
        roomKeys[user] = keys[userId]
    }
    return roomKeys
}

function checkPassword(password, room) {
    return password == rooms[room].password
}

io.on('connection', (socket) => {
    //sends rooms to the user who just joined
    socket.emit('rooms_update', { rooms })
    socket.on('test', () => {
        socket.emit('test', { signature, message: 'hello' })
    })

    //when a message is recieved it sends it to the correct user
    socket.on('message', async ({ user, cipher, isPrivate }) => {
        const { id, sign } = await createSign()
        io.in(users[user]).emit('encryptedMessage', {
            user: socket.nickname,
            cipher,
            isPrivate,
            id,
            sign,
        })
    })

    socket.on('createRoom', async ({ roomname, user, limit, password }) => {
        if (roomname in rooms) {
            socket.emit('join_fail', 'Room already exists')
            return
        } else if (user in users) {
            socket.emit('join_fail', 'Username taken')
            return
        }
        socket.join(roomname)
        socket.room = roomname
        socket.nickname = user
        users[user] = socket.id
        rooms[roomname] = {
            users: [user],
            admin: socket.id,
            limit: limit,
            password: password.trim(),
        }
        const { id, sign } = await createSign()
        io.in(roomname).emit('serverMessage', {
            message: `${user} has joined the chat`,
            id: id,
            sign: sign,
        })
        io.emit('rooms_update', { rooms })
        io.in(roomname).emit('user_update', {
            roomInfo: rooms[roomname],
            id: id,
            sign: sign,
            keys: getRoomKeys(roomname),
        })
    })

    socket.on('join_room', async ({ roomname, user, password }) => {
        if (user in users) {
            socket.emit('join_fail', 'Username taken')
            return
        } else if (rooms[roomname].users.length == rooms[roomname].limit) {
            socket.emit('join_fail', `${roomname} is currently full`)
            return
        } else if (rooms[roomname].password && !checkPassword(password, roomname)) {
            socket.emit('join_fail', 'Incorrect Password')
            return
        }
        socket.join(roomname)
        socket.room = roomname
        socket.nickname = user
        users[user] = socket.id
        rooms[roomname].users.push(user)
        const { id, sign } = await createSign()
        io.in(roomname).emit('serverMessage', {
            message: `${user} has joined the chat`,
            id,
            sign,
        })
        io.in(roomname).emit('user_update', {
            roomInfo: rooms[roomname],
            id,
            sign,
            keys: getRoomKeys(roomname),
        })
    })

    socket.on('leave_room', async () => {
        let roomname = socket.room
        if (roomname in rooms) {
            rooms[roomname].users = rooms[roomname].users.filter(
                (user) => user != socket.nickname
            )
            if (rooms[roomname].users.length == 0) {
                delete rooms[roomname]
                io.emit('rooms_update', { rooms })
                return
            }
        }
        socket.leave(roomname)
        socket.room = null
        if (socket.nickname in users) {
            delete users[socket.nickname]
        }
        const { id, sign } = await createSign()
        io.in(roomname).emit('user_update', {
            roomInfo: rooms[roomname],
            id,
            sign,
            keys: getRoomKeys(roomname),
        })
        io.in(roomname).emit('serverMessage', {
            message: `${socket.nickname} has left the chat`,
            id,
            sign,
        })
    })

    socket.on('kick_user', async ({ user }) => {
        const { id, sign } = await createSign()
        io.to(users[user]).emit('remove_user', { id, sign })
    })

    socket.on('publicKey', ({ key }) => {
        keys[socket.id] = key
    })

    socket.on('disconnect', async () => {
        let roomname = socket.room
        if (roomname in rooms) {
            rooms[roomname].users = rooms[roomname].users.filter(
                (user) => user != socket.nickname
            )
            if (rooms[roomname].users.length == 0) {
                delete rooms[roomname]
                io.emit('rooms_update', { rooms })
            }
        }
        delete keys[socket.id]
        if (socket.nickname in users) {
            delete users[socket.nickname]
        }
        const { id, sign } = await createSign()
        io.in(roomname).emit('user_update', {
            roomInfo: rooms[roomname],
            id,
            sign,
            keys: getRoomKeys(roomname),
        })
        io.in(roomname).emit('serverMessage', {
            message: `${socket.nickname} has left the chat`,
            id,
            sign,
        })
    })
})

server.listen(3000, () => {
    console.log('listening on http://localhost:3000')
})
