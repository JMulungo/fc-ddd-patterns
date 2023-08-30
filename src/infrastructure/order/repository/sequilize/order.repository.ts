import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItem from "../../../../domain/checkout/entity/order_item";

export default class OrderRepository implements OrderRepositoryInterface {
    async create(entity: Order): Promise<void> {
        await OrderModel.create({
            id: entity.id,
            customer_id: entity.customerId,
            total: entity.total(),
            items: entity.items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                product_id: item.productId,
                quantity: item.quantity,
            })),
        }, {
            include: [{model: OrderItemModel}]
        });
    }

    async find(id: string): Promise<Order> {
        let orderModel;
        try {
            orderModel = await OrderModel.findOne({
                where: {
                    id,
                },
                include: [
                    {model: OrderItemModel, as: 'items'}
                ],
                rejectOnEmpty: true,
            });
        } catch (error) {
            throw new Error("Order not found");
        }

        const items = orderModel.items.map((item: OrderItemModel) => {
            return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
        });
        return new Order(
            id,
            orderModel.customer_id,
            items
        );
    }

    async findAll(): Promise<Order[]> {
        const orderModels = await OrderModel.findAll({
                include: [
                    {model: OrderItemModel, as: 'items'}
                ]
            }
        );

        return orderModels.map((orderModel) => {
            const orderItems = orderModel.items.map((item: OrderItemModel) => {
                return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
            });
            return new Order(orderModel.id, orderModel.customer_id, orderItems);
        });
    }

    async update(entity: Order): Promise<void> {
        const {id, customerId, items} = entity;

        try {
            await OrderModel.update(
                {
                    customer_id: customerId,
                    total: entity.total(),
                },
                {
                    where: {id}
                }
            );

            await Promise.all(items.map(async (item) => {
                await OrderItemModel.upsert(
                    {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        product_id: item.productId,
                        order_id: id
                    }
                );
            }));
        } catch (error) {
            throw new Error("Error updating order and items: " + error);
        }
    }
}