import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

// GET all employees (admin only — enforced by proxy.ts for /api/admin/*)
export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find({}).sort({ createdAt: -1 });
    return createSuccessResponse({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch employees', 500);
  }
}

// POST create a new employee
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !email.trim()) {
      return createErrorResponse('Please provide an email', 400);
    }
    if (!password || password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400);
    }

    const existing = await Employee.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return createErrorResponse('An employee with this email already exists', 409);
    }

    const employee = await Employee.create({ email: email.trim(), password });

    return createSuccessResponse(
      {
        message: 'Employee created successfully',
        employee: { _id: employee._id, email: employee.email, isActive: employee.isActive, createdAt: employee.createdAt },
      },
      201
    );
  } catch (error) {
    console.error('Create employee error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to create employee', 500);
  }
}
