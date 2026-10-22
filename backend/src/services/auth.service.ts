import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { queueOtpEmail } from '../config/queues.js';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(payload: { id: string; email: string; name: string; role: 'USER' | 'ADMIN' }) {
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign({ id: payload.id }, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  static generateOtp(length: number = 6): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async register(name: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(password);

    // If it's the configured initial admin email, assign ADMIN role automatically
    const isInitialAdmin = email.toLowerCase().trim() === config.initialAdmin.email.toLowerCase();
    const role = isInitialAdmin ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
      ...tokens,
    };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.isBanned) {
      throw new Error('Your account has been suspended by an administrator.');
    }

    if (!user.passwordHash) {
      throw new Error('This account was created with social login. Please sign in with Google or GitHub.');
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
      ...tokens,
    };
  }

  static async requestPasswordResetOtp(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return true to avoid user enumeration attacks, but don't dispatch
      return { success: true, message: 'If an account exists, a verification code has been dispatched.' };
    }

    const otp = this.generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous active OTPs for this email
    await prisma.otpVerification.updateMany({
      where: { email: user.email, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.otpVerification.create({
      data: {
        email: user.email,
        otp,
        purpose: 'FORGOT_PASSWORD',
        expiresAt,
      },
    });

    // Queue email via BullMQ / Nodemailer
    await queueOtpEmail(user.email, otp, user.name);

    return {
      success: true,
      message: 'A 6-digit OTP verification code has been sent to your email address.',
    };
  }

  static async verifyOtp(email: string, otp: string) {
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new Error('Invalid or expired OTP code.');
    }

    return { success: true, message: 'OTP verified successfully.' };
  }

  static async resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new Error('Invalid or expired OTP verification code.');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: email.toLowerCase().trim() },
        data: { passwordHash },
      }),
      prisma.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true },
      }),
    ]);

    return { success: true, message: 'Password has been reset successfully. You can now log in.' };
  }

  static async handleOAuthUser(provider: 'google' | 'github', profile: { id: string; email: string; name: string; avatar?: string }) {
    let user = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase().trim() },
    });

    if (!user) {
      const isInitialAdmin = profile.email.toLowerCase().trim() === config.initialAdmin.email.toLowerCase();
      user = await prisma.user.create({
        data: {
          name: profile.name || 'Developer',
          email: profile.email.toLowerCase().trim(),
          avatar: profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.name)}`,
          oauthProvider: provider,
          oauthId: profile.id,
          role: isInitialAdmin ? 'ADMIN' : 'USER',
        },
      });
    } else {
      if (user.isBanned) {
        throw new Error('Account suspended by an administrator.');
      }
      // Update avatar or provider if unset
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: user.oauthProvider || provider,
          oauthId: user.oauthId || profile.id,
          avatar: user.avatar || profile.avatar,
        },
      });
    }

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
      ...tokens,
    };
  }
}
