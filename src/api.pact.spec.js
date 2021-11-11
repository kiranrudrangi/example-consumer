import { Pact } from '@pact-foundation/pact';
import { API } from './api';
import { eachLike, like, regex } from '@pact-foundation/pact/dsl/matchers';
import { Product } from './product';

const mockProvider = new Pact({
  consumer: 'pactflow-example-consumer',
  provider: process.env.PACT_PROVIDER ? process.env.PACT_PROVIDER : 'pactflow-example-provider',
});

describe('API Pact test', () => {
  beforeAll(() => mockProvider.setup());
  afterEach(() => mockProvider.verify());
  afterAll(() => mockProvider.finalize());

  describe('retrieving all products', () => {
    test('products exists', async () => {
      // set up Pact interactions
      const expectedProduct = { id: '10', type: 'CREDIT_CARD', name: '28 Degrees' }

      await mockProvider.addInteraction({
        state: 'products exist',
        uponReceiving: 'a request to get all products',
        withRequest: {
          method: 'GET',
          path: '/products',
          headers: {
            Authorization: like('Bearer 2019-01-14T11:34:18.045Z'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': regex({generate: 'application/json; charset=utf-8', matcher: 'application/json;?.*'}),
          },
          body: eachLike(expectedProduct),
        },
      });

      const api = new API(mockProvider.mockService.baseUrl);

      // make request to Pact mock server
      const products = await api.getAllProducts()

      // assert that we got the expected response
      expect(products).toStrictEqual([new Product(expectedProduct)]);
    }); // end test

  test("no products exists", async () => {

      // set up Pact interactions
      await mockProvider.addInteraction({
        state: 'no products exist',
        uponReceiving: 'get all products',
        withRequest: {
          method: 'GET',
          path: '/products',
          headers: {
              "Authorization": like("Bearer 2019-01-14T11:34:18.045Z")
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: []
        },
      });
    
      const api = new API(mockProvider.mockService.baseUrl);
    
      // make request to Pact mock server
      const product = await api.getAllProducts();
    
      expect(product).toStrictEqual([]);
    });

  test("no auth token", async () => {

      // set up Pact interactions
      await mockProvider.addInteraction({
          state: 'products exist',
          uponReceiving: 'get all products with no auth token',
          withRequest: {
              method: 'GET',
              path: '/products'
          },
          willRespondWith: {
              status: 401
          },
      });

      const api = new API(mockProvider.mockService.baseUrl);

      // make request to Pact mock server
      await expect(api.getAllProducts()).rejects.toThrow("Request failed with status code 401");
  });
  }); //end describe retrieving all products

  describe('retrieving one product', () => {
    test('ID 10 exists', async () => {
      // Arrange
      const expectedProduct = { id: '10', type: 'CREDIT_CARD', name: '28 Degrees'}

      // Uncomment to see this fail
      // const expectedProduct = { id: '10', type: 'CREDIT_CARD', name: '28 Degrees', price: 30.0, newField: 22}

      await mockProvider.addInteraction({
        state: 'product with ID 10 exists',
        uponReceiving: 'a request to get a product',
        withRequest: {
          method: 'GET',
          path: '/product/10',
          headers: {
            Authorization: like('Bearer 2019-01-14T11:34:18.045Z'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': regex({generate: 'application/json; charset=utf-8', matcher: 'application/json;?.*'}),
          },
          body: like(expectedProduct),
        },
      });

      // Act
      const api = new API(mockProvider.mockService.baseUrl);
      const product = await api.getProduct('10');

      // Assert - did we get the expected response
      expect(product).toStrictEqual(new Product(expectedProduct));
    });

    test('product does not exist', async () => {

        // set up Pact interactions
        await mockProvider.addInteraction({
          state: 'product with ID 11 does not exist',
          uponReceiving: 'a request to get a product',
          withRequest: {
            method: 'GET',
            path: '/product/11',
            headers: {
              'Authorization': like('Bearer 2019-01-14T11:34:18.045Z')
            }
          },
          willRespondWith: {
            status: 404
          },
        });

        const api = new API(mockProvider.mockService.baseUrl);

        // make request to Pact mock server
        await expect(api.getProduct('11')).rejects.toThrow('Request failed with status code 404');
    });// end test

    test("no auth token", async () => {
      // set up Pact interactions
      await mockProvider.addInteraction({
          state: 'product with ID 10 exists',
          uponReceiving: 'get product by ID 10 with no auth token',
          withRequest: {
              method: 'GET',
              path: '/product/10'
          },
          willRespondWith: {
              status: 401
          },
      });

      const api = new API(mockProvider.mockService.baseUrl);

      // make request to Pact mock server
      await expect(api.getProduct("10")).rejects.toThrow("Request failed with status code 401");
  });
  }); // end describe retrieving one product

}); // end API Pact test
