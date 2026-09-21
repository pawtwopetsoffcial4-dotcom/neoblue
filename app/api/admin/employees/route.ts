import { connectDB } from '@/lib/db';
import Employee, { dropLegacyEmployeeIndexes } from '@/lib/models/Employee';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';
import { NextRequest } from 'next/server';

// GET all employees (admin only — enforced by proxy.ts for /api/admin/*)
export async function GET() {
  try {
    await connectDB();
    await dropLegacyEmployeeIndexes().catch(() => {});
    const [employees, userEmployees] = await Promise.all([
      Employee.find({}).sort({ createdAt: -1 }),
      User.find({ role: 'employee' }).select('email createdAt').sort({ createdAt: -1 }),
    ]);

    const employeeMap = new Map<string, any>();

    employees.forEach((emp) => {
      employeeMap.set(emp.email.toLowerCase(), {
        _id: emp._id.toString(),
        email: emp.email,
        isActive: emp.isActive,
        createdAt: emp.createdAt,
      });
    });

    userEmployees.forEach((u) => {
      const emailLower = u.email.toLowerCase();
      if (!employeeMap.has(emailLower)) {
        employeeMap.set(emailLower, {
          _id: u._id.toString(),
          email: u.email,
          isActive: true,
          createdAt: u.createdAt,
        });
      }
    });

    return createSuccessResponse({ employees: Array.from(employeeMap.values()) });
  } catch (error) {
    console.error('Get employees error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch employees', 500);
  }
}

// POST create or assign a new employee
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await dropLegacyEmployeeIndexes().catch(() => {});

    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return createErrorResponse('Please provide an email', 400);
    }

    const empPassword = password && password.length >= 6 ? password : 'Employee@123';

    // 1. Upsert in Employee model
    let employee = await Employee.findOne({ email: normalizedEmail });
    if (employee) {
      employee.isActive = true;
      employee.username = normalizedEmail;
      if (password && password.length >= 6) {
        employee.password = password;
      }
      await employee.save();
    } else {
      try {
        employee = await Employee.create({
          email: normalizedEmail,
          username: normalizedEmail,
          password: empPassword,
          isActive: true,
        });
      } catch (err: any) {
        // If duplicate key on legacy username index, drop index and retry
        if (err?.code === 11000 || String(err?.message || '').includes('E11000')) {
          await dropLegacyEmployeeIndexes().catch(() => {});
          employee = await Employee.findOneAndUpdate(
            { email: normalizedEmail },
            {
              $set: {
                email: normalizedEmail,
                username: normalizedEmail,
                isActive: true,
                ...(password && password.length >= 6 ? { password: empPassword } : {}),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } else {
          throw err;
        }
      }
    }

    // 2. Sync with User model
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.role = 'employee';
      user.isApproved = true;
      if (password && password.length >= 6) {
        user.password = password;
      }
      await user.save();
    } else {
      user = await User.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: empPassword,
        role: 'employee',
        isApproved: true,
      });
    }

    return createSuccessResponse(
      {
        message: 'Employee assigned successfully',
        employee: { _id: employee._id, email: employee.email, isActive: employee.isActive, createdAt: employee.createdAt },
      },
      201
    );
  } catch (error) {
    console.error('Create employee error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to create employee', 500);
  }
}
