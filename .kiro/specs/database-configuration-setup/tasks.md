# Implementation Plan

- [x] 1. Install required dependencies and setup project structure





  - Add `pg` package to package.json
  - Create `.data/` directory for configuration storage
  - Add `.data/` to .gitignore
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Implement configuration storage infrastructure






  - [x] 2.1 Create TypeScript interfaces for database configuration

    - Define `DatabaseConfig` interface with SQLite and PostgreSQL options
    - Define `SetupConfig` interface with setup completion flag
    - Create type guards for database type validation
    - _Requirements: 1.2, 3.3_


  - [x] 2.2 Implement ConfigStore class with encryption

    - Create `app/lib/config.server.ts` file
    - Implement AES-256-GCM encryption/decryption methods
    - Implement `load()` method to read configuration from disk
    - Implement `save()` method to write encrypted configuration
    - Implement `isSetupComplete()` method
    - Implement `reset()` method for admin use
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3_

  - [ ]* 2.3 Write unit tests for ConfigStore
    - Test encryption and decryption
    - Test save and load operations
    - Test setup completion checks
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Implement database connection management






  - [x] 3.1 Create DatabaseConnectionManager class

    - Create `app/lib/db-connection.server.ts` file
    - Implement `testConnection()` method with error handling
    - Implement `createAdapter()` method for dynamic adapter creation
    - Define `ConnectionTestResult` interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.2, 7.3, 7.4, 7.5_


  - [x] 3.2 Implement SQLite connection testing













    - Create `testSQLiteConnection()` private method
    - Test file path accessibility and write permissions
    - Return detailed error messages for SQLite issues
    - _Requirements: 1.5, 2.1, 2.2, 8.1, 8.2_


  - [x] 3.3 Implement PostgreSQL connection testing




    - Create `testPostgreSQLConnection()` private method
    - Use `pg.Pool` to test connection with provided credentials
    - Handle network, authentication, and permission errors
    - Test schema accessibility if schema is specified
    - Return detailed error messages with troubleshooting suggestions

    - _Requirements: 1.3, 2.1, 2.2, 2.3, 8.1, 8.2, 8.4_

  - [x] 3.4 Implement error suggestion system





    - Create `getErrorSuggestions()` method
    - Map error types to actionable suggestions
    - Provide database-specific troubleshooting guidance
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]* 3.5 Write unit tests for DatabaseConnectionManager
    - Mock database connections for each type
    - Test error handling scenarios
    - Test connection string generation
    - _Requirements: 2.1, 2.2, 7.2_

- [x] 4. Implement database migration system





  - [x] 4.1 Create MigrationManager class


    - Create `app/lib/migration.server.ts` file
    - Implement `runMigrations()` method
    - Define `MigrationResult` interface
    - Implement progress tracking mechanism
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


  - [x] 4.2 Implement schema generation using Better Auth CLI


    - Create `generateSchema()` private method
    - Programmatically invoke `@better-auth/cli generate`
    - Handle CLI output and errors
    - _Requirements: 4.1, 4.2, 4.4_


  - [x] 4.3 Implement migration application


    - Create `applyMigrations()` private method
    - Execute migrations for users, sessions, accounts, verifications tables
    - Add activity tracking table migration
    - Handle migration failures with detailed error messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.3_

  - [x] 4.4 Implement schema verification

    - Create `verifySchema()` method
    - Check that all required tables exist
    - Verify table structure matches expected schema
    - _Requirements: 4.2, 4.5_

  - [ ]* 4.5 Write unit tests for MigrationManager
    - Test schema generation
    - Test migration application
    - Test rollback on failure
    - _Requirements: 4.1, 4.2, 4.3_



- [x] 5. Refactor Auth Instance for dynamic initialization




  - [x] 5.1 Refactor auth.server.ts for lazy loading

    - Modify `app/lib/auth.server.ts` to support dynamic initialization
    - Implement `initializeAuth()` function that loads configuration
    - Create Proxy-based auth export for lazy loading
    - Handle setup incomplete errors gracefully
    - _Requirements: 7.1, 7.2, 7.3, 7.4_


  - [x] 5.2 Implement adapter factory based on configuration

    - Create adapter initialization logic for SQLite
    - Create adapter initialization logic for PostgreSQL with Pool
    - Handle adapter creation errors
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 5.3 Write integration tests for dynamic auth initialization
    - Test auth instance initialization with different database types
    - Test error handling when setup is incomplete
    - Test configuration reload
    - _Requirements: 7.1, 7.2_

