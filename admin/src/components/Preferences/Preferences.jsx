import React, { useState, useCallback } from 'react';
import { Box, Flex, Typography, Checkbox, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { range } from 'lodash';
import { useIntl } from 'react-intl';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const Preferences = () => {
  const { formatMessage: i18n } = useIntl();

  const { getPreferences, updatePreferences } = useLocalStorage();

  const [preferences, setPreferences] = useState(() => getPreferences());

  const handleUpdatePreferences = useCallback((key, value) => {
    updatePreferences({ [key]: value });
    setPreferences(getPreferences());
  }, [updatePreferences, getPreferences]);

  return (
    <Box style={{ alignSelf: 'stretch' }} background="neutral0" padding={8} hasRadius={true}>
      <Flex direction="column" alignItems="start" gap={6}>
        <Flex direction="column" alignItems="start" gap={0}>
            <Typography variant="alpha">{i18n({ id: 'plugin.page.homepage.section.preferences.title', defaultMessage: 'Default Preferences' })}</Typography>
            <Typography variant="epsilon">{i18n({ id: 'plugin.page.homepage.section.preferences.description', defaultMessage: 'Configure the default export behavior, so you don\'t have to set it every time you export.' })}</Typography>
        </Flex>

        <Box>
          <Flex direction="column" alignItems="start" gap={4}>
            <Flex justifyContent="space-between">
              <Checkbox 
                checked={preferences.applyFilters} 
                onCheckedChange={(value) => handleUpdatePreferences('applyFilters', value)}
              >
                <Typography>{i18n({ id: 'plugin.export.apply-filters-and-sort', defaultMessage: 'Apply filters and sort to exported data' })}</Typography>
              </Checkbox>
            </Flex>
            <Flex direction="column" gap={2}>
              <Typography fontWeight="bold" textColor="neutral800" as="h2">{i18n({ id: 'plugin.export.deepness', defaultMessage: 'Deepness' })}</Typography>
              <SingleSelect
                label={i18n({ id: 'plugin.export.deepness', defaultMessage: 'Deepness' })}
                placeholder={i18n({ id: 'plugin.export.deepness', defaultMessage: 'Deepness' })}
                value={preferences.deepness}
                onChange={(value) => handleUpdatePreferences('deepness', value)}
              >
                {range(1, 21).map((deepness) => (
                  <SingleSelectOption key={deepness} value={deepness.toString()}>
                    {deepness}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default React.memo(Preferences);