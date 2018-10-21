import { Socket, Server } from "socket.io";

import { ChatRoom } from "@chat/chat.room";
import {
  EVENT_JOIN, EVENT_RECEIVE_MESSAGE, EVENT_LEAVE
} from "@config/consts";


export class ChatSocket {
  private io: Server;
  private chatRoom: ChatRoom;

  constructor(io: Server) {
    this.io = io;
    this.chatRoom = new ChatRoom();
  }

  public start() {
    this.io.on('connection', this.onConnection.bind(this));
  }

  public onConnection(socket: Socket) {
    socket.on('disconnect', () => {
      console.log(`Socket#${socket.id}: disconnected`);
      this.chatRoom.disconnected(socket.id);
    });
    socket.on('error', (error) => {
      console.log(`Socket#${socket.id}: error`, error);
    });

    socket.on(EVENT_JOIN, (nickname) => this.chatRoom.addUser(nickname.toString(), socket));
    socket.on(EVENT_LEAVE, () => this.chatRoom.disconnected(socket.id));
    socket.on(EVENT_RECEIVE_MESSAGE, (message) => this.chatRoom.receiveMessage(message.toString(), socket.id));

    console.log(`Socket#${socket.id}: connected`);
  }

  public stop() {
    this.chatRoom.stop();
    this.io.close();
  }
}
