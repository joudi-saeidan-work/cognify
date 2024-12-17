import { z } from "zod"; // Importing zod, a library used for schema definition and validation.

// FieldErrors is a generic type that defines errors for specific fields in an input.
// - T represents the type of the input object (e.g., a form with fields like "username" and "password").
// - For each field (key) in T, FieldErrors maps it to an optional array of error messages (strings).
export type FieldErrors<T> = {
  [K in keyof T]?: string[];
  // Example: If T is { username: string; password: string; },
  // Then FieldErrors<T> could be { username?: string[]; password?: string[]; }
  // This means:
  // - Each field (username, password) can optionally have a list of error messages.
};

// ActionState is a generic type that represents the result of an action, such as submitting a form.
// - TInput: The type of the input data (e.g., the fields provided by the user).
// - TOutput: The type of the output data (e.g., the result returned if the action succeeds).
export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>; // Errors tied to specific fields in the input (e.g., username or password).
  error?: string; // A general error message (not tied to specific fields).
  data?: TOutput; // The successful output of the action, if applicable.
};

// createSafeAction is a function that:
// 1. Validates input data against a schema using zod.
// 2. Calls a handler function with validated data if validation succeeds.
// 3. Returns field-specific errors if validation fails, or the result of the handler if it succeeds.
// - TInput: The type of the input data (validated against the schema).
// - TOutput: The type of the output data (returned by the handler).
export const createSafeAction = <TInput, TOutput>(
  schema: z.Schema<TInput>, // A zod schema used to validate the input data.
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>
  // handler is a callback function that processes validated data.
  // It takes validatedData (of type TInput) as input and returns a Promise of type ActionState<TInput, TOutput>.
  // Example: The handler could interact with a database and return a success result or an error.
) => {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    // Validate the input data using the provided zod schema.
    const validationResult = schema.safeParse(data);

    // If validation fails, return field-specific errors.
    if (!validationResult.success) {
      return {
        fieldErrors: validationResult.error.flatten()
          .fieldErrors as FieldErrors<TInput>, // Mapping field-specific errors to the FieldErrors<TInput> structure.
      };
    }

    // If validation succeeds, call the handler with the validated data.
    // Note: The handler is asynchronous, so it returns a Promise.
    return handler(validationResult.data);
  };
};

/**
 * Examples:
 *
 * 1. Input and Output Types:
 *    - TInput (input data): { username: string; password: string; }
 *    - TOutput (output data): { token: string; }
 *
 * 2. How createSafeAction Works:
 *    - Validates the input using a schema.
 *    - Calls a handler with the validated data if input is valid.
 *    - Returns errors if input is invalid.
 *
 * 3. Example Use Case: Login Form
 *
 *    // Step 1: Define the input and output types.
 *    type LoginInput = { username: string; password: string; };
 *    type LoginResult = { token: string; };
 *
 *    // Step 2: Define a schema for validating the input.
 *    const schema = z.object({
 *      username: z.string().min(1, "Username is required"), // Username must not be empty.
 *      password: z.string().min(8, "Password must be at least 8 characters"), // Password must be at least 8 characters long.
 *    });
 *
 *    // Step 3: Define the handler function.
 *    const handler = async (validatedData: LoginInput): Promise<ActionState<LoginInput, LoginResult>> => {
 *      // Simulate database fetching.
 *      if (validatedData.username === "admin" && validatedData.password === "password123") {
 *        return { data: { token: "abc123" } }; // Success case.
 *      }
 *      return { error: "Invalid credentials" }; // General error.
 *    };
 *
 *    // Step 4: Create the safe action.
 *    const safeLoginAction = createSafeAction(schema, handler);
 *
 *    // Step 5: Use the safeLoginAction.
 *    const result = await safeLoginAction({ username: "admin", password: "wrongpass" });
 *
 *    // Possible Outputs:
 *    // If validation fails:
 *    // {
 *    //   fieldErrors: {
 *    //     username: ["Username is required"],
 *    //     password: ["Password must be at least 8 characters"],
 *    //   },
 *    //   error: undefined,
 *    //   data: undefined,
 *    // }
 *    //
 *    // If credentials are invalid:
 *    // {
 *    //   fieldErrors: undefined,
 *    //   error: "Invalid credentials",
 *    //   data: undefined,
 *    // }
 *    //
 *    // If login is successful:
 *    // {
 *    //   fieldErrors: undefined,
 *    //   error: undefined,
 *    //   data: { token: "abc123" },
 *    // }
 */
