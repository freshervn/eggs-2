const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'eggs',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createDemoUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateDemoUser');
}
createDemoUserRef.operationName = 'CreateDemoUser';
exports.createDemoUserRef = createDemoUserRef;

exports.createDemoUser = function createDemoUser(dc) {
  return executeMutation(createDemoUserRef(dc));
};

const listEggTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEggTypes');
}
listEggTypesRef.operationName = 'ListEggTypes';
exports.listEggTypesRef = listEggTypesRef;

exports.listEggTypes = function listEggTypes(dc) {
  return executeQuery(listEggTypesRef(dc));
};

const updateInventoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInventory', inputVars);
}
updateInventoryRef.operationName = 'UpdateInventory';
exports.updateInventoryRef = updateInventoryRef;

exports.updateInventory = function updateInventory(dcOrVars, vars) {
  return executeMutation(updateInventoryRef(dcOrVars, vars));
};

const getProducerProfileByUserUidRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProducerProfileByUserUid', inputVars);
}
getProducerProfileByUserUidRef.operationName = 'GetProducerProfileByUserUid';
exports.getProducerProfileByUserUidRef = getProducerProfileByUserUidRef;

exports.getProducerProfileByUserUid = function getProducerProfileByUserUid(dcOrVars, vars) {
  return executeQuery(getProducerProfileByUserUidRef(dcOrVars, vars));
};
