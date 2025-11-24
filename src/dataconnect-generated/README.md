# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListEggTypes*](#listeggtypes)
  - [*GetProducerProfileByUserUid*](#getproducerprofilebyuseruid)
- [**Mutations**](#mutations)
  - [*CreateDemoUser*](#createdemouser)
  - [*UpdateInventory*](#updateinventory)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListEggTypes
You can execute the `ListEggTypes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listEggTypes(): QueryPromise<ListEggTypesData, undefined>;

interface ListEggTypesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEggTypesData, undefined>;
}
export const listEggTypesRef: ListEggTypesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEggTypes(dc: DataConnect): QueryPromise<ListEggTypesData, undefined>;

interface ListEggTypesRef {
  ...
  (dc: DataConnect): QueryRef<ListEggTypesData, undefined>;
}
export const listEggTypesRef: ListEggTypesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEggTypesRef:
```typescript
const name = listEggTypesRef.operationName;
console.log(name);
```

### Variables
The `ListEggTypes` query has no variables.
### Return Type
Recall that executing the `ListEggTypes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEggTypesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListEggTypesData {
  eggTypes: ({
    id: UUIDString;
    eggName: string;
    description?: string | null;
    pricePerDozen: number;
  } & EggType_Key)[];
}
```
### Using `ListEggTypes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEggTypes } from '@dataconnect/generated';


// Call the `listEggTypes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEggTypes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEggTypes(dataConnect);

console.log(data.eggTypes);

// Or, you can use the `Promise` API.
listEggTypes().then((response) => {
  const data = response.data;
  console.log(data.eggTypes);
});
```

### Using `ListEggTypes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEggTypesRef } from '@dataconnect/generated';


// Call the `listEggTypesRef()` function to get a reference to the query.
const ref = listEggTypesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEggTypesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.eggTypes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.eggTypes);
});
```

## GetProducerProfileByUserUid
You can execute the `GetProducerProfileByUserUid` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getProducerProfileByUserUid(vars: GetProducerProfileByUserUidVariables): QueryPromise<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;

interface GetProducerProfileByUserUidRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProducerProfileByUserUidVariables): QueryRef<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
}
export const getProducerProfileByUserUidRef: GetProducerProfileByUserUidRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProducerProfileByUserUid(dc: DataConnect, vars: GetProducerProfileByUserUidVariables): QueryPromise<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;

interface GetProducerProfileByUserUidRef {
  ...
  (dc: DataConnect, vars: GetProducerProfileByUserUidVariables): QueryRef<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
}
export const getProducerProfileByUserUidRef: GetProducerProfileByUserUidRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProducerProfileByUserUidRef:
```typescript
const name = getProducerProfileByUserUidRef.operationName;
console.log(name);
```

### Variables
The `GetProducerProfileByUserUid` query requires an argument of type `GetProducerProfileByUserUidVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProducerProfileByUserUidVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `GetProducerProfileByUserUid` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProducerProfileByUserUidData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetProducerProfileByUserUidData {
  producerProfiles: ({
    id: UUIDString;
    farmName: string;
    location: string;
    description?: string | null;
    deliveryOptions?: string | null;
  } & ProducerProfile_Key)[];
}
```
### Using `GetProducerProfileByUserUid`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProducerProfileByUserUid, GetProducerProfileByUserUidVariables } from '@dataconnect/generated';

// The `GetProducerProfileByUserUid` query requires an argument of type `GetProducerProfileByUserUidVariables`:
const getProducerProfileByUserUidVars: GetProducerProfileByUserUidVariables = {
  userId: ..., 
};

// Call the `getProducerProfileByUserUid()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProducerProfileByUserUid(getProducerProfileByUserUidVars);
// Variables can be defined inline as well.
const { data } = await getProducerProfileByUserUid({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProducerProfileByUserUid(dataConnect, getProducerProfileByUserUidVars);

console.log(data.producerProfiles);

// Or, you can use the `Promise` API.
getProducerProfileByUserUid(getProducerProfileByUserUidVars).then((response) => {
  const data = response.data;
  console.log(data.producerProfiles);
});
```

### Using `GetProducerProfileByUserUid`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProducerProfileByUserUidRef, GetProducerProfileByUserUidVariables } from '@dataconnect/generated';

// The `GetProducerProfileByUserUid` query requires an argument of type `GetProducerProfileByUserUidVariables`:
const getProducerProfileByUserUidVars: GetProducerProfileByUserUidVariables = {
  userId: ..., 
};

// Call the `getProducerProfileByUserUidRef()` function to get a reference to the query.
const ref = getProducerProfileByUserUidRef(getProducerProfileByUserUidVars);
// Variables can be defined inline as well.
const ref = getProducerProfileByUserUidRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProducerProfileByUserUidRef(dataConnect, getProducerProfileByUserUidVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.producerProfiles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.producerProfiles);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateDemoUser
You can execute the `CreateDemoUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createDemoUser(): MutationPromise<CreateDemoUserData, undefined>;

interface CreateDemoUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateDemoUserData, undefined>;
}
export const createDemoUserRef: CreateDemoUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createDemoUser(dc: DataConnect): MutationPromise<CreateDemoUserData, undefined>;

interface CreateDemoUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateDemoUserData, undefined>;
}
export const createDemoUserRef: CreateDemoUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createDemoUserRef:
```typescript
const name = createDemoUserRef.operationName;
console.log(name);
```