- [x] 6. Create setup wizard API routes





  - [x] 6.1 Create main setup route


    - Create `app/routes/setup.tsx` file
    - Implement loader to check setup completion status
    - Redirect to login if setup is already complete
    - Implement action handler for multi-step form submission
    - _Requirements: 1.1, 6.1, 6.2_


  - [x] 6.2 Create connection test API endpoint

    - Create `app/routes/api.setup.test-connection.ts` file
    - Parse and validate incoming database configuration
    - Use DatabaseConnectionManager to test connection
    - Return detailed test results with error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.3 Create configuration save API endpoint


    - Create `app/routes/api.setup.save-config.ts` file
    - Validate database configuration
    - Use ConfigStore to save encrypted configuration
    - Return success or error response
    - _Requirements: 3.1, 3.2, 3.3, 3.4_


  - [x] 6.4 Create migration API endpoint with progress streaming

    - Create `app/routes/api.setup.migrate.ts` file
    - Implement Server-Sent Events for real-time progress
    - Use MigrationManager to run migrations
    - Stream progress updates to client
    - Handle migration errors and provide detailed feedback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3_


  - [x] 6.5 Create admin user creation API endpoint

    - Create `app/routes/api.setup.create-admin.ts` file
    - Validate admin user input (email, password, name)
    - Enforce password requirements
    - Create user with admin role using auth instance
    - Return success confirmation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.6 Create setup lock API endpoint


    - Create `app/routes/api.setup.complete.ts` file
    - Set setup completion flag in ConfigStore
    - Return confirmation
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Build setup wizard UI components


  - [x] 7.1 Create SetupWizard main component


    - Create `app/components/setup/SetupWizard.tsx` file
    - Implement multi-step state management
    - Create step navigation logic
    - Implement data flow between steps
    - _Requirements: 1.1, 1.2_

  - [x] 7.2 Create StepIndicator component


    - Create `app/components/setup/StepIndicator.tsx` file
    - Display current step and total steps
    - Show visual progress indicator
    - _Requirements: 1.1_

  - [x] 7.3 Create DatabaseTypeSelector component


    - Create `app/components/setup/DatabaseTypeSelector.tsx` file
    - Display options for SQLite and PostgreSQL
    - Show brief description of each database type
    - Handle selection and proceed to next step
    - _Requirements: 1.2_


  - [x] 7.4 Create DatabaseConfigForm component

    - Create `app/components/setup/DatabaseConfigForm.tsx` file
    - Implement dynamic form fields based on database type
    - Add form validation using Zod
    - Implement connection test button with loading state
    - Display connection test results
    - Show error messages and suggestions
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.5_



  - [x] 7.5 Create PostgreSQLFields component
    - Create `app/components/setup/PostgreSQLFields.tsx` file
    - Add fields for host, port, database, username, password
    - Add optional schema field
    - Add SSL toggle
    - Implement field validation
    - _Requirements: 1.3_

  - [x] 7.6 Create SQLiteFields component
    - Create `app/components/setup/SQLiteFields.tsx` file
    - Add file path field with default value
    - Add file path validation
    - Show directory creation option
    - _Requirements: 1.4_

  - [x] 7.7 Create ConnectionTestResult component
    - Create `app/components/setup/ConnectionTestResult.tsx` file
    - Display success or error status
    - Show error messages clearly
    - Display troubleshooting suggestions
    - _Requirements: 2.2, 8.1, 8.2, 8.5_

  - [x] 7.8 Create MigrationProgress component


    - Create `app/components/setup/MigrationProgress.tsx` file
    - Connect to Server-Sent Events endpoint
    - Display real-time migration progress
    - Show list of tables being created
    - Handle migration errors with retry option
    - _Requirements: 4.1, 4.2, 4.5, 8.3_

  - [x] 7.9 Create AdminUserForm component


    - Create `app/components/setup/AdminUserForm.tsx` file
    - Add fields for email, password, confirm password, name
    - Implement password strength indicator
    - Validate password requirements (min 8 chars)
    - Show password requirements clearly
    - Handle form submission
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.10 Create SetupComplete component



    - Create `app/components/setup/SetupComplete.tsx` file
    - Display success message
    - Show admin credentials (email only)
    - Provide login button
    - _Requirements: 5.5, 6.1_

