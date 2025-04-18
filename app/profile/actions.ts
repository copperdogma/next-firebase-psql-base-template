// =============================================================================
// Unit Testing Note:
// Unit testing Next.js Server Actions, especially those involving database
// interactions and authentication checks, presents significant challenges with
// mocking dependencies (like Prisma, NextAuth sessions) and handling module
// resolution for imports using path aliases (e.g., '@/') within the Jest
// environment. Direct unit tests for 'updateUserName' were skipped due to these
// persistent issues.
//
// Validation Strategy:
// The functionality of this server action is primarily validated through
// End-to-End (E2E) tests (see tests/e2e/profile/edit-profile.spec.ts) which
// simulate user interaction in a browser and verify the profile update flow.
// =============================================================================
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as pino from 'pino';
import { logger as rootLogger } from '@/lib/logger';
import { ProfileService } from '@/lib/services/profile-service';
import { profileService as singletonProfileService } from '@/lib/server/services';
import { auth } from '@/lib/auth';

const actionsLogger = rootLogger.child({ service: 'profile-actions' });

// Define the form state type for the profile form
export type FormState = {
  message: string;
  success: boolean;
};

/**
 * ProfileActions class with dependency injection
 * Note: This class is not exported because "use server" files can only export async functions
 */
class ProfileActionsImpl {
  constructor(
    private readonly profileService: ProfileService = singletonProfileService,
    private readonly logger: pino.Logger = actionsLogger
  ) {}

  // Define validation schema for user name
  private userNameSchema = z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .trim(),
  });

  /**
   * Validates the user name using Zod schema
   */
  private validateUserName(name: string): { isValid: boolean; error?: string } {
    try {
      this.userNameSchema.parse({ name });
      return { isValid: true };
    } catch (error) {
      return this.handleValidationError(error);
    }
  }

  /**
   * Handles Zod validation errors
   */
  private handleValidationError(error: unknown): { isValid: boolean; error: string } {
    // Handle Zod errors
    if (error instanceof z.ZodError) {
      return this.extractZodErrorMessage(error);
    }

    // Handle other errors
    return { isValid: false, error: 'Invalid name format' };
  }

  /**
   * Extracts specific error messages from Zod errors
   */
  private extractZodErrorMessage(error: z.ZodError): { isValid: boolean; error: string } {
    const issues = error.errors;

    // Check for empty name (too_small) error
    const tooSmallError = issues.find(issue => issue.code === 'too_small' && issue.minimum === 2);
    if (tooSmallError) {
      return { isValid: false, error: 'Name is required' };
    }

    // Check for too long name error
    const tooBigError = issues.find(issue => issue.code === 'too_big' && issue.maximum === 50);
    if (tooBigError) {
      return { isValid: false, error: 'Name is too long (maximum 50 characters)' };
    }

    // Default error message
    const errorMessage = error.errors[0]?.message || 'Invalid name format';
    return { isValid: false, error: errorMessage };
  }

  /**
   * Verifies the user is authenticated
   */
  private async verifyAuthentication(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const session = await auth();

      if (!session?.user?.id) {
        this.logger.warn({ msg: 'User not authenticated in verifyAuthentication' });
        return { isAuthenticated: false, error: 'You must be logged in to update your profile' };
      }

      return { isAuthenticated: true, userId: session.user.id };
    } catch (error) {
      this.logger.error({
        msg: 'Error verifying authentication',
        error: error instanceof Error ? error.message : String(error),
      });
      return { isAuthenticated: false, error: 'Authentication error' };
    }
  }

  /**
   * Server action to update the user's display name
   */
  async updateUserName(_prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('name') as string;
    this.logger.info({ msg: 'updateUserName called', name });

    // 1. Verify user authentication
    const auth = await this.verifyAuthentication();
    if (!auth.isAuthenticated || !auth.userId) {
      return {
        message: auth.error || 'You must be logged in to update your profile',
        success: false,
      };
    }

    // 2. Validate the user name
    const validation = this.validateUserName(name);
    if (!validation.isValid) {
      this.logger.warn({ msg: 'Invalid user name', name });
      return {
        message: validation.error || 'Invalid name format',
        success: false,
      };
    }

    // 3. Update the user name using the ProfileService
    const updateResult = await this.profileService.updateUserName(auth.userId, name);
    if (!updateResult.success) {
      return {
        message: updateResult.error || 'An error occurred while updating your name',
        success: false,
      };
    }

    // 4. Revalidate the profile page to show the updated name
    revalidatePath('/profile');

    this.logger.info({ msg: 'User name updated successfully', userId: auth.userId });
    return {
      message: 'Name updated successfully',
      success: true,
    };
  }
}

// Create instance of the implementation class
const profileActions = new ProfileActionsImpl();

/**
 * Server action to update a user's display name
 */
export async function updateUserName(prevState: FormState, formData: FormData): Promise<FormState> {
  return profileActions.updateUserName(prevState, formData);
}
