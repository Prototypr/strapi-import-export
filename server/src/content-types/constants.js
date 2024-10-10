export const CustomSlugs = {
  MEDIA: 'media',
  WHOLE_DB: 'custom:db',
};

export const CustomSlugToSlug = {
  [CustomSlugs.MEDIA]: 'plugin::upload.file',
};

export const isCustomSlug = (slug) => {
  return !!CustomSlugToSlug[slug];
};

export {
  CustomSlugs,
  CustomSlugToSlug,
  isCustomSlug,
};
