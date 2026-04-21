// SPA Container App (external ingress, port 80)
param name string
param location string
param environmentId string
param imageName string
param apiBackendUrl string
param minReplicas int = 0
param maxReplicas int = 3

resource spaApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'auto'
      }
      registries: []
    }
    template: {
      containers: [
        {
          name: 'spa'
          image: imageName
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'API_BACKEND_URL', value: apiBackendUrl }
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

output fqdn string = spaApp.properties.configuration.ingress.fqdn
output name string = spaApp.name
output url string = 'https://${spaApp.properties.configuration.ingress.fqdn}'
