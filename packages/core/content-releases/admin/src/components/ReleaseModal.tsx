import * as React from 'react';

import {
  Button,
  ModalBody,
  ModalFooter,
  ModalLayout,
  ModalHeader,
  TextInput,
  Typography,
  Checkbox,
  Flex,
  Box,
  DatePicker,
  TimePicker,
  Combobox,
  ComboboxOption,
} from '@strapi/design-system';
import formatISO from 'date-fns/formatISO';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

import { RELEASE_SCHEMA } from '../../../shared/validation-schemas';
import { pluginId } from '../pluginId';

export interface FormValues {
  name: string;
  date: Date | null;
  time: string;
  timezone: string;
  isScheduled?: boolean;
  scheduledAt: Date | null;
}

interface ReleaseModalProps {
  handleClose: () => void;
  handleSubmit: (values: FormValues) => void;
  isLoading?: boolean;
  initialValues: FormValues;
}

export const ReleaseModal = ({
  handleClose,
  handleSubmit,
  initialValues,
  isLoading = false,
}: ReleaseModalProps) => {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();
  const isCreatingRelease = pathname === `/plugins/${pluginId}`;
  const { timezoneList, currentTimezone = { offset: 'GMT+00:00' } } = useTimezone();

  /**
   * Generate scheduled time using, selected date, time and timezone
   */
  const getScheduledTimestamp = (values: FormValues) => {
    const { date, time, timezone } = values;
    if (!date || !time || !timezone) return null;

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours);
    combinedDateTime.setMinutes(minutes);
    const selectedTimezone = timezoneList.find((zone) => zone.offset === timezone);
    const timezoneOffset = selectedTimezone!.offset.slice(3);
    const offset = timezoneOffset.length > 0 ? parseInt(timezoneOffset, 10) : 0;

    // Adjust the date based on the selected timezone offset
    const combinedTime = combinedDateTime.getTime();
    const combinedTimeWithOffset = combinedTime - offset * 60 * 60 * 1000; // Convert offset in hours to milliseconds

    // Because new Date always adds local timezone offset, remove it to set the correct UTC time
    const dateObject = new Date(combinedTimeWithOffset);
    const scheduledDate = new Date(
      dateObject.getTime() - dateObject.getTimezoneOffset() * 60 * 1000
    );
    return scheduledDate;
  };

  return (
    <ModalLayout onClose={handleClose} labelledBy="title">
      <ModalHeader>
        <Typography id="title" fontWeight="bold" textColor="neutral800">
          {formatMessage(
            {
              id: 'content-releases.modal.title',
              defaultMessage:
                '{isCreatingRelease, select, true {New release} other {Edit release}}',
            },
            { isCreatingRelease: isCreatingRelease }
          )}
        </Typography>
      </ModalHeader>
      <Formik
        validateOnChange={false}
        onSubmit={(values) => {
          handleSubmit({
            ...values,
            scheduledAt: values.isScheduled ? getScheduledTimestamp(values) : null,
          });
        }}
        initialValues={{
          ...initialValues,
          timezone: initialValues.timezone ? initialValues.timezone : currentTimezone.offset,
        }}
        validationSchema={RELEASE_SCHEMA}
      >
        {({ values, errors, dirty, handleChange, setFieldValue }) => (
          <Form>
            <ModalBody>
              <Flex direction="column" alignItems="stretch" gap={6}>
                <TextInput
                  label={formatMessage({
                    id: 'content-releases.modal.form.input.label.release-name',
                    defaultMessage: 'Name',
                  })}
                  name="name"
                  value={values.name}
                  error={errors.name}
                  onChange={handleChange}
                  required
                />
                <Checkbox
                  name="isScheduled"
                  value={values.isScheduled}
                  onChange={(event) => {
                    setFieldValue('isScheduled', event.target.checked);
                    if (!event.target.checked) {
                      setFieldValue('date', null);
                      setFieldValue('time', '');
                    } else {
                      setFieldValue('date', initialValues.date);
                      setFieldValue('time', initialValues.time);
                    }
                  }}
                >
                  <Typography
                    textColor={values.isScheduled ? 'primary600' : 'neutral800'}
                    fontWeight={values.isScheduled ? 'semiBold' : 'regular'}
                  >
                    {formatMessage({
                      id: 'modal.form.input.label.schedule-release',
                      defaultMessage: 'Schedule release',
                    })}
                  </Typography>
                </Checkbox>
                {values.isScheduled && (
                  <>
                    <Flex gap={4}>
                      <Box width="100%">
                        <DatePicker
                          label={formatMessage({
                            id: 'content-releases.modal.form.input.label.date',
                            defaultMessage: 'Date',
                          })}
                          name="date"
                          onChange={(date) => {
                            const isoFormatDate = date
                              ? formatISO(date, { representation: 'date' })
                              : null;
                            setFieldValue('date', isoFormatDate);
                          }}
                          clearLabel={formatMessage({
                            id: 'content-releases.modal.form.input.clearLabel',
                            defaultMessage: 'Clear',
                          })}
                          onClear={() => {
                            setFieldValue('date', null);
                          }}
                          selectedDate={values.date ? new Date(values.date) : undefined}
                          required
                        />
                      </Box>
                      <Box width="100%">
                        <TimePicker
                          label={formatMessage({
                            id: 'content-releases.modal.form.input.label.time',
                            defaultMessage: 'Time',
                          })}
                          name="time"
                          onChange={(time) => {
                            setFieldValue('time', time);
                          }}
                          clearLabel={formatMessage({
                            id: 'content-releases.modal.form.input.clearLabel',
                            defaultMessage: 'Clear',
                          })}
                          onClear={() => {
                            setFieldValue('time', '');
                          }}
                          value={values.time || undefined}
                          required
                        />
                      </Box>
                    </Flex>
                    <Combobox
                      label={formatMessage({
                        id: 'content-releases.modal.form.input.label.timezone',
                        defaultMessage: 'Timezone',
                      })}
                      value={values.timezone}
                      onChange={(timezone) => {
                        if (timezone) {
                          setFieldValue('timezone', timezone);
                        }
                      }}
                      onClear={() => {
                        setFieldValue('timezone', '');
                      }}
                      required
                    >
                      {timezoneList.map((timezone) => (
                        <ComboboxOption key={timezone.offset} value={timezone.offset}>
                          {timezone.label}
                        </ComboboxOption>
                      ))}
                    </Combobox>
                  </>
                )}
              </Flex>
            </ModalBody>
            <ModalFooter
              startActions={
                <Button onClick={handleClose} variant="tertiary" name="cancel">
                  {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
                </Button>
              }
              endActions={
                <Button
                  name="submit"
                  loading={isLoading}
                  disabled={
                    !dirty ||
                    !values.name ||
                    (values.isScheduled && (!values.time || !values.date || !values.timezone))
                  }
                  type="submit"
                >
                  {formatMessage(
                    {
                      id: 'content-releases.modal.form.button.submit',
                      defaultMessage: '{isCreatingRelease, select, true {Continue} other {Save}}',
                    },
                    { isCreatingRelease: isCreatingRelease }
                  )}
                </Button>
              }
            />
          </Form>
        )}
      </Formik>
    </ModalLayout>
  );
};

