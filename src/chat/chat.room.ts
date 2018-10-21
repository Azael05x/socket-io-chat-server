import { Socket } from 'socket.io';

import {
    BROADCAST_DISCONNECTED_MESSAGE, BROADCAST_JOINED_MESSAGE, BROADCAST_KICK_MESSAGE,
    EVENT_EMIT_MESSAGE, EVENT_JOIN_FAIL, EVENT_JOIN_SUCCESSFUL, EVENT_KICK, KICK_SILENT_MS,
    KICKED_MESSAGE, KICKED_NO_AUTH_MESSAGE, NICKNAME_TAKEN
} from '@config/consts';
import { RoomAnnouncment, RoomMessage, RoomUser } from '@types';

type BroadcastDataToUsers = string[] | RoomMessage | RoomAnnouncment;

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
    // Fail join, if socket already connected or nickname is taken
    if (this.hasNickname(nickname) || this.users.has(socket.id)) {
      return socket.emit(EVENT_JOIN_FAIL, NICKNAME_TAKEN);
    }

    this.users.set(socket.id, {
      socket,
      nickname,
      timeoutHandle: this.scheduleTimeout(socket.id),
    });

    // Emit successful join and broadcast about new user auth
    socket.emit(EVENT_JOIN_SUCCESSFUL, { nickname });
    this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
      timestamp: +new Date(),
      text: BROADCAST_JOINED_MESSAGE(nickname),
      isAnnouncment: true,
    });
  }


  public message(text: string, socket: Socket) {
    const roomUser = this.users.get(socket.id);

    // If we can't find such user, emit kick event
    if (!roomUser) {
      socket.emit(EVENT_KICK, KICKED_NO_AUTH_MESSAGE);
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


  public disconnected(socketId: string) {
    const roomUser = this.users.get(socketId);

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
      roomUser.socket.emit(EVENT_KICK, KICKED_MESSAGE);
      this.clearRoomUser(roomUser);
    }
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
