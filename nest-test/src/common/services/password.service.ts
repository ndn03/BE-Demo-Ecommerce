import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class PasswordService {
  hashingPassword = (password: string) => bcrypt.hashSync(password, 10);
  comparePassword = (plainText: string, hash: string) =>
    bcrypt.compareSync(plainText, hash);
  generateRandomToken = () => uuidv4().toString();

  generateRandomPassword(length = 7): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    return Array.from({ length })
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
  }
}
