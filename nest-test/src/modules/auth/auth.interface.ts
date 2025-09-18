export type TPayloadJwt = {
  id: number;
  username: string;
};

export interface IResAuth {
  accessToken: string;
  refreshToken: string;
}

// export interface ForgotPasswordResponseData {
//   code?: string;
//   token?: string;
//   user?: user;
// }
