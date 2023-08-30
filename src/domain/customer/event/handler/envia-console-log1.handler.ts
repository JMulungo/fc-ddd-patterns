import CustomerCreatedEvent from "../customer-created.event";
import EventHandlerInterface from "../../../@shared/event/event-handler.interface";

export default class EnviaConsoleLog1Handler
    implements EventHandlerInterface<CustomerCreatedEvent> {
    handle(event: CustomerCreatedEvent): void {
        console.log(`Esse é o primeiro console.log do evento: CustomerCreated.`);
    }
}