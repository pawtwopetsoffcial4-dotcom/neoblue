import { connectDB, isDatabaseConnectivityError } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
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

      // Find user and include password field with a max query execution time
      let user = await User.findOne({ email: normalizedEmail })
        .select('+password')
        .maxTimeMS(4000);

      if (!user) {
        // Fallback: Check Employee model
        const Employee = (await import('@/lib/models/Employee')).default;
        const employee = await Employee.findOne({ email: normalizedEmail })
          .select('+password')
          .maxTimeMS(4000);

        if (employee) {
          const isEmployeePasswordValid = await employee.comparePassword(password);
          if (isEmployeePasswordValid && employee.isActive) {
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
        const err = new Error('Database operation timed out. Please try again.') as any;
        err.code = 'DB_CONNECTIVITY_TIMEOUT';
        reject(err);
      }, 6500);
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
    const message = isConnErr
      ? 'Database connectivity issue. Please try again in a few seconds.'
      : (error.message || 'Login failed');
    return createErrorResponse(message, status);
  }
}
