import { fromPairs, pick, toPairs } from 'lodash';
import { CustomSlugToSlug, CustomSlugs } from '../../config/constants.js';
import { getConfig } from '../../utils/getConfig.js';

export const convertToJson = withBeforeConvert(convertToJsonImpl);

function convertToJsonImpl(jsoContent) {
  return JSON.stringify(jsoContent, null, '\t');
}

function withBeforeConvert(convertFn) {
  return (jsoContent, options) => {
    return convertFn(beforeConvert(jsoContent, options), options);
  };
}

function beforeConvert(jsoContent, options) {
  jsoContent = buildMediaUrl(jsoContent, options);
  jsoContent = pickMediaAttributes(jsoContent, options);

  return jsoContent;
}

function buildMediaUrl(jsoContent, options) {
  let mediaSlug = CustomSlugToSlug[CustomSlugs.MEDIA];
  let media = jsoContent.data[mediaSlug];

  if (!media) {
    return jsoContent;
  }

  media = fromPairs(
    toPairs(media).map(([id, medium]) => {
      if (isRelativeUrl(medium.url)) {
        medium.url = buildAbsoluteUrl(medium.url);
      }
      return [id, medium];
    }),
  );

  jsoContent.data[mediaSlug] = media;

  return jsoContent;
}

function isRelativeUrl(url) {
  return url.startsWith('/');
}

function buildAbsoluteUrl(relativeUrl) {
  return getConfig('serverPublicHostname') + relativeUrl;
}

function pickMediaAttributes(jsoContent, options) {
  let mediaSlug = CustomSlugToSlug[CustomSlugs.MEDIA];
  let media = jsoContent.data[mediaSlug];

  if (!media) {
    return jsoContent;
  }

  media = fromPairs(
    toPairs(media).map(([id, medium]) => {
      medium = pick(medium, ['id', 'name', 'alternativeText', 'caption', 'hash', 'ext', 'mime', 'url', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']);
      return [id, medium];
    }),
  );

  jsoContent.data[mediaSlug] = media;

  return jsoContent;
}
