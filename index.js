import { Wasteof2, Wasteof2Auth, Wasteof3 } from "wasteof-client";
import "dotenv/config"

const username = 'wasteof-client3'
const password = process.env['PASSWORD']
const commands = ['time','random','raw','parsed']
const wasteof = new Wasteof2Auth(username,password)
async function main() {
    await wasteof.login()
    wasteof.listen(async (event) => {
        console.log(event)
        if (event.type == 'updateMessageCount') {
            if (event.data !== 0) {
                const messages = await getAllMessages()
                var ids = []
                for (let l = 0; l < messages.length;l++) {
                    ids.push(messages[l]._id)
                }
                await wasteof.markAsRead(ids)
                for (let i = 0; i < messages.length; i++) {
                    const current = messages[i]
                    if (current.type == 'wall_comment' || current.type == 'wall_comment_reply') {
                        if (current.data.comment.content.split('!')[1] !== undefined) {
                            const command = current.data.comment.content.split('!')[1].split('</p>')[0]
                            if (commands.includes(command)) {
                                const res = await parseCommand(current.data,command)
                                await wasteof.postWallComment(current.data.wall.name, res, current.data.comment._id)
                            } else {
                                await wasteof.postWallComment(current.data.wall.name, `@${current.data.actor.name}, invalid command! :(`, current.data.comment._id)
                            }
                        }
                    }
                }
            }
        }
    })
}

async function parseCommand(comment, command) {
    if (command == 'time') {
        const time = new Date()
        return `it's ${time.toUTCString()}`
    } else if (command == 'random') {
        return `${Math.random()}`
    } else if (command == 'parsed') {
        const time = new Date(comment.comment.time)
        let parent = 'null'
        if (![undefined,null].includes(comment.comment.parent)) {
            parent = comment.comment.parent
        }
        return `
        <ul>
            <li>actor name: ${comment.actor.name}</li>
            <li>actor id: ${comment.actor.id}</li>
            <li>wall name: ${comment.wall.name}</li>
            <li>comment id: ${comment.comment._id}</li>
            <li>parent id: ${parent}</li>
            <li>time: ${time.toUTCString()}</li>
        </ul>
        `
    }
}

async function getAllMessages() {
    let last = false
    let msg = []
    for (let i = 1;!last;i++) {
        const current = await wasteof.getUnreadMessages(i)
        last = current.last
        for (let l = 0; l < current.unread.length; l++) {
            msg.push(current.unread[l])
        }
    }
    return msg
}
main()