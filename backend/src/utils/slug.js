const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const generateUniqueSlug = async (Model, title, suffix = '') => {
  const slug = slugify(title) + (suffix ? `-${suffix}` : '');
  
  const existing = await Model.findOne({ where: { slug } });
  
  if (existing) {
    const nextSuffix = suffix ? parseInt(suffix) + 1 : 1;
    return generateUniqueSlug(Model, title, nextSuffix);
  }
  
  return slug;
};

module.exports = { slugify, generateUniqueSlug };
