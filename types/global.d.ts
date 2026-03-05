import { TypedIO } from "./socket.types";



declare global {
  var io: TypedIO | undefined;
}
