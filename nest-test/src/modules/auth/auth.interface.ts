export type TPayloadJwt = {
  id: number;
  username: string;
};

export interface IResAuth {
  accessToken: string;
  refreshToken: string;
  user?: any; // Optional since createToken might not always include user
}

// export interface ForgotPasswordResponseData {
//   code?: string;
//   token?: string;
//   user?: user;
// }
