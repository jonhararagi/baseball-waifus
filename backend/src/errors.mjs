export class AuthorityError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = "AuthorityError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAuthorityError(error) {
  return error instanceof AuthorityError;
}
