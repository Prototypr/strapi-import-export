import { Box, Typography, Flex } from '@strapi/design-system';
import React from 'react';
import { useI18n } from '../hooks/useI18n';

export const Header = () => {
  const { i18n } = useI18n();

  return (
    <Box padding={4} margin={2}  background="neutral100">
      <Flex 
      direction="column"
      gap="medium"
      alignItems="left"
      >
      <Typography variant="alpha" as="h1">
        {i18n('plugin.name', 'Import Export')}
      </Typography>
      <Typography variant="epsilon" as="h3">
          {i18n(
            'plugin.description',
            'Import/Export data from and to your database in just few clicks'
          )}
        </Typography>
      </Flex>
    </Box>
  );
};
