import { Sequelize } from "sequelize-typescript";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import CustomerModel from "./customer.model";
import CustomerRepository from "./customer.repository";
import EventDispatcher from "../../../../domain/@shared/event/event-dispatcher";
import SendEmailWhenProductIsCreatedHandler
  from "../../../../domain/product/event/handler/send-email-when-product-is-created.handler";
import EnviaConsoleLog1Handler from "../../../../domain/customer/event/handler/envia-console-log1.handler";
import EnviaConsoleLog2Handler from "../../../../domain/customer/event/handler/envia-console-log2.handler";
import CustomerCreatedEvent from "../../../../domain/customer/event/customer-created.event";
import EnviaConsoleLogHandler from "../../../../domain/customer/event/handler/envia-console-log.handler";
import CustomerAddressChangedEvent from "../../../../domain/customer/event/customer-address-changed.event";

describe("Customer repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([CustomerModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a customer", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    await customerRepository.create(customer);

    const customerModel = await CustomerModel.findOne({ where: { id: "123" } });

    expect(customerModel.toJSON()).toStrictEqual({
      id: "123",
      name: customer.name,
      active: customer.isActive(),
      rewardPoints: customer.rewardPoints,
      street: address.street,
      number: address.number,
      zipcode: address.zip,
      city: address.city,
    });
  });

  it("should update a customer", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    await customerRepository.create(customer);

    customer.changeName("Customer 2");
    await customerRepository.update(customer);
    const customerModel = await CustomerModel.findOne({ where: { id: "123" } });

    expect(customerModel.toJSON()).toStrictEqual({
      id: "123",
      name: customer.name,
      active: customer.isActive(),
      rewardPoints: customer.rewardPoints,
      street: address.street,
      number: address.number,
      zipcode: address.zip,
      city: address.city,
    });
  });

  it("should find a customer", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    await customerRepository.create(customer);

    const customerResult = await customerRepository.find(customer.id);

    expect(customer).toStrictEqual(customerResult);
  });

  it("should throw an error when customer is not found", async () => {
    const customerRepository = new CustomerRepository();

    expect(async () => {
      await customerRepository.find("456ABC");
    }).rejects.toThrow("Customer not found");
  });

  it("should find all customers", async () => {
    const customerRepository = new CustomerRepository();
    const customer1 = new Customer("123", "Customer 1");
    const address1 = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer1.Address = address1;
    customer1.addRewardPoints(10);
    customer1.activate();

    const customer2 = new Customer("456", "Customer 2");
    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    customer2.Address = address2;
    customer2.addRewardPoints(20);

    await customerRepository.create(customer1);
    await customerRepository.create(customer2);

    const customers = await customerRepository.findAll();

    expect(customers).toHaveLength(2);
    expect(customers).toContainEqual(customer1);
    expect(customers).toContainEqual(customer2);
  });

  it("should call all handlers when a customer is created", async () => {
    const eventDispatcher = new EventDispatcher();
    const enviaConsoleLog1Handler = new EnviaConsoleLog1Handler();
    const enviaConsoleLog2Handler = new EnviaConsoleLog2Handler();
    const spyEvent1Handler = jest.spyOn(enviaConsoleLog1Handler, "handle");
    const spyEvent2Handler = jest.spyOn(enviaConsoleLog2Handler, "handle");

    const customerCreatedEvent = new CustomerCreatedEvent({
      id: "123",
      name: "John Customer"
    });

    eventDispatcher.register("CustomerCreatedEvent", enviaConsoleLog1Handler);
    eventDispatcher.register("CustomerCreatedEvent", enviaConsoleLog2Handler);

    eventDispatcher.notify(customerCreatedEvent);

    expect(spyEvent1Handler).toHaveBeenCalled();
    expect(spyEvent2Handler).toHaveBeenCalled();
  });

    it("should call handler when a customer address changed", async () => {
        const eventDispatcher = new EventDispatcher();
        const enviaConsoleLogHandler = new EnviaConsoleLogHandler();
        const spyEventHandler = jest.spyOn(enviaConsoleLogHandler, "handle");

        const customerAddressChangedEvent = new CustomerAddressChangedEvent({
            id: "123",
            name: "Alex Telles",
            address: new Address("Street 2", 1, "Zipcode 3", "City 3")
        });

        eventDispatcher.register("CustomerAddressChangedEvent", enviaConsoleLogHandler);

        eventDispatcher.notify(customerAddressChangedEvent);

        expect(spyEventHandler).toHaveBeenCalled();
    });
});