- [-] 8. Implement setup lock and security features





  - [x] 8.1 Add setup completion middleware


    - Create `app/middleware/setup-check.server.ts` file
    - Check if setup is complete on protected routes
    - Redirect to setup wizard if incomplete
    - Redirect to login if setup is complete and accessing setup wizard
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 8.2 Implement setup reset functionality for admins




    - Create `app/routes/api.setup.reset.ts` file
    - Require admin authentication
    - Log reset attempts for security audit
    - Reset configuration and setup lock
    - _Requirements: 6.5_

  - [x] 8.3 Add rate limiting to setup endpoints





    - Implement rate limiting for connection test endpoint
    - Implement rate limiting for configuration save endpoint
    - Prevent brute force attacks
    - _Requirements: 3.5_

  - [x] 8.4 Set secure file permissions for config file





    - Implement file permission setting in ConfigStore
    - Set 600 permissions on config file (owner read/write only)
    - Verify .data directory is not web-accessible
    - _Requirements: 3.5_

- [x] 9. Update application routing and navigation





  - [x] 9.1 Update routes.ts to include setup routes


    - Add setup wizard route
    - Add setup API routes
    - Ensure setup route is accessible without authentication
    - _Requirements: 1.1, 6.4_

  - [x] 9.2 Update home route to check setup status


    - Modify `app/routes/home.tsx` loader
    - Redirect to setup wizard if setup is incomplete
    - Redirect to dashboard if authenticated and setup complete
    - _Requirements: 6.1, 6.2_

  - [x] 9.3 Update login route to check setup status


    - Modify `app/routes/login.tsx` loader
    - Redirect to setup wizard if setup is incomplete
    - _Requirements: 6.1, 6.2_

- [x] 10. Add environment variable validation and documentation






  - [x] 10.1 Create environment variable validation

    - Create `app/lib/env.server.ts` file
    - Validate required environment variables on startup
    - Provide clear error messages for missing variables
    - _Requirements: 3.2_


  - [x] 10.2 Update .env.example file

    - Add BETTER_AUTH_SECRET with description
    - Add BETTER_AUTH_URL with description
    - Add optional SKIP_SETUP flag for development
    - Document all environment variables
    - _Requirements: 3.2_


  - [x] 10.3 Create setup documentation

    - Create `SETUP_GUIDE.md` file
    - Document installation process
    - Document database setup for each type
    - Add troubleshooting section
    - Include screenshots or examples
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2_

- [ ] 11. Integration and end-to-end testing
  - [ ]* 11.1 Write integration tests for setup flow
    - Test complete setup flow with SQLite
    - Test complete setup flow with PostgreSQL (mock)
    - Test validation and error handling
    - _Requirements: 1.1, 2.1, 4.1, 5.1_

  - [ ]* 11.2 Write end-to-end tests
    - Test fresh installation to login flow
    - Test setup lock functionality
    - Test configuration persistence across restarts
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 11.3 Manual testing checklist
    - Test with actual PostgreSQL database
    - Test error scenarios (wrong credentials, network issues)
    - Test setup reset functionality
    - Verify encrypted credentials work correctly
    - _Requirements: 1.3, 2.1, 2.2, 3.1, 3.2_

- [ ] 12. Update existing documentation and migration guide
  - [ ] 12.1 Update README.md
    - Add setup wizard section
    - Update installation instructions
    - Add database configuration section
    - Link to SETUP_GUIDE.md
    - _Requirements: 1.1_

  - [ ] 12.2 Create migration guide for existing users
    - Create `MIGRATION_TO_SETUP_WIZARD.md` file
    - Document how to migrate from hardcoded SQLite
    - Provide step-by-step migration instructions
    - Include backup recommendations
    - _Requirements: 3.4, 7.1_

  - [ ] 12.3 Update SECURITY.md
    - Document credential encryption approach
    - Document setup lock security
    - Add recommendations for production deployment
    - _Requirements: 3.2, 3.5, 6.5_
