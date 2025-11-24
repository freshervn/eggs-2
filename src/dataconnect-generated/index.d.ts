import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateDemoUserData {
  user_insert: User_Key;
}

export interface EggType_Key {
  id: UUIDString;
  __typename?: 'EggType_Key';
}

export interface GetProducerProfileByUserUidData {
  producerProfiles: ({
    id: UUIDString;
    farmName: string;
    location: string;
    description?: string | null;
    deliveryOptions?: string | null;
  } & ProducerProfile_Key)[];
}

export interface GetProducerProfileByUserUidVariables {
  userId: UUIDString;
}

export interface Inventory_Key {
  id: UUIDString;
  __typename?: 'Inventory_Key';
}

export interface ListEggTypesData {
  eggTypes: ({
    id: UUIDString;
    eggName: string;
    description?: string | null;
    pricePerDozen: number;
  } & EggType_Key)[];
}

export interface OrderItem_Key {
  id: UUIDString;
  __typename?: 'OrderItem_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface ProducerProfile_Key {
  id: UUIDString;
  __typename?: 'ProducerProfile_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface UpdateInventoryData {
  inventory_update?: Inventory_Key | null;
}

export interface UpdateInventoryVariables {
  id: UUIDString;
  availableQuantity: number;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateDemoUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateDemoUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateDemoUserData, undefined>;
  operationName: string;
}
export const createDemoUserRef: CreateDemoUserRef;

export function createDemoUser(): MutationPromise<CreateDemoUserData, undefined>;
export function createDemoUser(dc: DataConnect): MutationPromise<CreateDemoUserData, undefined>;

interface ListEggTypesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEggTypesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEggTypesData, undefined>;
  operationName: string;
}
export const listEggTypesRef: ListEggTypesRef;

export function listEggTypes(): QueryPromise<ListEggTypesData, undefined>;
export function listEggTypes(dc: DataConnect): QueryPromise<ListEggTypesData, undefined>;

interface UpdateInventoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInventoryVariables): MutationRef<UpdateInventoryData, UpdateInventoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateInventoryVariables): MutationRef<UpdateInventoryData, UpdateInventoryVariables>;
  operationName: string;
}
export const updateInventoryRef: UpdateInventoryRef;

export function updateInventory(vars: UpdateInventoryVariables): MutationPromise<UpdateInventoryData, UpdateInventoryVariables>;
export function updateInventory(dc: DataConnect, vars: UpdateInventoryVariables): MutationPromise<UpdateInventoryData, UpdateInventoryVariables>;

interface GetProducerProfileByUserUidRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProducerProfileByUserUidVariables): QueryRef<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProducerProfileByUserUidVariables): QueryRef<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
  operationName: string;
}
export const getProducerProfileByUserUidRef: GetProducerProfileByUserUidRef;

export function getProducerProfileByUserUid(vars: GetProducerProfileByUserUidVariables): QueryPromise<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
export function getProducerProfileByUserUid(dc: DataConnect, vars: GetProducerProfileByUserUidVariables): QueryPromise<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;