/**
 * Timezone hook - Generates list of timezones and user's current timezone
 */

interface ITimezoneOption {
  city?: string;
  offset: string;
  value: string;
}

const useTimezone = () => {
  const timezoneList: ITimezoneOption[] = Intl.supportedValuesOf('timeZone').map((timezone) => {
    /**
     * This will be in the format GMT${OFFSET} where offset could be
     * nothing, a positive four digit string e.g. +05:00 or -08:00
     */
    const offsetPart = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })
      .formatToParts()
      .find((part) => part.type === 'timeZoneName');

    let offset = offsetPart ? offsetPart.value : '';

    /**
     * We want to show time based on UTC, not GMT so we swap that.
     *
     * TODO: investigate if just swapping to UTC will cause issues with daylight savings time,
     * for example london is normally GMT+0, but in summer it would be GMT+1
     */
    // let utcOffset = offset.replace('GMT', 'UTC');

    /**
     * For perfect UTC (UTC+0:00) we only get the string UTC.
     * So we need to append the 0's.
     */
    if (!offset.includes('+') && !offset.includes('-')) {
      offset = `${offset}+00:00`;
    }

    /**
     * Timezones come in the format `${CONTINENT}/${CITY}` if city
     * is two separate words e.g. `BOA_VISTA` we want them separated
     * by spaces.
     *
     * So America/Boa_Vista, becomes:
     * - Boa_Vista
     * - Boa Vista
     */
    const city = timezone.split('/')[1].split('_').join(' ');

    return { city, offset, value: timezone } satisfies ITimezoneOption;
  });

  const groupedTimezonesByOffset = timezoneList.reduce<Record<string, ITimezoneOption[]>>(
    (acc, current) => {
      if (!acc[current.offset]) {
        acc[current.offset] = [];
      }

      acc[current.offset] = [...acc[current.offset], current];

      return acc;
    },
    {}
  );

  const options = Object.entries(groupedTimezonesByOffset)
    .map(([offset, timezone]) => {
      const allTheCities = timezone.map((zone) => zone.city).join(', ');

      return {
        value: timezone[0].value,
        label: `${offset} - ${allTheCities}`,
        offset,
      };
    })
    .sort((a, b) => {
      const offsetA = parseInt(a.offset.replace('GMT', ''));
      const offsetB = parseInt(b.offset.replace('GMT', ''));

      if (offsetA < offsetB) return -1;
      return 1;
    });

  const currentTimezone = timezoneList.find(
    (timezone) => timezone.value === Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  return { timezoneList: options, currentTimezone };
};
