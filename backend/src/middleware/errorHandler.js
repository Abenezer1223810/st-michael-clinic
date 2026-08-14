export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  console.error('[API ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong on the server.',
  });
}
