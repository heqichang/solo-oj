const success = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

const error = (res, message, status = 500) => {
  return res.status(status).json({
    success: false,
    error: message,
  });
};

const paginate = (res, items, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { success, error, paginate };
