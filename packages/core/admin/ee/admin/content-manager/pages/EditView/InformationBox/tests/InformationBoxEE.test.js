import React from 'react';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { QueryClientProvider, QueryClient } from 'react-query';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

import { STAGE_ATTRIBUTE_NAME, ASSIGNEE_ATTRIBUTE_NAME } from '../constants';
import { InformationBoxEE } from '../InformationBoxEE';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useCMEditViewDataManager: jest.fn(),
  useNotification: jest.fn(() => ({
    toggleNotification: jest.fn(),
  })),
}));

const server = setupServer(
  rest.get('*/users', (req, res, ctx) =>
    res(
      ctx.json({
        data: {
          results: [
            {
              id: 1,
            },
          ],

          pagination: {
            page: 1,
          },
        },
      })
    )
  ),

  rest.get('*/review-workflows/workflows', (req, res, ctx) =>
    res(
      ctx.json({
        data: [
          {
            id: 1,
          },
        ],
      })
    )
  )
);

const setup = (props) => {
  return render(<InformationBoxEE {...props} />, {
    wrapper({ children }) {
      const store = createStore((state = {}) => state, {});
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      return (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <IntlProvider locale="en" defaultLocale="en">
              <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
            </IntlProvider>
          </QueryClientProvider>
        </Provider>
      );
    },
  });
};

describe('EE | Content Manager | EditView | InformationBox', () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  it('renders the title and body of the Information component', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {},
      isCreatingEntry: true,
      layout: { uid: 'api::articles:articles' },
    });

    const { getByText } = setup();

    expect(getByText('Information')).toBeInTheDocument();
    expect(getByText('Last update')).toBeInTheDocument();
  });

  it('renders neither stage nor assignee select inputs, if no nothing is returned for an entity', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {},
      layout: { uid: 'api::articles:articles' },
    });

    const { queryByRole } = setup();

    expect(queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders stage and assignee select inputs, if it is returned for an entity', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {
        [STAGE_ATTRIBUTE_NAME]: {
          id: 1,
          color: '#4945FF',
          name: 'Stage 1',
          worklow: 1,
        },

        [ASSIGNEE_ATTRIBUTE_NAME]: {
          id: 1,
          firstname: 'Firstname',
          lastname: 'Lastname',
        },
      },
      layout: { uid: 'api::articles:articles' },
    });

    const { queryAllByRole } = setup();

    expect(queryAllByRole('combobox').length).toBe(2);
  });
});