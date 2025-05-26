import { BotInstance } from "../types";
import { DatabaseService } from "../database";
import { CartService } from "../cart";
import NotificationService from "../notifications";
import { createLogger } from "../logger";

export interface ServiceContainer {
  bot: BotInstance;
  database: DatabaseService;
  cart: CartService;
  notifications: NotificationService;
  logger: ReturnType<typeof createLogger>;
}

export class ServiceRegistry {
  private services: Partial<ServiceContainer> = {};

  register<K extends keyof ServiceContainer>(name: K, service: ServiceContainer[K]): void {
    this.services[name] = service;
  }

  get<K extends keyof ServiceContainer>(name: K): ServiceContainer[K] {
    const service = this.services[name];
    if (!service) {
      throw new Error(`Service ${String(name)} not registered`);
    }
    return service;
  }

  getAll(): ServiceContainer {
    return this.services as ServiceContainer;
  }
}

export const serviceRegistry = new ServiceRegistry();
