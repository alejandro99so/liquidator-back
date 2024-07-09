import { JWTPayload } from "jose";

export interface IPayload extends JWTPayload {
  address?: string;
  signature?: string;
  iat?: number;
  exp?: number;
}
