import { Box, Tabs, Typography, Grid, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import React, { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/admin/strapi-admin'; // Import useFetchClient hook
import { PLUGIN_ID } from '../../../../pluginId'; // Ensure PLUGIN_ID is correctly imported

import { useForm } from '../../../../hooks/useForm';
import { useI18n } from '../../../../hooks/useI18n';
import { Editor } from '../../../Editor/Editor';

export const ImportEditor = ({ file, data, dataFormat, slug, onDataChanged, onOptionsChanged }) => {
  const { i18n } = useI18n();
  const [attributeNames, setAttributeNames] = useState([]);
  const fetchClient = useFetchClient(); // Use the hook here within the component

  const { options, getOption, setOption } = useForm({ idField: 'id' });

  useEffect(() => {
    const fetchAttributeNames = async () => {
      const { get } = fetchClient;
      console.log('slug', slug);
      try {
        const resData = await get(`/${PLUGIN_ID}/import/model-attributes/${slug}`);
        console.log('resData', resData);
        setAttributeNames(resData?.data?.data?.attribute_names);
      } catch (error) {
        console.error('Error fetching attribute names:', error);
      }
    };
    fetchAttributeNames();
  }, [fetchClient, slug]); // Include dependencies

  useEffect(() => {
    onOptionsChanged(options);
  }, [options]);

  console.log('attributeNames', attributeNames);

  return (
    <Tabs.Root defaultValue="file">
      
      <Tabs.List aria-label="Import editor">
        <Tabs.Trigger value="file">{i18n('plugin.import.tab.file')}</Tabs.Trigger>
        <Tabs.Trigger value="options">{i18n('plugin.import.tab.options')}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="file">
        <Box padding={4}>
          {file?.name && (
            <Box paddingTop={2} paddingBottom={2}>
              <Typography fontWeight="bold" as="span">
                {i18n('plugin.import.file-name')}:
              </Typography>
              <Typography as="span"> {file.name}</Typography>
            </Box>
          )}
          <Box marginTop={2}>
            <Editor content={data} language={dataFormat} onChange={onDataChanged} />
          </Box>
        </Box>
      </Tabs.Content>
      <Tabs.Content value="options">
        <Box padding={4}>
          <Grid.Root gap={4} marginTop={2}>
            <Grid.Item>
              <Field.Root>
                <Field.Label>{i18n('plugin.form.field.id-field.label')}</Field.Label>
                <Field.Hint>{i18n('plugin.form.field.id-field.hint')}</Field.Hint>
                <SingleSelect
                  onChange={(value) => setOption('idField', value)}
                  value={getOption('idField')}
                  placeholder={i18n('plugin.form.field.id-field.placeholder')}
                >
                  {attributeNames?.length > 0 ? (
                    attributeNames.map((name) => (
                      <SingleSelectOption key={name} value={name}>
                        {name}
                      </SingleSelectOption>
                    ))
                  ) : (
                    <SingleSelectOption value="">No attribute found</SingleSelectOption>
                  )}
                </SingleSelect>
              </Field.Root>
            </Grid.Item>
          </Grid.Root>
        </Box>
      </Tabs.Content>
    </Tabs.Root>
  );
};
