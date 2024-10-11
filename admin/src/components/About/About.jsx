import React from 'react';
import { Box, Flex, Typography, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const About = () => {
  const { formatMessage: i18n } = useIntl();

  return (
    <Box style={{ alignSelf: 'stretch' }} background="neutral0" padding={8} marginTop={6} hasRadius={true}>
      <Flex direction="column" alignItems="start" gap={6}>
        <Flex direction="column" alignItems="start" gap={0}>
          <Typography variant="beta">{i18n({ id: 'plugin.page.about.title', defaultMessage: 'About' })}</Typography>
        </Flex>

        <Box>
          <Flex direction="column" alignItems="start" gap={4}>
          <Flex direction="column" alignItems="start" gap={2}>
                <Typography variant="delta">Strapi 5 Version</Typography>
                <Typography>
                    {i18n({
                        id: 'plugin.page.about.strapi5.description',
                        defaultMessage: 'This is a fork of the original Strapi 4 plugin, converted to Strapi 5.'
                    })}
                </Typography>
                <Flex direction="row" gap={4}>
                    <Link href="https://github.com/Prototypr/strapi-import-export" isExternal>
                        GitHub (Strapi 5)
                    </Link>
                    <Link href="https://x.com/graeme_fulton" isExternal>Converted by Graeme</Link>
                </Flex>
            </Flex>
            <Flex direction="column" alignItems="start" gap={2} marginTop={4}>
                <Typography variant="delta">Original Work</Typography>

                <Typography>
                {i18n({
                    id: 'plugin.page.about.original-work.description',
                    defaultMessage: 'Originally created by Baptiste Studer, most of his work makes up this Strapi 5 version.'
                })}
                </Typography>
                <Flex gap={4}>
                <Link href="https://strapi-import-export-entries.canny.io" isExternal>
                    {i18n({
                    id: 'plugin.page.about.need-help.product-roadmap',
                    defaultMessage: 'Product Roadmap'
                    })}
                </Link>
                <Link href="https://discord.gg/dcqCAFFdP8" isExternal>
                    {i18n({
                    id: 'plugin.page.about.need-help.discord',
                    defaultMessage: 'Discord'
                    })}
                </Link>
                <Link href="https://github.com/Baboo7/strapi-plugin-import-export-entries/issues" isExternal>
                    {i18n({
                    id: 'plugin.page.about.need-help.github',
                    defaultMessage: 'GitHub (Strapi 4)'
                    })}
                </Link>
                </Flex>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default React.memo(About);
