import { localCoffeeOperationalReadRepository } from '../../repositories';
import { localCoffeePurchaserService } from '../purchasing/service';
import { localCoffeeWarehouseService } from '../warehouse/service';
import { localCoffeeManagerWorkspaceRepository } from './repository';
import { createCoffeeManagerWorkspaceService } from './service';

export const localCoffeeManagerWorkspaceService = createCoffeeManagerWorkspaceService({
  operational: localCoffeeOperationalReadRepository,
  warehouse: localCoffeeWarehouseService,
  purchasing: localCoffeePurchaserService,
  preferences: localCoffeeManagerWorkspaceRepository,
});
