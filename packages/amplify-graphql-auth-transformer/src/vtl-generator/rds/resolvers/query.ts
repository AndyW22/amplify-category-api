import { compoundExpression, equals, ifElse, methodCall, nul, printBlock, ref, set, str, toJson } from 'graphql-mapping-template';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { OPERATION_KEY } from '@aws-amplify/graphql-model-transformer';
import { ConfiguredAuthProviders, RoleDefinition } from '../../../utils';
import { constructAuthFilter, emptyPayload, generateAuthRulesFromRoles, validateAuthResult } from './common';

export const generateAuthExpressionForQueries = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ctx: TransformerContextProvider,
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  def: ObjectTypeDefinitionNode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  indexName: string | undefined,
): string => {
  const expressions = [];
  expressions.push(compoundExpression(generateAuthRulesFromRoles(roles, fields, providers.hasIdentityPoolId, true)));
  expressions.push(set(ref('authResult'), methodCall(ref('util.authRules.queryAuth'), ref('authRules'))));
  expressions.push(validateAuthResult(), constructAuthFilter(), emptyPayload);
  return printBlock('Authorization rules')(compoundExpression(expressions));
};

export const generateAuthExpressionForField = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fieldName: string = undefined,
): string => {
  const expressions = [];
  expressions.push(compoundExpression(generateAuthRulesFromRoles(roles, fields, providers.hasIdentityPoolId, true)));
  expressions.push(set(ref('authResult'), methodCall(ref('util.authRules.queryAuth'), ref('authRules'))));
  expressions.push(validateAuthResult(), emptyPayload);
  return printBlock('Authorization rules')(compoundExpression(expressions));
};

/**
 * This is the response resolver for fields to protect subscriptions
 */
export const generateFieldAuthResponse = (operation: string, fieldName: string, subscriptionsEnabled: boolean): string => {
  if (subscriptionsEnabled) {
    return printBlock('Checking for allowed operations which can return this field')(
      compoundExpression([
        set(ref('operation'), methodCall(ref('util.defaultIfNull'), methodCall(ref('ctx.source.get'), str(OPERATION_KEY)), nul())),
        ifElse(equals(ref('operation'), str(operation)), toJson(nul()), toJson(ref(`context.source["${fieldName}"]`))),
      ]),
    );
  }
  return printBlock('Return Source Field')(toJson(ref(`context.source["${fieldName}"]`)));
};

/**
 * Generates auth filters for relational queries
 */
export const generateAuthExpressionForRelationQuery = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ctx: TransformerContextProvider,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  def: ObjectTypeDefinitionNode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  field: FieldDefinitionNode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  relatedModelObject: ObjectTypeDefinitionNode,
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
): string => {
  const expressions = [];
  expressions.push(compoundExpression(generateAuthRulesFromRoles(roles, fields, providers.hasIdentityPoolId, true)));
  expressions.push(set(ref('authResult'), methodCall(ref('util.authRules.queryAuth'), ref('authRules'))));
  expressions.push(validateAuthResult(), constructAuthFilter(), emptyPayload);
  return printBlock('Authorization rules')(compoundExpression(expressions));
};
