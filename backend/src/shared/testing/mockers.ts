/**
 * Mocks a service in a test application. The mock is typed to have methods that
 * conform to the interface of the service, or may be omitted if they
 * are unused in the test.
 *
 * Example:
 *
 *     app = await Test.createTestingModule({
 *       providers: [
 *         FooService,
 *         mockService(BarService),
 *         mockService(BazService, {
 *            doSomething: () => 'mocked return value'
 *         }
 *       ],
 *     }).compile()
 *
 */
export function mockService<T extends new (...args: unknown[]) => unknown>(
  module: T,
  mock: Partial<InstanceType<T>> = {},
): {
  provide: T;
  useValue: Partial<InstanceType<T>>;
} {
  return {
    provide: module,
    useValue: mock,
  };
}

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

export class MockFactory {
  static getMock<T>(type: new (...args: any[]) => T, includes?: string[]): MockType<T> {
    const mock: MockType<T> = {};

    Object.getOwnPropertyNames(type.prototype)
      .filter((key: string) => key !== 'constructor' && (!includes || includes.includes(key)))
      .map((key: string) => {
        mock[key] = jest.fn();
      });

    return mock;
  }
}