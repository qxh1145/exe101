export const sendSuccess = (res, data = null, meta = null, statusCode = 200) => {
  const response = { success: true };
  if (data) response.data = data;
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};
