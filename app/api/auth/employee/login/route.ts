import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return createErrorResponse('Please provide email and password', 400);
    }

    const employee = await Employee.findOne({ email: normalizedEmail }).select('+password');

    if (!employee) {
      return createErrorResponse('Invalid credentials', 401);
    }

    const isPasswordValid = await employee.comparePassword(password);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid credentials', 401);
    }

    if (!employee.isActive) {
      return createErrorResponse('Your account has been deactivated. Contact an admin.', 403);
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
          name: employee.email,
          email: employee.email,
          role: 'employee',
          isApproved: true,
        },
      },
      200
    );
  } catch (error) {
    console.error('Employee login error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Login failed', 500);
  }
}
