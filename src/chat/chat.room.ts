import { Socket } from "socket.io";

import { RoomUser, RoomMessage, RoomAnnouncment } from "@types";
import { NICKNAME_TAKEN, EVENT_EMIT_MESSAGE, EVENT_JOIN_FAIL, EVENT_JOIN_SUCCESSFUL, BROADCAST_JOINED_MESSAGE, BROADCAST_DISCONNECTED_MESSAGE, BROADCAST_KICK_MESSAGE, KICK_SILENT_MS, EVENT_KICK, DISCONNECTED_MESSAGE } from "@config/consts";

type BroadcastDataToUsers = string[] | RoomMessage | RoomAnnouncment;

export class ChatRoom {
  public readonly users: Map<string, RoomUser>;

  constructor() {
    this.users = new Map();
  }

  stop() {
    this.users.forEach(user => {
      this.clearRoomUser(user);
      user.socket.disconnect(true)
    });
    this.users.clear();
  }

  public addUser(nickname: string, socket: Socket) {
    if (this.hasNickname(nickname) || this.users.has(socket.id)) {
      socket.emit(EVENT_JOIN_FAIL, NICKNAME_TAKEN);
      return;
    }

    this.users.set(socket.id, {
      socket,
      nickname,
      timeoutHandle: this.scheduleTimeout(socket.id),
    });
    socket.emit(EVENT_JOIN_SUCCESSFUL, { nickname });

    this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
      timestamp: +new Date(),
      text: BROADCAST_JOINED_MESSAGE(nickname),
      isAnnouncment: true
    });
  }


  public receiveMessage(text: string, socketId: string) {
    const roomUser = this.users.get(socketId);
    if (!text || !roomUser) {
      return;
    }

    const messageData: RoomMessage = {
      text,
      nickname: roomUser.nickname,
      timestamp: +new Date(),
      isAnnouncment: false,
    };
    this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, messageData);

    roomUser.timeoutHandle = this.scheduleTimeout(socketId);
  }


  public disconnected(socketId: string) {
    const roomUser = this.users.get(socketId);

    if (!!roomUser) {
      const nickname = roomUser.nickname;

      this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
        text: BROADCAST_DISCONNECTED_MESSAGE(nickname),
        timestamp: +new Date(),
        isAnnouncment: true,
      });
      this.clearRoomUser(roomUser);
    }
  }



// ---

  private scheduleTimeout(socketId: string) {
    const roomUser = this.users.get(socketId);
    if (roomUser && roomUser.timeoutHandle) {
      clearTimeout(roomUser.timeoutHandle);
    }

    return setTimeout(this.handleTimeout.bind(this, socketId), KICK_SILENT_MS);
  }


  private handleTimeout(socketId: string) {
    this.kick(socketId);
  }


  private kick(socketId: string) {
    const roomUser = this.users.get(socketId);

    if (!!roomUser) {
      const nickname = roomUser.nickname;

      this.broadcastDataToUsers(EVENT_EMIT_MESSAGE, {
        text: BROADCAST_KICK_MESSAGE(nickname),
        timestamp: +new Date(),
        isAnnouncment: true
      });
      roomUser.socket.emit(EVENT_KICK, DISCONNECTED_MESSAGE);
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
    if (!!roomUser) {
      clearTimeout(roomUser.timeoutHandle);
      this.users.delete(roomUser.socket.id);
    }
  }
}
