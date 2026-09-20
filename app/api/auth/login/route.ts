import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate input
    if (!normalizedEmail || !password) {
      return createErrorResponse('Please provide email and password', 400);
    }

    // Find user and include password field
    let user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      // Fallback: Check Employee model
      const Employee = (await import('@/lib/models/Employee')).default;
      const employee = await Employee.findOne({ email: normalizedEmail }).select('+password');
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
  } catch (error: any) {
    console.error('Login error:', error);
    return createErrorResponse(error.message || 'Login failed', 500);
  }
}
