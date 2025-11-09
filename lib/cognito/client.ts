import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { AWS_REGION } from '@/lib/config'

let client: CognitoIdentityProviderClient | null = null

export function getCognitoClient() {
  if (!client) {
    client = new CognitoIdentityProviderClient({
      region: AWS_REGION,
    })
  }

  return client
}

