import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Employee from '@/lib/models/Employee';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

// POST promote, demote, or set role (admin | employee | user) by email or userId
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Forbidden', 403);
    }

    const { email, userId, action = 'promote', password } = await request.json();

    if (!email && !userId) {
      return createErrorResponse('Provide email or userId', 400);
    }

    const validActions = ['promote', 'demote', 'make_employee', 'remove_employee', 'make_admin', 'make_user'];
    if (!validActions.includes(action)) {
      return createErrorResponse('Invalid action', 400);
    }

    let user = null;
    let normalizedEmail = '';

    if (email) {
      normalizedEmail = String(email).trim().toLowerCase();
      user = await User.findOne({ email: normalizedEmail });
    } else if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return createErrorResponse('Invalid userId', 400);
      }
      user = await User.findById(userId);
      if (user) {
        normalizedEmail = user.email.toLowerCase();
      }
    }

    // If user does not exist in User collection, but action is make_employee and email is provided:
    if (!user && (action === 'make_employee' || action === 'promote' || action === 'make_admin') && normalizedEmail) {
      // Create user account or employee credential
      const empPassword = password || 'Employee@123';
      
      // Upsert in Employee model
      let employee = await Employee.findOne({ email: normalizedEmail });
      if (employee) {
        employee.isActive = true;
        if (password) employee.password = password;
        await employee.save();
      } else {
        employee = await Employee.create({
          email: normalizedEmail,
          password: empPassword,
          isActive: true,
        });
      }

      // Also create matching User account so they can log in anywhere
      user = await User.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: empPassword,
        role: action === 'make_employee' ? 'employee' : 'admin',
        isApproved: true,
      });

      return createSuccessResponse({
        message: action === 'make_employee' ? `Created employee account for ${normalizedEmail}` : `Created admin account for ${normalizedEmail}`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    }

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if ((action === 'demote' || action === 'make_user' || action === 'remove_employee') && user._id.toString() === payload.userId) {
      return createErrorResponse('You cannot remove your own admin access', 400);
    }

    if (action === 'make_employee') {
      user.role = 'employee';
      user.isApproved = true;
      await user.save();

      // Sync with Employee model
      const empPassword = password || 'Employee@123';
      const existingEmp = await Employee.findOne({ email: user.email.toLowerCase() });
      if (existingEmp) {
        existingEmp.isActive = true;
        if (password) existingEmp.password = password;
        await existingEmp.save();
      } else {
        await Employee.create({
          email: user.email.toLowerCase(),
          password: empPassword,
          isActive: true,
        });
      }

      return createSuccessResponse({
        message: `${user.email} is now an Employee`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    }

    if (action === 'promote' || action === 'make_admin') {
      user.role = 'admin';
      user.isApproved = true;
      await user.save();

      return createSuccessResponse({
        message: `${user.email} promoted to Admin successfully`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    }

    // Demote to regular user
    user.role = 'user';
    user.isApproved = true;
    await user.save();

    // Deactivate in Employee collection if exists
    await Employee.updateOne({ email: user.email.toLowerCase() }, { $set: { isActive: false } }).catch(() => {});

    return createSuccessResponse({
      message: `Role for ${user.email} set to User`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error: any) {
    console.error('Role update error:', error);
    return createErrorResponse(error.message || 'Failed to update user role', 500);
  }
}
