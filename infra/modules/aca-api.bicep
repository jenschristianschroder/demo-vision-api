// API Container App (internal ingress, port 3001)
param name string
param location string
param environmentId string
param imageName string
param managedIdentityId string
param managedIdentityClientId string
param visionEndpoint string
param minReplicas int = 1
param maxReplicas int = 3

resource apiApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: false
        targetPort: 3001
        transport: 'auto'
      }
      registries: []
    }
    template: {
      containers: [
        {
          name: 'api'
          image: imageName
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'PORT', value: '3001' }
            { name: 'AZURE_VISION_ENDPOINT', value: visionEndpoint }
            { name: 'AZURE_CLIENT_ID', value: managedIdentityClientId }
            { name: 'CORS_ORIGIN', value: '*' }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

output fqdn string = apiApp.properties.configuration.ingress.fqdn
output name string = apiApp.name
