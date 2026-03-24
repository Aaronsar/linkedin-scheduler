export interface LinkedInOrganization {
  id: string
  localizedName: string
  vanityName?: string
  logoUrl?: string
}

export async function fetchAdministeredOrganizations(
  accessToken: string
): Promise<LinkedInOrganization[]> {
  try {
    // Fetch organizations where the user is an admin
    const response = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName,vanityName,logoV2(original~:playableStreams))))',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    if (!response.ok) {
      // If the scope is not available, return empty (user hasn't got Community Management API)
      console.log('Organizations fetch failed (scope may not be available):', response.status)
      return []
    }

    const data = await response.json()
    const elements = data.elements || []

    return elements.map((el: Record<string, unknown>) => {
      const org = el['organization~'] as Record<string, unknown> | undefined
      const orgUrn = el.organization as string // "urn:li:organization:123456"
      const orgId = orgUrn?.split(':').pop() || ''

      let logoUrl: string | undefined
      if (org?.logoV2) {
        const logo = org.logoV2 as Record<string, unknown>
        const original = logo['original~'] as Record<string, unknown> | undefined
        const streams = original?.elements as Array<Record<string, unknown>> | undefined
        if (streams && streams.length > 0) {
          logoUrl = streams[0].identifiers as string | undefined
        }
      }

      return {
        id: orgId,
        localizedName: (org?.localizedName as string) || 'Page LinkedIn',
        vanityName: org?.vanityName as string | undefined,
        logoUrl,
      }
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return []
  }
}

export async function publishOrganizationPost(
  accessToken: string,
  organizationUrn: string,
  text: string,
  visibility: string = 'PUBLIC'
) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: organizationUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    }),
  })

  if (response.status === 201) {
    const postUrn = response.headers.get('X-RestLi-Id')
    return { success: true, postUrn: postUrn || undefined }
  }

  const error = await response.json().catch(() => ({ message: response.statusText }))
  return { success: false, error }
}
