/**
 * Error Classes
 *
 * Custom error classes for better error handling throughout the application.
 * Provides structured error information for different failure scenarios.
 */

/**
 * Base application error class
 */
export class PenflowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = "PenflowError";
    Object.setPrototypeOf(this, PenflowError.prototype);
  }
}

/**
 * Error thrown when a service is not initialized
 */
export class NotInitializedError extends PenflowError {
  constructor(serviceName: string) {
    super(
      `${serviceName} is not initialized. Call initialize() first.`,
      "NOT_INITIALIZED",
      { serviceName }
    );
    this.name = "NotInitializedError";
    Object.setPrototypeOf(this, NotInitializedError.prototype);
  }
}

/**
 * Error thrown when a required context is missing
 */
export class ContextNotFoundError extends PenflowError {
  constructor(contextName: string) {
    super(
      `${contextName} not found. Make sure to call set${contextName}() in a parent component.`,
      "CONTEXT_NOT_FOUND",
      { contextName }
    );
    this.name = "ContextNotFoundError";
    Object.setPrototypeOf(this, ContextNotFoundError.prototype);
  }
}

/**
 * Error thrown when a file operation fails
 */
export class FileOperationError extends PenflowError {
  constructor(
    operation: string,
    fileId: string | null,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} file${fileId ? ` (ID: ${fileId})` : ""}: ${cause?.message || "Unknown error"}`,
      "FILE_OPERATION_ERROR",
      { operation, fileId, cause }
    );
    this.name = "FileOperationError";
    Object.setPrototypeOf(this, FileOperationError.prototype);
  }
}

/**
 * Error thrown when file validation fails
 */
export class ValidationError extends PenflowError {
  constructor(field: string, reason: string) {
    super(
      `Validation failed for ${field}: ${reason}`,
      "VALIDATION_ERROR",
      { field, reason }
    );
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when database operations fail
 */
export class DatabaseError extends PenflowError {
  constructor(operation: string, cause?: Error) {
    super(
      `Database ${operation} failed: ${cause?.message || "Unknown error"}`,
      "DATABASE_ERROR",
      { operation, cause }
    );
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error thrown when import/export operations fail
 */
export class ImportExportError extends PenflowError {
  constructor(operation: "import" | "export", reason: string, cause?: Error) {
    super(
      `Failed to ${operation}: ${reason}`,
      "IMPORT_EXPORT_ERROR",
      { operation, reason, cause }
    );
    this.name = "ImportExportError";
    Object.setPrototypeOf(this, ImportExportError.prototype);
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle an error with logging and optional user notification
   */
  static handle(error: unknown, userMessage?: string): void {
    if (error instanceof PenflowError) {
      console.error(`[${error.code}] ${error.message}`, error.context);

      if (userMessage) {
        // In a real app, this would show a toast/notification
        // For now, we'll use console.error
        console.error("User notification:", userMessage);
      }
    } else if (error instanceof Error) {
      console.error("Unexpected error:", error.message, error.stack);

      if (userMessage) {
        console.error("User notification:", userMessage);
      }
    } else {
      console.error("Unknown error:", error);
    }
  }

  /**
   * Wrap a function with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      ErrorHandler.handle(error, errorMessage);
      return null;
    }
  }

  /**
   * Check if an error is recoverable
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof ValidationError) {
      return true; // User can fix validation errors
    }

    if (error instanceof NotInitializedError) {
      return true; // Can initialize and retry
    }

    return false;
  }
}
