import { Socket } from 'socket.io';

import {
    BROADCAST_DISCONNECTED_MESSAGE, BROADCAST_JOINED_MESSAGE, BROADCAST_KICK_MESSAGE,
    EVENT_EMIT_MESSAGE, EVENT_JOIN_FAIL, EVENT_JOIN_SUCCESSFUL, EVENT_KICK, KICK_SILENT_MS,
    KICKED_MESSAGE, KICKED_NO_AUTH_MESSAGE, NICKNAME_TAKEN, EVENT_JOIN, EVENT_RECEIVE_MESSAGE, EVENT_LEAVE
} from '@config/consts';
import { RoomAnnouncment, RoomMessage, RoomUser, RoomJoinResponse } from '@types';

type BroadcastDataToUsers = string[] | RoomMessage | RoomAnnouncment;
type EmitDataToSocket = string | RoomJoinResponse;

export class ChatRoom {
  public readonly users: Map<string, RoomUser>;

  constructor() {
    this.users = new Map();
  }


  // Graceful stop, by cleaning room users and disconnecting them
  public stop() {
    this.users.forEach(user => {
      this.clearRoomUser(user);
      user.socket.disconnect(true);
    });
    this.users.clear();
  }


  public addUser(nickname: string, socket: Socket) {
    this.eventReceived(socket, EVENT_JOIN, nickname);

    // Fail join, if socket already connected or nickname is taken
    if (this.hasNickname(nickname) || this.users.has(socket.id)) {
      return this.emitToSocket(socket, EVENT_JOIN_FAIL, NICKNAME_TAKEN);
    }

    this.users.set(socket.id, {
      socket,
      nickname,
      timeoutHandle: this.scheduleTimeout(socket.id),
    });

    // Emit successful join and broadcast about new user auth
    this.emitToSocket(socket, EVENT_JOIN_SUCCESSFUL, { nickname });
    this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
      timestamp: +new Date(),
      text: BROADCAST_JOINED_MESSAGE(nickname),
      isAnnouncment: true,
    });
  }


  public message(text: string, socket: Socket) {
    this.eventReceived(socket, EVENT_RECEIVE_MESSAGE, text);
    const roomUser = this.users.get(socket.id);

    // If we can't find such user, emit kick event
    if (!roomUser) {
      return this.emitToSocket(socket, EVENT_KICK, KICKED_NO_AUTH_MESSAGE);
    }

    // If text is provided, then broadcast message to room
    if (!!text) {
      roomUser.timeoutHandle = this.scheduleTimeout(socket.id);
      this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
        text,
        nickname: roomUser.nickname,
        timestamp: +new Date(),
        isAnnouncment: false,
      });
    }
  }


  public disconnected(socket: Socket) {
    this.eventReceived(socket, EVENT_LEAVE);
    const roomUser = this.users.get(socket.id);

    // If user was present in room, broadcast about his absence and clear him from room
    if (!!roomUser) {
      this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
        text: BROADCAST_DISCONNECTED_MESSAGE(roomUser.nickname),
        timestamp: +new Date(),
        isAnnouncment: true,
      });
      this.clearRoomUser(roomUser);
    }
  }



// ---

  // Reset/create inactivity timeout
  private scheduleTimeout(socketId: string) {
    const roomUser = this.users.get(socketId);
    if (!!roomUser && roomUser.timeoutHandle) {
      clearTimeout(roomUser.timeoutHandle);
    }

    return setTimeout(this.kick.bind(this, socketId), KICK_SILENT_MS);
  }


  private kick(socketId: string) {
    const roomUser = this.users.get(socketId);

    if (!!roomUser) {
      this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
        text: BROADCAST_KICK_MESSAGE(roomUser.nickname),
        timestamp: +new Date(),
        isAnnouncment: true,
      });

      this.emitToSocket(roomUser.socket, EVENT_KICK, KICKED_MESSAGE);
      this.clearRoomUser(roomUser);
    }
  }


  private eventReceived(socket: Socket, event: string, data?: any) {
    const roomUser = this.users.get(socket.id);
    let nickname = `Socket#${socket.id}`;
    if (!!roomUser && !!roomUser.nickname) {
      nickname = roomUser.nickname;
    }

    console.log(`Received event from "${nickname}" '${event}': ${JSON.stringify(data)}`);
  }


  private emitToSocket(socket: Socket, event: string, data: EmitDataToSocket) {
    const roomUser = this.users.get(socket.id);
    let nickname = `Socket#${socket.id}`;
    if (!!roomUser && !!roomUser.nickname) {
      nickname = roomUser.nickname;
    }

    console.log(`Emit to "${nickname}" '${event}': ${JSON.stringify(data)}`);
    socket.emit(event, data);
  }


  private broadcastDataToUsers(event: string, data: BroadcastDataToUsers) {
    console.log(`Broadcast '${event}': ${JSON.stringify(data)}`);
    this.users.forEach(user => user.socket.emit(event, data));
  }


  private hasNickname(nickname: string) {
    return !![...this.users.values()].filter(roomUser => roomUser.nickname === nickname).length;
  }


  private clearRoomUser(roomUser: RoomUser) {
    clearTimeout(roomUser.timeoutHandle);
    this.users.delete(roomUser.socket.id);
  }
}
