// Main Bicep orchestrator for Vision API demo
targetScope = 'resourceGroup'

@description('Base name for all resources')
param appName string = 'vision-api'

@description('Azure region')
param location string = resourceGroup().location

@description('Azure AI Vision endpoint')
param visionEndpoint string

@description('Azure AI Vision resource ID (for role assignment)')
param visionResourceId string = ''

@description('SPA container image')
param spaImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('API container image')
param apiImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

// Derived names
var acrName = replace('${appName}acr', '-', '')
var envName = '${appName}-env'
var apiAppName = '${appName}-api'
var spaAppName = '${appName}-spa'
var identityName = '${appName}-identity'

module acr 'modules/acr.bicep' = {
  name: 'acr'
  params: {
    name: acrName
    location: location
  }
}

module identity 'modules/identity.bicep' = {
  name: 'identity'
  params: {
    name: identityName
    location: location
    acrId: acr.outputs.id
    visionResourceId: visionResourceId
  }
}

module env 'modules/aca-environment.bicep' = {
  name: 'aca-environment'
  params: {
    name: envName
    location: location
  }
}

module api 'modules/aca-api.bicep' = {
  name: 'aca-api'
  params: {
    name: apiAppName
    location: location
    environmentId: env.outputs.id
    imageName: apiImage
    managedIdentityId: identity.outputs.id
    managedIdentityClientId: identity.outputs.clientId
    visionEndpoint: visionEndpoint
    acrLoginServer: acr.outputs.loginServer
  }
}

module spa 'modules/aca-spa.bicep' = {
  name: 'aca-spa'
  params: {
    name: spaAppName
    location: location
    environmentId: env.outputs.id
    imageName: spaImage
    apiBackendUrl: 'https://${api.outputs.fqdn}'
    managedIdentityId: identity.outputs.id
    acrLoginServer: acr.outputs.loginServer
  }
}

output acrLoginServer string = acr.outputs.loginServer
output spaUrl string = spa.outputs.url
output apiAppName string = api.outputs.name
output spaAppName string = spa.outputs.name
