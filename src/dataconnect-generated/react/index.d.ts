import { CreateDemoUserData, ListEggTypesData, UpdateInventoryData, UpdateInventoryVariables, GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateDemoUser(options?: useDataConnectMutationOptions<CreateDemoUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateDemoUserData, undefined>;
export function useCreateDemoUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDemoUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateDemoUserData, undefined>;

export function useListEggTypes(options?: useDataConnectQueryOptions<ListEggTypesData>): UseDataConnectQueryResult<ListEggTypesData, undefined>;
export function useListEggTypes(dc: DataConnect, options?: useDataConnectQueryOptions<ListEggTypesData>): UseDataConnectQueryResult<ListEggTypesData, undefined>;

export function useUpdateInventory(options?: useDataConnectMutationOptions<UpdateInventoryData, FirebaseError, UpdateInventoryVariables>): UseDataConnectMutationResult<UpdateInventoryData, UpdateInventoryVariables>;
export function useUpdateInventory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateInventoryData, FirebaseError, UpdateInventoryVariables>): UseDataConnectMutationResult<UpdateInventoryData, UpdateInventoryVariables>;

export function useGetProducerProfileByUserUid(vars: GetProducerProfileByUserUidVariables, options?: useDataConnectQueryOptions<GetProducerProfileByUserUidData>): UseDataConnectQueryResult<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
export function useGetProducerProfileByUserUid(dc: DataConnect, vars: GetProducerProfileByUserUidVariables, options?: useDataConnectQueryOptions<GetProducerProfileByUserUidData>): UseDataConnectQueryResult<GetProducerProfileByUserUidData, GetProducerProfileByUserUidVariables>;
