import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'eggs',
  location: 'us-east4'
};

export const createDemoUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateDemoUser');
}
createDemoUserRef.operationName = 'CreateDemoUser';

export function createDemoUser(dc) {
  return executeMutation(createDemoUserRef(dc));
}

export const listEggTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEggTypes');
}
listEggTypesRef.operationName = 'ListEggTypes';

export function listEggTypes(dc) {
  return executeQuery(listEggTypesRef(dc));
}

export const updateInventoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInventory', inputVars);
}
updateInventoryRef.operationName = 'UpdateInventory';

export function updateInventory(dcOrVars, vars) {
  return executeMutation(updateInventoryRef(dcOrVars, vars));
}

export const getProducerProfileByUserUidRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProducerProfileByUserUid', inputVars);
}
getProducerProfileByUserUidRef.operationName = 'GetProducerProfileByUserUid';

export function getProducerProfileByUserUid(dcOrVars, vars) {
  return executeQuery(getProducerProfileByUserUidRef(dcOrVars, vars));
}

