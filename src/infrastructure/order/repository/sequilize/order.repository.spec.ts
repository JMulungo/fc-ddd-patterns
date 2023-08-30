import {Sequelize} from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
    let sequelize: Sequelize;

    beforeEach(async () => {
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false,
            sync: {force: true},
        });

        await sequelize.addModels([
            CustomerModel,
            OrderModel,
            OrderItemModel,
            ProductModel,
        ]);
        await sequelize.sync();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it("should create a new order", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 1");
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("123", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem(
            "1",
            product.name,
            product.price,
            product.id,
            2
        );

        const order = new Order("123", "123", [orderItem]);

        const orderRepository = new OrderRepository();
        await orderRepository.create(order);

        const orderModel = await OrderModel.findOne({
            where: {id: order.id},
            include: ["items"],
        });

        expect(orderModel.toJSON()).toStrictEqual({
            id: "123",
            customer_id: "123",
            total: order.total(),
            items: [
                {
                    id: orderItem.id,
                    name: orderItem.name,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    order_id: "123",
                    product_id: "123",
                },
            ],
        });
    });

    it("should find a order", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 2");
        const address = new Address("Street 2", 1, "Zipcode 2", "City 2");
        customer.changeAddress(address);
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("123", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);

        const order = new Order("123", "123", [orderItem]);

        const orderRepository = new OrderRepository();
        await orderRepository.create(order);

        const orderResult = await orderRepository.find(order.id);

        expect(order).toStrictEqual(orderResult);
        expect(orderResult.items).toHaveLength(1);
        expect(orderItem).toStrictEqual(orderResult.items[0]);
    });

    it("should throw an error when order is not found", async () => {
        const orderRepository = new OrderRepository();

        await expect(async () => {
            await orderRepository.find("123456");
        }).rejects.toThrow("Order not found");
    });

    it("should find all orders", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 3");
        customer.Address = new Address("Street 3", 1, "Zipcode 1", "City 1");
        customer.addRewardPoints(10);
        customer.activate();
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product1 = new Product("123", "Product 1", 10);
        const product2 = new Product("456", "Product 2", 15);

        await productRepository.create(product1);
        await productRepository.create(product2);

        const orderItem1 = new OrderItem("1", product1.name, product1.price, product1.id, 2);
        const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 5);
        const orderItem3 = new OrderItem("3", product2.name, product2.price, product2.id, 3);

        const order1 = new Order("123", "123", [orderItem1, orderItem2]);
        const order2 = new Order("456", "123", [orderItem3]);

        const orderRepository = new OrderRepository();
        await orderRepository.create(order1);
        await orderRepository.create(order2);

        const orders = await orderRepository.findAll();

        expect(orders).toHaveLength(2);

        expect(95).toEqual(order1.total());
        expect(45).toEqual(order2.total());

        expect(orders).toContainEqual(order1);
        expect(orders).toContainEqual(order2);
    });

    it("should update a order", async () => {
        const customerRepository = new CustomerRepository();
        const customer = new Customer("123", "Customer 3");
        customer.Address = new Address("Street 4", 1, "Zipcode 1", "City 1");
        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product1 = new Product("123", "Product 1", 12);
        const product2 = new Product("456", "Product 2", 18);

        await productRepository.create(product1);
        await productRepository.create(product2);

        const orderItem1 = new OrderItem("1", product1.name, product1.price, product1.id, 2);

        const order1 = new Order("123", "123", [orderItem1]);

        const orderRepository = new OrderRepository();
        await orderRepository.create(order1);

        const orderResult = await orderRepository.find("123");

        expect(orderResult.items).toHaveLength(1);
        expect(orderResult.total()).toEqual(24);

        const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 5);
        order1.addItem(orderItem2);

        await orderRepository.update(order1);

        const result = await orderRepository.find("123");
        expect(result.items).toHaveLength(2);
        expect(result.total()).toEqual(114);
    });
});
