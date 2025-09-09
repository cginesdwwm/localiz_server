// Middleware to normalize errors into a consistent API shape:
// { success: boolean, message: string, errors?: [{ param, msg }] }
export default function errorFormat(err, req, res, next) {
  // If the response is already sent, delegate
  if (res.headersSent) return next(err);

  // If this is an express-validator style error payload (attached by controllers)
  if (err && err.errors && Array.isArray(err.errors)) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Validation failed",
      errors: err.errors.map((e) => ({
        param: e.param || e.path || null,
        msg: e.msg || e.message || String(e),
      })),
    });
  }

  // Mongoose validation error
  if (err && err.name === "ValidationError") {
    const errors = Object.keys(err.errors).map((key) => ({
      param: key,
      msg: err.errors[key].message,
    }));
    return res
      .status(400)
      .json({ success: false, message: "Validation error", errors });
  }

  // Generic error
  const status = err && err.status ? err.status : 500;
  return res
    .status(status)
    .json({ success: false, message: err.message || "Internal server error" });
}
