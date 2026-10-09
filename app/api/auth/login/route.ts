import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import mongoose from 'mongoose';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON body', 400);
    }

    const { email, password } = body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate input before any database calls
    if (!normalizedEmail || !password) {
      return createErrorResponse('Please provide email and password', 400);
    }

    const loginTask = async () => {
      await connectDB();
      let db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection is not ready');
      }

      // Query native collection directly with automatic retry on stale connection pool
      let user: any = null;
      try {
        user = await db.collection('users').findOne({ email: normalizedEmail });
      } catch (err: any) {
        if (isDatabaseConnectivityError(err)) {
          console.warn('[loginTask] Stale connection pool, forcing fresh reconnect...', err.message);
          await connectDB(true);
          db = mongoose.connection.db;
          if (!db) throw err;
          user = await db.collection('users').findOne({ email: normalizedEmail });
        } else {
          throw err;
        }
      }

      if (!user) {
        // Fallback: Check Employee collection
        let employee: any = null;
        try {
          employee = await db.collection('employees').findOne({ email: normalizedEmail });
        } catch (err: any) {
          if (isDatabaseConnectivityError(err)) {
            await connectDB(true);
            db = mongoose.connection.db;
            if (!db) throw err;
            employee = await db.collection('employees').findOne({ email: normalizedEmail });
          } else {
            throw err;
          }
        }

        if (employee) {
          const isEmployeePasswordValid = await verifyPassword(password, employee.password, employee.email);
          if (isEmployeePasswordValid && employee.isActive) {
            if (employee.password && !employee.password.startsWith('sha256:')) {
              try {
                const modernHash = await hashPassword(password);
                await db.collection('employees').updateOne({ _id: employee._id }, { $set: { password: modernHash } });
              } catch {}
            }

            const token = generateToken({
              userId: employee._id.toString(),
              email: employee.email,
              role: 'employee',
            });
            return createSuccessResponse(
              {
                message: 'Login successful',
                token,
                user: {
                  id: employee._id,
                  name: employee.email.split('@')[0],
                  email: employee.email,
                  role: 'employee',
                  isApproved: true,
                },
              },
              200
            );
          }
        }
        return createErrorResponse('Invalid credentials', 401);
      }

      // Check password using fast WebCrypto / admin fast-path (< 0.1ms CPU)
      const isPasswordValid = await verifyPassword(password, user.password, user.email);
      if (!isPasswordValid) {
        return createErrorResponse('Invalid credentials', 401);
      }

      // Auto-migrate legacy password hash to fast WebCrypto hash
      if (user.password && !user.password.startsWith('sha256:')) {
        try {
          const modernHash = await hashPassword(password);
          await db.collection('users').updateOne({ _id: user._id }, { $set: { password: modernHash } });
        } catch {}
      }

      // Vendors can login only after admin approval
      if (user.role === 'vendor' && !user.isApproved) {
        return createErrorResponse('Vendor account not approved yet', 403);
      }

      // Generate JWT token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return createSuccessResponse(
        {
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isApproved: user.isApproved,
          },
        },
        200
      );
    };

    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error('Database operation timed out after 15000ms. Please try again.') as any;
        err.code = 'DB_CONNECTIVITY_TIMEOUT';
        reject(err);
      }, 15000);
    });

    try {
      return await Promise.race([loginTask(), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (error: any) {
    console.error('Login error:', error);
    const isConnErr =
      error?.code === 'DB_CONNECTIVITY_UNAVAILABLE' ||
      error?.code === 'DB_CONNECTIVITY_TIMEOUT' ||
      isDatabaseConnectivityError(error);
    const status = isConnErr ? 503 : 500;
    const message = error?.message || 'Login failed';
    return createErrorResponse(message, status);
  }
}
