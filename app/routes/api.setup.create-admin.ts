import { type ActionFunctionArgs } from "react-router";
import { ConfigStore } from "~/lib/config.server";
import { DatabaseConnectionManager } from "~/lib/db-connection.server";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";

/**
 * API endpoint for creating the initial admin user
 * Validates input, enforces password requirements, and creates user with admin role
 */

export async function action({ request }: ActionFunctionArgs) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return Response.json({
            success: false,
            error: 'Method not allowed'
        }, { status: 405 });
    }

    try {
        // Parse request body
        const body = await request.json();

        // Validate admin user input
        const validation = validateAdminInput(body);
        if (!validation.valid) {
            return Response.json({
                success: false,
                error: validation.error,
                suggestions: validation.suggestions
            }, { status: 400 });
        }

        const { email, password, name } = body;

        // Load configuration
        const configStore = new ConfigStore();
        const config = await configStore.load();

        if (!config || !config.databaseConfig) {
            return Response.json({
                success: false,
                error: 'Configuration not found. Please complete setup first.'
            }, { status: 400 });
        }

        // Create database adapter
        const connectionManager = new DatabaseConnectionManager();
        const adapter = await connectionManager.createAdapter(config.databaseConfig);

        // Create temporary auth instance for user creation
        const tempAuth = betterAuth({
            database: adapter,
            baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
            secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
            emailAndPassword: {
                enabled: true,
                requireEmailVerification: false,
                password: {
                    hash: async (password) => {
                        return await bcrypt.hash(password, 10);
                    },
                    verify: async ({ hash, password }) => {
                        return await bcrypt.compare(password, hash);
                    },
                },
                minPasswordLength: 8,
                maxPasswordLength: 128,
            },
            plugins: [
                admin({
                    defaultRole: "user",
                }),
            ],
        });

        // Create admin user
        try {
            // Use Better Auth's signUp method to create the user
            const result = await tempAuth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                },
            });

            if (!result || !result.user) {
                throw new Error('Failed to create user');
            }

            // Update user role to admin using direct database access
            // This is necessary because Better Auth doesn't provide a direct way to set role during signup
            const userId = result.user.id;

            // Update role based on database type
            if (config.databaseConfig.type === 'sqlite') {
                const db = adapter as Database.Database;
                db.prepare('UPDATE user SET role = ? WHERE id = ?').run('admin', userId);
            } else if (config.databaseConfig.type === 'postgresql') {
                const pool = adapter as any; // pg.Pool
                await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId]);
            }

            return Response.json({
                success: true,
                message: 'Admin user created successfully',
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: 'admin'
                }
            });
        } catch (error: any) {
            console.error('User creation error:', error);

            // Handle specific errors
            if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
                return Response.json({
                    success: false,
                    error: 'A user with this email already exists',
                    suggestions: [
                        'Use a different email address',
                        'Check if the database was already initialized'
                    ]
                }, { status: 400 });
            }

            return Response.json({
                success: false,
                error: error.message || 'Failed to create admin user',
                suggestions: [
                    'Verify the database is properly configured',
                    'Check that migrations were completed successfully',
                    'Review the error message for details'
                ]
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Admin creation endpoint error:', error);

        return Response.json({
            success: false,
            error: error.message || 'Failed to create admin user',
            suggestions: [
                'Ensure configuration is saved',
                'Verify migrations were completed',
                'Check the error message for details'
            ]
        }, { status: 500 });
    }
}

/**
 * Validate admin user input
 * Enforces password requirements and validates email format
 */
function validateAdminInput(body: any): {
    valid: boolean;
    error?: string;
    suggestions?: string[]
} {
    // Check required fields
    if (!body || typeof body !== 'object') {
        return {
            valid: false,
            error: 'Invalid request body',
            suggestions: ['Provide email, password, and name fields']
        };
    }

    const { email, password, name } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
        return {
            valid: false,
            error: 'Email is required',
            suggestions: ['Provide a valid email address']
        };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            valid: false,
            error: 'Invalid email format',
            suggestions: ['Provide a valid email address (e.g., admin@example.com)']
        };
    }

    // Validate password
    if (!password || typeof password !== 'string') {
        return {
            valid: false,
            error: 'Password is required',
            suggestions: ['Provide a password']
        };
    }

    // Enforce password requirements
    if (password.length < 8) {
        return {
            valid: false,
            error: 'Password must be at least 8 characters long',
            suggestions: [
                'Use a password with at least 8 characters',
                'Include a mix of letters, numbers, and special characters for better security'
            ]
        };
    }

    if (password.length > 128) {
        return {
            valid: false,
            error: 'Password must be less than 128 characters',
            suggestions: ['Use a shorter password']
        };
    }

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
        return {
            valid: false,
            error: 'Name is required',
            suggestions: ['Provide a name for the admin user']
        };
    }

    return { valid: true };
}
