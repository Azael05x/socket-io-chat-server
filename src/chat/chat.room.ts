import { Socket } from "socket.io";

export class ChatRoom {
  public readonly users: Map<string, Socket>;

}
