type PostgrestErrorLike = {
  code?: string | null;
  message?: string | null;
};

type SupabaseResult<T> = {
  data: T | null;
  error: PostgrestErrorLike | null;
};

const MISSING_TABLE_CODE = "PGRST205";

export function isMissingTableError(
  error: PostgrestErrorLike | null | undefined,
  table?: string
) {
  if (!error || error.code !== MISSING_TABLE_CODE) {
    return false;
  }

  if (!table) {
    return true;
  }

  return error.message?.includes(`public.${table}`) ?? false;
}

export function logSuppressedSupabaseError(
  context: string,
  error: PostgrestErrorLike | null | undefined
) {
  if (!error) {
    return;
  }

  console.warn(
    `[Supabase] ${context}: ${error.code ?? "unknown"} ${error.message ?? "Unknown error"}`
  );
}

export function resolveOptionalTableResult<T>(
  result: SupabaseResult<T>,
  options: {
    table: string;
    context: string;
    fallback: T;
  }
) {
  if (!result.error) {
    return result.data ?? options.fallback;
  }

  if (isMissingTableError(result.error, options.table)) {
    logSuppressedSupabaseError(options.context, result.error);
    return options.fallback;
  }

  throw result.error;
}
