import { Socket, Server } from "socket.io";

import { ChatRoom } from "@chat/chat.room";


export class ChatSocket {
  private io: Server;
  private chatRoom: ChatRoom;

  constructor(io: Server) {
    this.io = io;
    this.chatRoom = new ChatRoom();
  }

  public start() {
    this.io.on('connection', this.onConnection);
  }

  public onConnection(client: Socket) {
    console.log(`Client connected ${client.id}`);

    client.on('disconnect', () => {
      console.log(`Client disconnected ${client.id}`);
      // TODO: handleDisconnect
    })

    client.on('error', (err) => {
      console.log(`Received error from client ${client.id}`);
      console.log(err);
    })
  }
}
