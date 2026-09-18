import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

// PATCH update employee (email, password, isActive) — admin only
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid employee ID', 400);
    }

    const { email, password, isActive } = await request.json();

    const employee = await Employee.findById(id);
    if (!employee) {
      return createErrorResponse('Employee not found', 404);
    }

    if (email !== undefined) {
      const trimmed = String(email).trim();
      if (!trimmed) {
        return createErrorResponse('Email cannot be empty', 400);
      }
      const existing = await Employee.findOne({ email: trimmed.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return createErrorResponse('An employee with this email already exists', 409);
      }
      employee.email = trimmed;
    }

    if (password) {
      if (password.length < 6) {
        return createErrorResponse('Password must be at least 6 characters', 400);
      }
      employee.password = password;
    }

    if (isActive !== undefined) {
      employee.isActive = Boolean(isActive);
    }

    await employee.save();

    return createSuccessResponse({
      message: 'Employee updated successfully',
      employee: { _id: employee._id, email: employee.email, isActive: employee.isActive, createdAt: employee.createdAt },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to update employee', 500);
  }
}

// DELETE an employee — admin only
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid employee ID', 400);
    }

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return createErrorResponse('Employee not found', 404);
    }

    return createSuccessResponse({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to delete employee', 500);
  }
}