### Variables
The `CreateDemoUser` mutation has no variables.
### Return Type
Recall that executing the `CreateDemoUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateDemoUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateDemoUserData {
  user_insert: User_Key;
}
```
### Using `CreateDemoUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createDemoUser } from '@dataconnect/generated';


// Call the `createDemoUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createDemoUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createDemoUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createDemoUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateDemoUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createDemoUserRef } from '@dataconnect/generated';


// Call the `createDemoUserRef()` function to get a reference to the mutation.
const ref = createDemoUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createDemoUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateInventory
You can execute the `UpdateInventory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateInventory(vars: UpdateInventoryVariables): MutationPromise<UpdateInventoryData, UpdateInventoryVariables>;

interface UpdateInventoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInventoryVariables): MutationRef<UpdateInventoryData, UpdateInventoryVariables>;
}
export const updateInventoryRef: UpdateInventoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateInventory(dc: DataConnect, vars: UpdateInventoryVariables): MutationPromise<UpdateInventoryData, UpdateInventoryVariables>;

interface UpdateInventoryRef {
  ...
  (dc: DataConnect, vars: UpdateInventoryVariables): MutationRef<UpdateInventoryData, UpdateInventoryVariables>;
}
export const updateInventoryRef: UpdateInventoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateInventoryRef:
```typescript
const name = updateInventoryRef.operationName;
console.log(name);
```

### Variables
The `UpdateInventory` mutation requires an argument of type `UpdateInventoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateInventoryVariables {
  id: UUIDString;
  availableQuantity: number;
}
```
### Return Type
Recall that executing the `UpdateInventory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateInventoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateInventoryData {
  inventory_update?: Inventory_Key | null;
}
```
### Using `UpdateInventory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateInventory, UpdateInventoryVariables } from '@dataconnect/generated';

// The `UpdateInventory` mutation requires an argument of type `UpdateInventoryVariables`:
const updateInventoryVars: UpdateInventoryVariables = {
  id: ..., 
  availableQuantity: ..., 
};

// Call the `updateInventory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateInventory(updateInventoryVars);
// Variables can be defined inline as well.
const { data } = await updateInventory({ id: ..., availableQuantity: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateInventory(dataConnect, updateInventoryVars);

console.log(data.inventory_update);

// Or, you can use the `Promise` API.
updateInventory(updateInventoryVars).then((response) => {
  const data = response.data;
  console.log(data.inventory_update);
});
```

### Using `UpdateInventory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateInventoryRef, UpdateInventoryVariables } from '@dataconnect/generated';

// The `UpdateInventory` mutation requires an argument of type `UpdateInventoryVariables`:
const updateInventoryVars: UpdateInventoryVariables = {
  id: ..., 
  availableQuantity: ..., 
};

// Call the `updateInventoryRef()` function to get a reference to the mutation.
const ref = updateInventoryRef(updateInventoryVars);
// Variables can be defined inline as well.
const ref = updateInventoryRef({ id: ..., availableQuantity: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateInventoryRef(dataConnect, updateInventoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inventory_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inventory_update);
});
```

