import { Socket } from "socket.io";

export interface RoomUser {
  socket: Socket;
  nickname: string;
  timeoutHandle: number;
}

export interface RoomMessage {
  nickname: string;
  text: string;
  timestamp: number;
  isAnnouncment: false;
}

export interface RoomAnnouncment {
  text: string;
  timestamp: number;
  isAnnouncment: true;
}

export interface RoomJoinResponse {
  nickname: string;
}
