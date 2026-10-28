import { Request } from 'express';
import { prisma } from '../config/database.js';
import { parseDeviceInfo, DeviceInfo } from '../utils/deviceParser.js';
import { sendNewDeviceLoginAlertEmail } from '../config/email.js';
import { broadcastSessionRevoked } from '../config/socket.js';

export class SessionService {
  /**
   * Record a login event, detect new devices, dispatch security alert if new, and return the session
   */
  static async recordLoginSession(
    user: { id: string; email: string; name: string },
    req: Request
  ) {
    const device: DeviceInfo = parseDeviceInfo(req);

    try {
      // 1. Check if user already has an existing session record with this OS + Browser
      const existingMatchingDevice = await prisma.userSession.findFirst({
        where: {
          userId: user.id,
          os: device.os,
          browser: device.browser,
        },
      });

      // 2. Count all historical sessions for this user to check if this is the very first login
      const totalUserSessions = await prisma.userSession.count({
        where: { userId: user.id },
      });

      // If user has previous logins, but never from this Browser + OS combination -> NEW DEVICE!
      const isNewDevice = totalUserSessions > 0 && !existingMatchingDevice;

      if (isNewDevice) {
        console.log(`🛡️ [Security] New device login detected for ${user.email}: ${device.browser} on ${device.os} (${device.ipAddress})`);
        // Asynchronously dispatch security alert email
        sendNewDeviceLoginAlertEmail({
          toEmail: user.email,
          name: user.name,
          deviceType: device.deviceType,
          browser: device.browser,
          os: device.os,
          ipAddress: device.ipAddress,
          time: new Date(),
        }).catch((err) => {
          console.warn('⚠️ Failed to dispatch new device security email:', err.message);
        });
      }

      // 3. Find if there's an active session with this exact device + IP to update lastActive
      let session = await prisma.userSession.findFirst({
        where: {
          userId: user.id,
          os: device.os,
          browser: device.browser,
          ipAddress: device.ipAddress,
          isRevoked: false,
        },
      });

      if (session) {
        session = await prisma.userSession.update({
          where: { id: session.id },
          data: {
            lastActive: new Date(),
            userAgent: device.userAgent,
          },
        });
      } else {
        // Create brand-new active session
        session = await prisma.userSession.create({
          data: {
            userId: user.id,
            deviceType: device.deviceType,
            browser: device.browser,
            os: device.os,
            ipAddress: device.ipAddress,
            userAgent: device.userAgent,
            lastActive: new Date(),
            isRevoked: false,
          },
        });
      }

      return {
        session,
        isNewDevice,
      };
    } catch (err) {
      console.error('Error recording user session:', err);
      return null;
    }
  }

  /**
   * Get all active sessions for a user, marking the current session
   */
  static async getUserSessions(userId: string, currentSessionId?: string, req?: Request) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: {
        lastActive: 'desc',
      },
      select: {
        id: true,
        deviceType: true,
        browser: true,
        os: true,
        ipAddress: true,
        lastActive: true,
        createdAt: true,
      },
    });

    let currentDeviceInfo: DeviceInfo | null = null;
    if (req) {
      currentDeviceInfo = parseDeviceInfo(req);
    }

    return sessions.map((s) => {
      let isCurrentDevice = false;

      if (currentSessionId && s.id === currentSessionId) {
        isCurrentDevice = true;
      } else if (
        currentDeviceInfo &&
        s.browser === currentDeviceInfo.browser &&
        s.os === currentDeviceInfo.os &&
        s.ipAddress === currentDeviceInfo.ipAddress
      ) {
        isCurrentDevice = true;
      }

      return {
        ...s,
        isCurrentDevice,
      };
    });
  }

  /**
   * Revoke a specific session (Log out device)
   */
  static async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new Error('Device session not found or already terminated.');
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    broadcastSessionRevoked(sessionId, userId);

    return { success: true, message: 'Device session successfully revoked.' };
  }

  /**
   * Revoke all other sessions except current device
   */
  static async revokeOtherSessions(userId: string, currentSessionId?: string, req?: Request) {
    let excludeId = currentSessionId;

    if (!excludeId && req) {
      const current = parseDeviceInfo(req);
      const match = await prisma.userSession.findFirst({
        where: {
          userId,
          browser: current.browser,
          os: current.os,
          ipAddress: current.ipAddress,
          isRevoked: false,
        },
        orderBy: { lastActive: 'desc' },
      });
      if (match) excludeId = match.id;
    }

    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        isRevoked: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isRevoked: true },
    });

    broadcastSessionRevoked(excludeId || 'others', userId);

    return {
      success: true,
      message: `Terminated ${result.count} other active device session(s).`,
      count: result.count,
    };
  }
}
