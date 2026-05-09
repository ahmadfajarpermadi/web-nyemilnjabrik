export function notFound(req, res) {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
}

export function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Terjadi kesalahan server.',
    details: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}
