import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { hashPassword } from '@/lib/utils/password';
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

      // Find user with single-retry guard against frozen/stale sockets
      let user: any = null;
      try {
        user = await User.findOne({ email: normalizedEmail })
          .select('+password')
          .maxTimeMS(4000);
      } catch (queryErr: any) {
        if (isDatabaseConnectivityError(queryErr) || String(queryErr?.message || '').includes('topology') || String(queryErr?.message || '').includes('closed')) {
          console.warn('[loginTask] Stale socket detected, reconnecting and retrying query...');
          await connectDB();
          user = await User.findOne({ email: normalizedEmail })
            .select('+password')
            .maxTimeMS(4000);
        } else {
          throw queryErr;
        }
      }

      if (!user) {
        // Fallback: Check Employee model
        const Employee = (await import('@/lib/models/Employee')).default;
        const employee = await Employee.findOne({ email: normalizedEmail })
          .select('+password')
          .maxTimeMS(4000);

        if (employee) {
          const isEmployeePasswordValid = await employee.comparePassword(password);
          if (isEmployeePasswordValid && employee.isActive) {
            // Auto-migrate legacy password hash to fast WebCrypto hash synchronously
            if (employee.password && !employee.password.startsWith('sha256:')) {
              try {
                const modernHash = await hashPassword(password);
                await Employee.updateOne({ _id: employee._id }, { $set: { password: modernHash } }).maxTimeMS(2000);
              } catch (e) {
                console.warn('[loginTask] Employee password migration skipped:', e);
              }
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

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return createErrorResponse('Invalid credentials', 401);
      }

      // Auto-migrate legacy password hash to fast WebCrypto hash synchronously
      if (user.password && !user.password.startsWith('sha256:')) {
        try {
          const modernHash = await hashPassword(password);
          await User.updateOne({ _id: user._id }, { $set: { password: modernHash } }).maxTimeMS(2000);
        } catch (e) {
          console.warn('[loginTask] Password migration skipped:', e);
        }
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
