# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateDemoUser, useListEggTypes, useUpdateInventory, useGetProducerProfileByUserUid } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateDemoUser();

const { data, isPending, isSuccess, isError, error } = useListEggTypes();

const { data, isPending, isSuccess, isError, error } = useUpdateInventory(updateInventoryVars);

const { data, isPending, isSuccess, isError, error } = useGetProducerProfileByUserUid(getProducerProfileByUserUidVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createDemoUser, listEggTypes, updateInventory, getProducerProfileByUserUid } from '@dataconnect/generated';


// Operation CreateDemoUser: 
const { data } = await CreateDemoUser(dataConnect);

// Operation ListEggTypes: 
const { data } = await ListEggTypes(dataConnect);

// Operation UpdateInventory:  For variables, look at type UpdateInventoryVars in ../index.d.ts
const { data } = await UpdateInventory(dataConnect, updateInventoryVars);

// Operation GetProducerProfileByUserUid:  For variables, look at type GetProducerProfileByUserUidVars in ../index.d.ts
const { data } = await GetProducerProfileByUserUid(dataConnect, getProducerProfileByUserUidVars);


```