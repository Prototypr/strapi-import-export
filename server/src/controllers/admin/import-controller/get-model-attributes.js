import { getModelAttributes } from '../../../utils/models.js';

const getModelAttributesEndpoint = async (ctx) => {
  const { slug } = ctx.params;

  const attributeNames = getModelAttributes(slug)
    .filter(filterAttribute)
    .map((attr) => attr.name);

  attributeNames.unshift('id');

  ctx.body = {
    data: {
      attribute_names: attributeNames,
    },
  };
};

const filterAttribute = (attr) => {
  const filters = [filterType, filterName];
  return filters.every((filter) => filter(attr));
};

const filterType = (attr) => !['relation', 'component', 'dynamiczone'].includes(attr.type);

const filterName = (attr) => !['createdAt', 'updatedAt', 'publishedAt', 'locale'].includes(attr.name);

export default ({ strapi }) => getModelAttributesEndpoint;
